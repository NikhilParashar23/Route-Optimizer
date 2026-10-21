"""
route_builder.py
----------------
Converts optimized routes into frontend-ready bus route objects.

Matrix node 0 is the school.
Matrix node k corresponds to pickup_points[k - 1].
Each route contains vehicleIndex, nodeSequence, and studentCount.
"""

from services.osrm_client import get_route_details
from config import DWELL_TIME_PER_STOP_MIN


def _annotate_directions(directions, stops):
    """
    Mark OSRM steps that correspond to pickup stops or the school.

    The OSRM route is requested as school -> stop 1 -> ... -> stop N -> school,
    so it has N + 1 legs:
        leg 0 ends at stops[0], leg 1 ends at stops[1], ...
        the final leg (index N) ends at the school.
    Each leg finishes with one "arrive" step.
    """
    for step in directions:
        leg = step["legIndex"]
        maneuver_type = step["maneuverType"]

        if maneuver_type == "arrive":
            if leg < len(stops):
                stop = stops[leg]
                step["isStop"] = True
                step["stopSequence"] = stop["sequence"]
                step["pickupPointId"] = stop["pickupPointId"]
                step["instruction"] = (
                    f"Pickup stop {stop['sequence']}: "
                    f"{stop['studentCount']} student(s) board here"
                )
            else:
                step["isSchool"] = True
                step["instruction"] = "Arrive at school"

        elif maneuver_type == "depart" and leg > 0:
            # Every leg after the first starts from a pickup stop,
            # so "Depart" reads better as "Continue".
            step["instruction"] = step["instruction"].replace(
                "Depart", "Continue", 1
            )

    return directions

def _fallback_directions(school, stops, return_distance_m):
    """Pickup-stop itinerary used when OSRM returns no turn-by-turn steps."""
    school_loc = [school["lat"], school["lng"]]  # [lat, lng], as the frontend expects
    leg_dist = [s["legDistanceM"] for s in stops] + [round(return_distance_m, 1)]

    steps = [{
        "instruction": "Depart from school",
        "roadName": "", "distanceM": leg_dist[0], "durationS": 0,
        "maneuverType": "depart", "modifier": "",
        "location": school_loc, "legIndex": 0,
    }]

    for i, stop in enumerate(stops):
        steps.append({
            "instruction": (
                f"Pickup stop {stop['sequence']}: "
                f"{stop['studentCount']} student(s) board here"
            ),
            "roadName": "", "distanceM": leg_dist[i + 1], "durationS": 0,
            "maneuverType": "arrive", "modifier": "",
            "location": [stop["lat"], stop["lng"]],
            "legIndex": i,
            "isStop": True,
            "stopSequence": stop["sequence"],
            "pickupPointId": stop["pickupPointId"],
        })

    steps.append({
        "instruction": "Arrive at school",
        "roadName": "", "distanceM": 0, "durationS": 0,
        "maneuverType": "arrive", "modifier": "",
        "location": school_loc,
        "legIndex": len(stops),
        "isSchool": True,
    })
    return steps


