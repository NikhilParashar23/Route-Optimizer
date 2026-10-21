
"""
app.py
------
Entry point for the RouteCraft backend.

Pipeline:
students
    -> clustering.py
    -> distance_matrix.py
    -> vrp_solver.py
    -> assign_smallest_suitable_buses()
    -> route_builder.py
    -> JSON response
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

import data.sample_data as _sd
print("LOADING:", _sd.__file__, _sd.SCHOOL)

from config import (
    DEFAULT_MAX_WALK_DISTANCE_M,
    DEFAULT_BUS_CAPACITY,
    DEFAULT_FLEET_SIZE,
    DEFAULT_MAX_ROUTE_DURATION_MIN,
    DEFAULT_DISTANCE_WEIGHT,
    DEFAULT_TIME_WEIGHT,
    DEFAULT_FUEL_EFFICIENCY_KMPL,
    DEFAULT_FUEL_PRICE_PER_LITRE,
)

from data.sample_data import SCHOOL, generate_sample_students

from services.clustering import cluster_students_into_pickup_points
from services.distance_matrix import build_matrix
from services.vrp_solver import solve_vrp, InfeasibleRoutingError
from services.route_builder import build_bus_routes
from upload_routes import upload_bp

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB uploads
app.register_blueprint(upload_bp)

def assign_smallest_suitable_buses(vrp_routes, demands, fleet):
    """
    Assign existing routes to the smallest available suitable buses.

    Route sequences remain unchanged. Routes with larger student counts
    are assigned first so they do not leave only undersized buses for
    larger groups.

    Each bus is used at most once.
    """

    if not vrp_routes:
        return []

    routes_to_assign = []

    for route in vrp_routes:
        route_copy = dict(route)

        student_count = sum(
            int(demands[int(node)])
            for node in route_copy["nodeSequence"]
        )

        route_copy["studentCount"] = student_count
        routes_to_assign.append(route_copy)

    # Allocate larger groups first.
    routes_to_assign.sort(
        key=lambda route: route["studentCount"],
        reverse=True,
    )

    # Sort buses from smallest capacity to largest.
    available_vehicle_indices = sorted(
        range(len(fleet)),
        key=lambda index: (
            int(fleet[index]["capacity"]),
            index,
        ),
    )

    assigned_routes = []

    for route in routes_to_assign:
        required_seats = route["studentCount"]

        suitable_index = next(
            (
                index
                for index in available_vehicle_indices
                if int(fleet[index]["capacity"]) >= required_seats
            ),
            None,
        )

        if suitable_index is None:
            raise InfeasibleRoutingError(
                f"No remaining bus can accommodate "
                f"{required_seats} students. Add buses or increase "
                "the configured seating capacities."
            )

        route["vehicleIndex"] = suitable_index

        available_vehicle_indices.remove(suitable_index)
        assigned_routes.append(route)

    # Keep output order stable.
    return sorted(
        assigned_routes,
        key=lambda route: route["vehicleIndex"],
    )


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "school-bus-route-optimizer",
    })


@app.get("/api/sample-data")
def sample_data():
    count = request.args.get("count", default=60, type=int)
    seed = request.args.get("seed", default=42, type=int)
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    name = request.args.get("name", type=str)

    if count < 1 or count > 2000:
        return jsonify({"error": "Sample student count must be between 1 and 2000."}), 400

    school = dict(SCHOOL)

    if lat is not None and lng is not None:
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return jsonify({"error": "Invalid school coordinates."}), 400
        school["lat"] = lat
        school["lng"] = lng

    if name and name.strip():
        school["name"] = name.strip()[:80]

    students = generate_sample_students(count=count, seed=seed, center=school)

    return jsonify({"school": school, "students": students})


@app.post("/api/optimize")
def optimize():
    payload = request.get_json(force=True, silent=True) or {}

    school = payload.get("school") or SCHOOL
    students = payload.get("students") or []

    try:
        max_walk_distance_m = float(
            payload.get(
                "maxWalkDistanceM",
                DEFAULT_MAX_WALK_DISTANCE_M,
            )
        )

        max_route_duration_min = float(
            payload.get(
                "maxRouteDurationMin",
                DEFAULT_MAX_ROUTE_DURATION_MIN,
            )
        )

        distance_weight = float(
            payload.get("distanceWeight", DEFAULT_DISTANCE_WEIGHT)
        )

        time_weight = float(
            payload.get("timeWeight", DEFAULT_TIME_WEIGHT)
        )

        fuel_efficiency_kmpl = float(
            payload.get(
                "fuelEfficiencyKmpl",
                DEFAULT_FUEL_EFFICIENCY_KMPL,
            )
        )

        fuel_price_per_litre = float(
            payload.get(
                "fuelPricePerLitre",
                DEFAULT_FUEL_PRICE_PER_LITRE,
            )
        )

    except (TypeError, ValueError):
        return jsonify({
            "error": "Optimization settings must contain valid numbers."
        }), 400

    if max_walk_distance_m <= 0:
        return jsonify({
            "error": "Maximum walking distance must be greater than zero."
        }), 400

    if max_route_duration_min <= 0:
        return jsonify({
            "error": "Maximum route duration must be greater than zero."
        }), 400

    if fuel_efficiency_kmpl <= 0:
        return jsonify({
            "error": "Fuel efficiency must be greater than zero."
        }), 400

    if fuel_price_per_litre < 0:
        return jsonify({
            "error": "Fuel price cannot be negative."
        }), 400

    # ---------------------------------------------------------
    # 1. Read fleet configuration
    # ---------------------------------------------------------

    # New format:
    # fleetTypes = [
    #   {"name": "Mini bus", "count": 2, "capacity": 15},
    #   {"name": "Medium bus", "count": 2, "capacity": 25},
    #   {"name": "Large bus", "count": 2, "capacity": 40}
    # ]
    #
    # Legacy busCapacity/fleetSize is still supported.

    fleet_types = payload.get("fleetTypes")

    if fleet_types is None:
        try:
            legacy_capacity = int(
                payload.get("busCapacity", DEFAULT_BUS_CAPACITY)
            )
            legacy_count = int(
                payload.get("fleetSize", DEFAULT_FLEET_SIZE)
            )
        except (TypeError, ValueError):
            return jsonify({
                "error": "Legacy bus capacity and fleet size must be integers."
            }), 400

        fleet_types = [{
            "name": "Standard bus",
            "count": legacy_count,
            "capacity": legacy_capacity,
        }]

    if not isinstance(fleet_types, list) or not fleet_types:
        return jsonify({
            "error": "Configure at least one bus type in the fleet."
        }), 400

    fleet = []

    for item in fleet_types:
        if not isinstance(item, dict):
            return jsonify({
                "error": (
                    "Each bus type must include a name, count, "
                    "and capacity."
                )
            }), 400

        name = str(item.get("name", "Bus")).strip() or "Bus"

        try:
            count = int(item.get("count", 0))
            capacity = int(item.get("capacity", 0))
        except (TypeError, ValueError):
            return jsonify({
                "error": f"Invalid count or capacity for {name}."
            }), 400

        if count < 0 or count > 50:
            return jsonify({
                "error": f"{name}: bus count must be between 0 and 50."
            }), 400

        if capacity < 1 or capacity > 100:
            return jsonify({
                "error": (
                    f"{name}: capacity must be between 1 and 100 seats."
                )
            }), 400

        for _ in range(count):
            fleet.append({
                "busId": f"BUS-{len(fleet) + 1:02d}",
                "busType": name,
                "capacity": capacity,
            })

    fleet_size = len(fleet)
    vehicle_capacities = [
        vehicle["capacity"] for vehicle in fleet
    ]

    # ---------------------------------------------------------
    # 2. Validate students and fleet
    # ---------------------------------------------------------

    if not isinstance(students, list) or not students:
        return jsonify({
            "error": "No student data provided."
        }), 400

    if len(students) > 2000:
        return jsonify({
            "error": "Too many students for a single request (max 2000)."
        }), 400

    if fleet_size == 0:
        return jsonify({
            "error": (
                "Your configured fleet has no buses. "
                "Increase the quantity of at least one bus type."
            )
        }), 422

    total_fleet_capacity = sum(vehicle_capacities)

    if total_fleet_capacity < len(students):
        return jsonify({
            "error": (
                f"The configured fleet has {total_fleet_capacity} seats "
                f"for {len(students)} students. Add buses or increase "
                "one or more bus capacities."
            )
        }), 422

    # ---------------------------------------------------------
    # 3. Cluster students into pickup points
    # ---------------------------------------------------------

    try:
        pickup_points = cluster_students_into_pickup_points(
            students,
            max_walk_distance_m,
        )
    except (ValueError, KeyError, TypeError) as exc:
        return jsonify({
            "error": f"Could not create pickup points: {str(exc)}"
        }), 400

    largest_bus_capacity = max(vehicle_capacities)

    oversized_points = [
        point
        for point in pickup_points
        if int(point["studentCount"]) > largest_bus_capacity
    ]

    if oversized_points:
        point = max(
            oversized_points,
            key=lambda item: item["studentCount"],
        )

        return jsonify({
            "error": (
                f"Pickup point {point['id']} groups "
                f"{point['studentCount']} students, but the largest "
                f"configured bus has only {largest_bus_capacity} seats. "
                "Reduce the maximum walking distance to split the group, "
                "or add a bus with more seats."
            )
        }), 422

    # ---------------------------------------------------------
    # 4. Build road distance and duration matrices
    # ---------------------------------------------------------

    try:
        matrix = build_matrix(school, pickup_points)
    except Exception as exc:
        app.logger.exception("Failed to build distance matrix.")
        return jsonify({
            "error": f"Could not build the road distance matrix: {str(exc)}"
        }), 502

    # ---------------------------------------------------------
    # 5. Optimize the route sequences
    # ---------------------------------------------------------

    demands = [0] + [
        int(point["studentCount"])
        for point in pickup_points
    ]

    try:
        vrp_routes = solve_vrp(
            distance_matrix_m=matrix["distanceMatrixM"],
            duration_matrix_s=matrix["durationMatrixS"],
            demands=demands,
            vehicle_capacities=vehicle_capacities,
            fleet_size=fleet_size,
            max_route_duration_min=max_route_duration_min,
            distance_weight=distance_weight,
            time_weight=time_weight,
        )

        # Important: replace the solver's initial vehicle allocation
        # with the smallest available buses that fit each route.
        # The pickup-point sequences are not changed.
        vrp_routes = assign_smallest_suitable_buses(
            vrp_routes=vrp_routes,
            demands=demands,
            fleet=fleet,
        )

    except InfeasibleRoutingError as exc:
        return jsonify({"error": str(exc)}), 422

    except (ValueError, KeyError, TypeError) as exc:
        return jsonify({
            "error": f"Invalid optimizer input: {str(exc)}"
        }), 400

    # ---------------------------------------------------------
    # 6. Build frontend-ready route objects
    # ---------------------------------------------------------

    try:
        buses = build_bus_routes(
            school=school,
            pickup_points=pickup_points,
            matrix=matrix,
            vrp_routes=vrp_routes,
            fuel_efficiency_kmpl=fuel_efficiency_kmpl,
            fuel_price_per_litre=fuel_price_per_litre,
            fleet=fleet,
        )
    except (ValueError, KeyError, TypeError, RuntimeError) as exc:
        app.logger.exception("Failed to build bus routes.")
        return jsonify({
            "error": f"Could not build final bus routes: {str(exc)}"
        }), 500

    # ---------------------------------------------------------
    # 7. Calculate summary statistics
    # ---------------------------------------------------------

    walk_distances = [
        point["maxWalkDistanceM"]
        for point in pickup_points
    ]

    bus_type_summary = []

    for name in dict.fromkeys(
        vehicle["busType"] for vehicle in fleet
    ):
        matching_vehicles = [
            vehicle for vehicle in fleet
            if vehicle["busType"] == name
        ]

        bus_type_summary.append({
            "name": name,
            "count": len(matching_vehicles),
            "capacity": matching_vehicles[0]["capacity"],
            "used": sum(
                1 for bus in buses
                if bus["busType"] == name
            ),
        })

    stats = {
        "totalStudents": len(students),
        "totalPickupPoints": len(pickup_points),
        "totalBuses": len(buses),
        "fleetSize": fleet_size,
        "totalFleetCapacity": total_fleet_capacity,
        "unusedBuses": fleet_size - len(buses),
        "totalDistanceKm": round(
            sum(bus["totalDistanceKm"] for bus in buses),
            2,
        ),
        "estimatedFleetDurationMin": round(
            max(
                (bus["totalDurationMin"] for bus in buses),
                default=0,
            ),
            1,
        ),
        "avgWalkDistanceM": round(
            sum(walk_distances) / len(walk_distances),
            1,
        ) if walk_distances else 0,
        "maxWalkDistanceM": round(
            max(walk_distances),
            1,
        ) if walk_distances else 0,
        "avgBusUtilizationPct": round(
            sum(bus["utilizationPct"] for bus in buses) / len(buses),
            1,
        ) if buses else 0,
        "unvalidatedPickupPoints": sum(
            1 for point in pickup_points
            if not point["validated"]
        ),
        "totalFuelLitres": round(
            sum(bus["estimatedFuelLitres"] for bus in buses),
            2,
        ),
        "totalFuelCost": round(
            sum(bus["estimatedFuelCost"] for bus in buses),
            2,
        ),
        "routingSource": matrix.get(
            "source",
            "unknown",
        ),
        "busTypeSummary": bus_type_summary,
    }

    return jsonify({
        "school": school,
        "pickupPoints": pickup_points,
        "buses": buses,
        "stats": stats,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)
