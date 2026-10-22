"""
geo_utils.py
------------
Small, dependency-free geospatial helper functions used across the
clustering, allocation and routing services. Keeping these in one place
means every distance calculation in the app is guaranteed to be consistent.
"""
import math
from config import EARTH_RADIUS_M


def haversine_distance_m(lat1, lng1, lat2, lng2):
    """Great-circle distance between two lat/lng points, in metres."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (math.sin(d_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_M * c


def bearing_from_origin(origin_lat, origin_lng, lat, lng):
    """
    Compass bearing (0-360 degrees) from an origin point (e.g. the school)
    to a target point. Used by the sweep allocation algorithm to group
    geographically-adjacent pickup points into the same bus route.
    """
    phi1, phi2 = math.radians(origin_lat), math.radians(lat)
    d_lambda = math.radians(lng - origin_lng)

    x = math.sin(d_lambda) * math.cos(phi2)
    y = (math.cos(phi1) * math.sin(phi2) -
         math.sin(phi1) * math.cos(phi2) * math.cos(d_lambda))
    theta = math.atan2(x, y)
    return (math.degrees(theta) + 360) % 360


def centroid(points):
    """Simple arithmetic centroid of a list of (lat, lng) tuples."""
    lat = sum(p[0] for p in points) / len(points)
    lng = sum(p[1] for p in points) / len(points)
    return lat, lng


def medoid(points):
    """
    The point in `points` that minimises the total distance to every other
    point in the set. Unlike a centroid (which can land in the middle of a
    field with no path to it), the medoid is always a *real* location from
    the input data, so it doubles as a safe, practical pickup point.
    Returns the medoid's index in `points`.
    """
    best_idx, best_cost = 0, float("inf")
    for i, (lat_i, lng_i) in enumerate(points):
        cost = sum(
            haversine_distance_m(lat_i, lng_i, lat_j, lng_j)
            for lat_j, lng_j in points
        )
        if cost < best_cost:
            best_cost, best_idx = cost, i
    return best_idx
