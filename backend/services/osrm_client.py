
"""
osrm_client.py
--------------
OSRM client for road distance matrices, road geometry, and
turn-by-turn route directions.
"""

import logging

import requests

from config import OSRM_BASE_URL, OSRM_PROFILE, OSRM_TIMEOUT_S

logger = logging.getLogger(__name__)


def _coords_param(points):
    """OSRM expects longitude,latitude pairs separated by semicolons."""
    return ";".join(
        f'{float(point["lng"])},{float(point["lat"])}'
        for point in points
    )


def get_distance_duration_matrix(points):
    """
    Return (distance_matrix_m, duration_matrix_s).
    Return (None, None) if OSRM is unavailable.
    """
    if len(points) < 2:
        return [[0]], [[0]]

    url = (
        f"{OSRM_BASE_URL.rstrip('/')}/table/v1/"
        f"{OSRM_PROFILE}/{_coords_param(points)}"
    )

    try:
        response = requests.get(
            url,
            params={"annotations": "distance,duration"},
            timeout=OSRM_TIMEOUT_S,
        )
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok":
            logger.warning(
                "OSRM table error: %s",
                data.get("code"),
            )
            return None, None

        return data["distances"], data["durations"]

    except (
        requests.RequestException,
        ValueError,
        KeyError,
        TypeError,
    ):
        logger.exception("Failed to fetch OSRM distance matrix")
        return None, None


def _get_route_data(points):
    """Fetch an OSRM route with full geometry and maneuver steps."""
    if len(points) < 2:
        return None

    url = (
        f"{OSRM_BASE_URL.rstrip('/')}/route/v1/"
        f"{OSRM_PROFILE}/{_coords_param(points)}"
    )

    try:
        response = requests.get(
            url,
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "true",
                "alternatives": "false",
            },
            timeout=OSRM_TIMEOUT_S,
        )
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            logger.warning("OSRM route error: %s", data.get("code"))
            return None

        return data["routes"][0]

    except (
        requests.RequestException,
        ValueError,
        KeyError,
        TypeError,
    ):
        logger.exception("Failed to fetch OSRM route")
        return None


def _format_maneuver(maneuver, road_name=""):
    """Convert OSRM maneuver information into readable instructions."""
    maneuver_type = maneuver.get("type", "continue")
    modifier = maneuver.get("modifier", "")
    exit_number = maneuver.get("exit")

    if maneuver_type == "depart":
        instruction = "Depart"

    elif maneuver_type == "arrive":
        instruction = "Arrive at your destination"

    elif maneuver_type == "turn":
        instruction = (
            f"Turn {modifier}" if modifier else "Turn"
        )

    elif maneuver_type == "continue":
        instruction = (
            f"Continue {modifier}" if modifier else "Continue"
        )

    elif maneuver_type == "new name":
        instruction = "Continue"

    elif maneuver_type == "merge":
        instruction = (
            f"Merge {modifier}" if modifier else "Merge"
        )

    elif maneuver_type == "on ramp":
        instruction = (
            f"Take the ramp {modifier}"
            if modifier
            else "Take the ramp"
        )

    elif maneuver_type == "off ramp":
        instruction = (
            f"Take the exit ramp {modifier}"
            if modifier
            else "Take the exit ramp"
        )

    elif maneuver_type == "fork":
        instruction = (
            f"Keep {modifier} at the fork"
            if modifier
            else "Continue at the fork"
        )

    elif maneuver_type == "end of road":
        instruction = (
            f"At the end of the road, turn {modifier}"
            if modifier
            else "At the end of the road"
        )

    elif maneuver_type in ("roundabout", "rotary"):
        instruction = "Enter the roundabout"

    elif maneuver_type == "roundabout turn":
        instruction = (
            f"At the roundabout, turn {modifier}"
            if modifier
            else "Continue through the roundabout"
        )

    elif maneuver_type == "notification":
        instruction = "Follow the road"

    else:
        instruction = maneuver_type.replace("_", " ").capitalize()

    if (
        exit_number is not None
        and maneuver_type in (
            "roundabout",
            "rotary",
            "roundabout turn",
        )
    ):
        instruction += f", take exit {exit_number}"

    if road_name:
        instruction += f" onto {road_name}"

    return instruction


def _extract_directions(route):
    """Extract turn-by-turn instructions from an OSRM route response."""
    directions = []

    for leg_index, leg in enumerate(route.get("legs", [])):
        for step in leg.get("steps", []):
            maneuver = step.get("maneuver") or {}
            road_name = step.get("name") or ""
            location = maneuver.get("location") or []

            # OSRM maneuver coordinates are [longitude, latitude].
            maneuver_location = (
                [location[1], location[0]]
                if len(location) >= 2
                else None
            )

            directions.append({
                "instruction": _format_maneuver(
                    maneuver,
                    road_name,
                ),
                "roadName": road_name,
                "distanceM": round(
                    float(step.get("distance", 0)), 1
                ),
                "durationS": round(
                    float(step.get("duration", 0)), 1
                ),
                "maneuverType": maneuver.get(
                    "type",
                    "continue",
                ),
                "modifier": maneuver.get("modifier", ""),
                "location": maneuver_location,
                "legIndex": leg_index,
            })

    if not directions:
        logger.warning(
            "OSRM returned route geometry but no turn-by-turn steps. "
            "Check the route response and OSRM configuration."
        )

    return directions


def get_route_details(points):
    """
    Fetch geometry and directions together.

    Returns:
        {
            "roadGeometry": [[lat, lng], ...],
            "directions": [...]
        }

    Returns None if OSRM cannot provide a route.
    """
    route = _get_route_data(points)

    if not route:
        return None

    try:
        coordinates = route["geometry"]["coordinates"]

        road_geometry = [
            [float(lat), float(lng)]
            for lng, lat in coordinates
        ]

        directions = _extract_directions(route)

        return {
            "roadGeometry": road_geometry,
            "directions": directions,
        }

    except (
        KeyError,
        TypeError,
        ValueError,
        IndexError,
    ):
        logger.exception("Failed to parse OSRM route details")
        return None


def get_route_geometry(points):
    """Return road geometry as [lat, lng] pairs."""
    details = get_route_details(points)
    return details["roadGeometry"] if details else None


def get_route_directions(points):
    """Return turn-by-turn instructions for an ordered route."""
    details = get_route_details(points)
    return details["directions"] if details else None
