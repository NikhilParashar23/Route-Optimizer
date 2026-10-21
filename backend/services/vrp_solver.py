
"""
vrp_solver.py
-------------
Capacity-aware vehicle routing using Google OR-Tools.

Node 0 is the school/depot.
Each remaining node represents a pickup point.
Each vehicle has its own seating capacity.
Route duration includes travel and pickup dwell time.
"""

from ortools.constraint_solver import routing_enums_pb2, pywrapcp

from config import (
    ORTOOLS_SOLVER_TIME_LIMIT_S,
    DWELL_TIME_PER_STOP_MIN,
)


class InfeasibleRoutingError(Exception):
    """Raised when no solution satisfies the configured constraints."""


def solve_vrp(
    distance_matrix_m,
    duration_matrix_s,
    demands,
    vehicle_capacities,
    fleet_size,
    max_route_duration_min,
    distance_weight,
    time_weight,
):
    """Optimize pickup-point routes while respecting bus capacities."""

    n = len(distance_matrix_m)

    # 1. Validate input
    if n == 0:
        raise ValueError("The distance matrix cannot be empty.")

    if len(duration_matrix_s) != n:
        raise ValueError(
            "Distance and duration matrices must have the same size."
        )

    if any(len(row) != n for row in distance_matrix_m):
        raise ValueError("The distance matrix must be square.")

    if any(len(row) != n for row in duration_matrix_s):
        raise ValueError("The duration matrix must be square.")

    if len(demands) != n:
        raise ValueError("The demands list must match the matrix size.")

    if int(demands[0]) != 0:
        raise ValueError("demands[0] must be 0 because node 0 is the school.")

    if fleet_size != len(vehicle_capacities):
        raise ValueError(
            "fleet_size must equal the number of vehicle capacities."
        )

    if fleet_size <= 0:
        raise InfeasibleRoutingError("At least one bus is required.")

    if any(int(capacity) <= 0 for capacity in vehicle_capacities):
        raise ValueError("Every bus capacity must be a positive integer.")

    if any(int(demand) < 0 for demand in demands):
        raise ValueError("Student demands cannot be negative.")

    if max_route_duration_min <= 0:
        raise ValueError(
            "Maximum route duration must be greater than zero."
        )

    if distance_weight < 0 or time_weight < 0:
        raise ValueError("Optimization weights cannot be negative.")

    if distance_weight == 0 and time_weight == 0:
        raise ValueError(
            "At least one optimization weight must be positive."
        )

    if any(
        float(value) < 0
        for matrix in (distance_matrix_m, duration_matrix_s)
        for row in matrix
        for value in row
    ):
        raise ValueError("Distances and durations cannot be negative.")

    total_students = sum(int(demand) for demand in demands)

    if total_students > sum(int(c) for c in vehicle_capacities):
        raise InfeasibleRoutingError(
            "Total student demand exceeds the total seating capacity "
            "of the configured fleet."
        )

    largest_capacity = max(int(c) for c in vehicle_capacities)

    for node in range(1, n):
        if int(demands[node]) > largest_capacity:
            raise InfeasibleRoutingError(
                f"Pickup node {node} contains {demands[node]} students, "
                f"which exceeds the largest bus capacity of "
                f"{largest_capacity}."
            )

    dwell_s = int(float(DWELL_TIME_PER_STOP_MIN) * 60)
    max_duration_s = int(float(max_route_duration_min) * 60)

    # 2. Normalize distance and time so their units are comparable.
    all_distances = [
        float(value)
        for row in distance_matrix_m
        for value in row
    ]
    all_durations = [
        float(value)
        for row in duration_matrix_s
        for value in row
    ]

    distance_scale = max(max(all_distances, default=0.0), 1.0)
    time_scale = max(max(all_durations, default=0.0), 1.0)

    # 3. Create the routing model.
    manager = pywrapcp.RoutingIndexManager(n, fleet_size, 0)
    routing = pywrapcp.RoutingModel(manager)

    def cost_callback(from_index, to_index):
        i = manager.IndexToNode(from_index)
        j = manager.IndexToNode(to_index)

        normalized_distance = (
            float(distance_matrix_m[i][j]) / distance_scale
        )
        normalized_time = (
            float(duration_matrix_s[i][j]) / time_scale
        )

        weighted_cost = (
            float(distance_weight) * normalized_distance
            + float(time_weight) * normalized_time
        )

        return int(round(weighted_cost * 1_000_000))

    cost_index = routing.RegisterTransitCallback(cost_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(cost_index)

    # 4. Enforce individual bus capacities.
    def demand_callback(from_index):
        node = manager.IndexToNode(from_index)
        return int(demands[node])

    demand_index = routing.RegisterUnaryTransitCallback(demand_callback)

    routing.AddDimensionWithVehicleCapacity(
        demand_index,
        0,
        [int(capacity) for capacity in vehicle_capacities],
        True,
        "Capacity",
    )

    # 5. Enforce maximum route duration, including dwell time.
    def time_callback(from_index, to_index):
        i = manager.IndexToNode(from_index)
        j = manager.IndexToNode(to_index)

        travel_s = float(duration_matrix_s[i][j])
        stop_service_s = dwell_s if j != 0 else 0

        return int(round(travel_s + stop_service_s))

    time_index = routing.RegisterTransitCallback(time_callback)

    routing.AddDimension(
        time_index,
        0,
        max_duration_s,
        True,
        "Duration",
    )

    # 6. Configure the search.
    parameters = pywrapcp.DefaultRoutingSearchParameters()

    parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    parameters.time_limit.FromSeconds(
        max(1, int(ORTOOLS_SOLVER_TIME_LIMIT_S))
    )

    # 7. Solve without relaxing constraints.
    solution = routing.SolveWithParameters(parameters)

    if solution is None:
        raise InfeasibleRoutingError(
            "OR-Tools could not find a solution satisfying the fleet "
            "capacities and maximum route duration. Try increasing "
            "the route-duration limit, adding buses, or checking "
            "whether the pickup-point groups are feasible."
        )

    # 8. Extract routes. Bus allocation is refined in app.py afterward.
    routes = []

    for vehicle_id in range(fleet_size):
        index = routing.Start(vehicle_id)
        sequence = []

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)

            if node != 0:
                sequence.append(node)

            index = solution.Value(routing.NextVar(index))

        # Ignore unused vehicles.
        if sequence:
            student_count = sum(
                int(demands[node]) for node in sequence
            )

            capacity = int(vehicle_capacities[vehicle_id])

            if student_count > capacity:
                raise RuntimeError(
                    f"Solver assigned {student_count} students to "
                    f"vehicle {vehicle_id}, whose capacity is {capacity}."
                )

            routes.append({
                "vehicleIndex": vehicle_id,
                "nodeSequence": sequence,
                "studentCount": student_count,
            })

    return routes
