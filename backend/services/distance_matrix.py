"""
distance_matrix.py
-------------------
Step in the pipeline between clustering and route optimization: builds a
full pairwise distance (metres) and travel-time (seconds) matrix between
the school and every pickup point.

Real road data (via OSRM, see osrm_client.py) is always tried first, since
straight-line distance systematically under-estimates how far a bus
actually has to drive around blocks, rivers, one-way streets, etc. If OSRM
is unreachable, the system falls back to haversine distance combined with
an assumed average road speed, so the optimizer still produces a usable
(if less precise) result instead of failing outright.
"""
from services.geo_utils import haversine_distance_m
from services.osrm_client import get_distance_duration_matrix
from config import FALLBACK_AVERAGE_SPEED_KMPH


def build_matrix(school, pickup_points):
    """
    Returns a dict:
        {
          "points": [school, *pickup_points]   # index 0 is always the school
          "distanceMatrixM": [[...], ...],
          "durationMatrixS": [[...], ...],
          "source": "osrm" | "haversine_fallback",
        }
    """
    points = [school] + pickup_points

    distance_m, duration_s = get_distance_duration_matrix(points)
    if distance_m is not None and duration_s is not None:
        return {
            "points": points,
            "distanceMatrixM": distance_m,
            "durationMatrixS": duration_s,
            "source": "osrm",
        }

    # --- fallback: haversine distance + assumed average speed ---
    n = len(points)
    distance_m = [[0.0] * n for _ in range(n)]
    duration_s = [[0.0] * n for _ in range(n)]
    speed_mps = (FALLBACK_AVERAGE_SPEED_KMPH * 1000) / 3600

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            d = haversine_distance_m(points[i]["lat"], points[i]["lng"], points[j]["lat"], points[j]["lng"])
            distance_m[i][j] = d
            duration_s[i][j] = d / speed_mps

    return {
        "points": points,
        "distanceMatrixM": distance_m,
        "durationMatrixS": duration_s,
        "source": "haversine_fallback",
    }