def build_bus_routes(
    school,
    pickup_points,
    matrix,
    vrp_routes,
    fuel_efficiency_kmpl,
    fuel_price_per_litre,
    fleet,
):
    """Build validated, frontend-ready bus route dictionaries."""

    distance_m = matrix["distanceMatrixM"]
    duration_s = matrix["durationMatrixS"]

    points_count = len(pickup_points) + 1
    dwell_s = float(DWELL_TIME_PER_STOP_MIN) * 60

    # Validate matrix dimensions.
    for name, values in (
        ("distance", distance_m),
        ("duration", duration_s),
    ):
        if len(values) != points_count:
            raise ValueError(
                f"The {name} matrix must contain {points_count} rows."
            )

        if any(len(row) != points_count for row in values):
            raise ValueError(
                f"Every row in the {name} matrix must have "
                f"{points_count} entries."
            )

    if not fleet:
        raise ValueError("Fleet cannot be empty.")

    # Validate fuel settings once, before building any route.
    fuel_efficiency = float(fuel_efficiency_kmpl)
    fuel_price = float(fuel_price_per_litre)

    if fuel_efficiency <= 0:
        raise ValueError("Fuel efficiency must be greater than zero.")

    if fuel_price < 0:
        raise ValueError("Fuel price cannot be negative.")

    buses = []
    visited_nodes = set()
    used_vehicle_indices = set()

    for route in vrp_routes:
        vehicle_index = int(route["vehicleIndex"])
        node_sequence = route["nodeSequence"]

        if vehicle_index < 0 or vehicle_index >= len(fleet):
            raise ValueError(
                f"Invalid vehicleIndex {vehicle_index} in VRP route."
            )

        if vehicle_index in used_vehicle_indices:
            raise ValueError(
                f"Vehicle index {vehicle_index} was assigned to "
                "more than one route."
            )

        used_vehicle_indices.add(vehicle_index)

        vehicle = fleet[vehicle_index]
        capacity = int(vehicle["capacity"])

        if capacity <= 0:
            raise ValueError(
                f"Vehicle {vehicle.get('busId', vehicle_index)} "
                "must have a positive capacity."
            )

        stops = []
        cumulative_distance_m = 0.0
        cumulative_elapsed_s = 0.0
        previous_node = 0

        for sequence, node_value in enumerate(node_sequence, start=1):
            node = int(node_value)

            if node <= 0 or node >= points_count:
                raise ValueError(f"Invalid pickup node {node}.")

            if node in visited_nodes:
                raise ValueError(
                    f"Pickup node {node} appears in multiple routes."
                )

            visited_nodes.add(node)
            pickup = pickup_points[node - 1]

            leg_distance_m = float(distance_m[previous_node][node])
            leg_duration_s = float(duration_s[previous_node][node])

            cumulative_distance_m += leg_distance_m
            cumulative_elapsed_s += leg_duration_s

            stops.append({
                "sequence": sequence,
                "pickupPointId": pickup["id"],
                "lat": pickup["lat"],
                "lng": pickup["lng"],
                "studentCount": int(pickup["studentCount"]),
                "studentNames": pickup.get("studentNames", []),
                "legDistanceM": round(leg_distance_m, 1),
                "cumulativeDistanceKm": round(
                    cumulative_distance_m / 1000.0, 2
                ),
                "etaMinutesFromDeparture": round(
                    cumulative_elapsed_s / 60.0, 1
                ),
                "validated": pickup.get("validated", True),
                "walkDistanceOk": pickup.get("walkDistanceOk", True),
            })

            # Dwell time is added after arrival at each pickup.
            cumulative_elapsed_s += dwell_s
            previous_node = node

        # Calculate return journey to school.
        if node_sequence:
            return_distance_m = float(distance_m[previous_node][0])
            return_duration_s = float(duration_s[previous_node][0])
        else:
            return_distance_m = 0.0
            return_duration_s = 0.0

        total_distance_m = cumulative_distance_m + return_distance_m
        total_duration_s = cumulative_elapsed_s + return_duration_s

        total_distance_km = total_distance_m / 1000.0
        total_duration_min = total_duration_s / 60.0

        # Validate route demand against pickup-point demand.
        assigned_students = sum(
            int(stop["studentCount"]) for stop in stops
        )

        solver_student_count = route.get("studentCount")

        if (
            solver_student_count is not None
            and assigned_students != int(solver_student_count)
        ):
            raise ValueError(
                f"Student-count mismatch for vehicle {vehicle_index}: "
                f"solver reported {solver_student_count}, "
                f"but route builder counted {assigned_students}."
            )

        if assigned_students > capacity:
            raise ValueError(
                f"{vehicle.get('busId', vehicle_index)} has capacity "
                f"{capacity}, but its route contains "
                f"{assigned_students} students."
            )

        # Fuel estimates.
        fuel_litres = total_distance_km / fuel_efficiency
        fuel_cost = fuel_litres * fuel_price

        # Road-following geometry and turn-by-turn directions.
        # Waypoints: school -> every stop in order -> school.
        ordered_points = (
            [school]
            + [
                {"lat": stop["lat"], "lng": stop["lng"]}
                for stop in stops
            ]
            + ([school] if stops else [])
        )

        route_details = get_route_details(ordered_points) if stops else None

        road_geometry = (
            route_details["roadGeometry"] if route_details else []
        )

        directions = (
            route_details["directions"] if route_details else []
        )

        directions_source = "osrm"
        if directions:
            _annotate_directions(directions, stops)
        elif stops:
            directions = _fallback_directions(school, stops, return_distance_m)
            directions_source = "stops-only"

        utilization_pct = (
            100.0 * assigned_students / capacity
            if capacity > 0
            else 0.0
        )

        buses.append({
            "busId": vehicle["busId"],
            "busType": vehicle.get("busType"),
            "vehicleIndex": vehicle_index,
            "capacity": capacity,
            "studentCount": assigned_students,
            "utilizationPct": round(utilization_pct, 1),
            "stops": stops,
            "totalDistanceKm": round(total_distance_km, 2),
            "totalDurationMin": round(total_duration_min, 1),
            "estimatedFuelLitres": round(fuel_litres, 2),
            "estimatedFuelCost": round(fuel_cost, 2),
            "roadGeometry": road_geometry,
            "directions": directions,
            "directionsSource": directions_source,
        })

    # Every pickup point must be present in exactly one route.
    expected_nodes = set(range(1, points_count))

    if visited_nodes != expected_nodes:
        missing_nodes = sorted(expected_nodes - visited_nodes)
        raise ValueError(
            f"Some pickup points were not assigned to a route: "
            f"{missing_nodes}"
        )

    return sorted(buses, key=lambda bus: bus["vehicleIndex"])