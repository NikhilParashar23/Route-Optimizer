"""
trip_routes.py
--------------
REST endpoints for shared bus trips.

    POST   /api/trips                 create a trip from one bus route
    GET    /api/trips/<id>/driver     full route          (driver token)
    GET    /api/trips/<id>/public     redacted route      (parent or driver token)
    GET    /api/trips/<id>/live       live position       (parent or driver token)
    POST   /api/trips/<id>/location   publish a position  (driver token)
    DELETE /api/trips/<id>            revoke both links   (driver token)

The token is sent in the X-Trip-Token header (or ?t= for simple links).
"""

import math
import time

from flask import Blueprint, jsonify, request

from trip_store import (
    MAX_GEOMETRY_POINTS,
    live_view,
    role_for,
    sanitize_public_bus,
    store,
)

trips_bp = Blueprint("trips", __name__, url_prefix="/api/trips")

VALID_POST_STATUSES = {"running", "paused", "finished", "idle"}
MIN_POST_INTERVAL_S = 0.5


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #

def _error(message, code):
    return jsonify({"error": message}), code


def _number(value, low, high, default=None):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number) or number < low or number > high:
        return default
    return number


def _token():
    return request.headers.get("X-Trip-Token") or request.args.get("t", "")


def _authorize(trip_id, allowed_roles):
    """Returns (trip, role, None) or (None, None, error_response)."""
    trip = store.get(trip_id)
    if not trip:
        return None, None, _error("This link has expired or does not exist.", 404)

    role = role_for(trip, _token())
    if role not in allowed_roles:
        return None, None, _error("This link is not valid for that action.", 403)

    return trip, role, None


def _validate_bus(bus):
    if not isinstance(bus, dict):
        return "Missing bus route."

    geometry = bus.get("roadGeometry")
    if not isinstance(geometry, list) or len(geometry) < 2:
        return "The route has no road geometry to share."
    if len(geometry) > MAX_GEOMETRY_POINTS:
        return "The route geometry is too large."

    for point in geometry:
        if (
            not isinstance(point, (list, tuple))
            or len(point) < 2
            or _number(point[0], -90, 90) is None
            or _number(point[1], -180, 180) is None
        ):
            return "The route geometry contains an invalid point."

    stops = bus.get("stops")
    if not isinstance(stops, list) or not stops:
        return "The route has no pickup stops."

    for stop in stops:
        if (
            not isinstance(stop, dict)
            or _number(stop.get("lat"), -90, 90) is None
            or _number(stop.get("lng"), -180, 180) is None
            or _number(stop.get("sequence"), 0, 100_000) is None
        ):
            return "A pickup stop is missing its position."

    return None


# --------------------------------------------------------------------------- #
# endpoints
# --------------------------------------------------------------------------- #

@trips_bp.post("")
def create_trip():
    payload = request.get_json(silent=True) or {}
    bus = payload.get("bus")
    school = payload.get("school") or {}

    problem = _validate_bus(bus)
    if problem:
        return _error(problem, 400)

    if _number(school.get("lat"), -90, 90) is None or _number(school.get("lng"), -180, 180) is None:
        return _error("The school location is missing.", 400)

    trip = store.create(bus, school)

    return jsonify({
        "tripId": trip["id"],
        "driverToken": trip["driver_token"],
        "parentToken": trip["parent_token"],
        "expiresAt": int(trip["expires_at"] * 1000),
    }), 201


@trips_bp.get("/<trip_id>/driver")
def driver_view(trip_id):
    trip, _, error = _authorize(trip_id, {"driver"})
    if error:
        return error

    return jsonify({
        "bus": trip["bus"],
        "school": trip["school"],
        "live": live_view(trip),
        "expiresAt": int(trip["expires_at"] * 1000),
    })


@trips_bp.get("/<trip_id>/public")
def public_view(trip_id):
    trip, _, error = _authorize(trip_id, {"parent", "driver"})
    if error:
        return error

    return jsonify({
        "bus": sanitize_public_bus(trip["bus"]),
        "school": trip["school"],
        "live": live_view(trip),
    })


@trips_bp.get("/<trip_id>/live")
def live(trip_id):
    trip, _, error = _authorize(trip_id, {"parent", "driver"})
    if error:
        return error

    response = jsonify(live_view(trip))
    response.headers["Cache-Control"] = "no-store"
    return response


@trips_bp.post("/<trip_id>/location")
def post_location(trip_id):
    trip, _, error = _authorize(trip_id, {"driver"})
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")

    if status not in VALID_POST_STATUSES:
        return _error("Invalid status.", 400)

    now = time.time()

    if status == "idle":
        store.update_live(trip, None)
        return jsonify({"ok": True})

    last = trip["live"]
    if last and now - last["updatedAt"] < MIN_POST_INTERVAL_S and last["status"] == status:
        return jsonify({"ok": True, "skipped": True})

    lat = _number(payload.get("lat"), -90, 90)
    lng = _number(payload.get("lng"), -180, 180)
    if lat is None or lng is None:
        return _error("Invalid position.", 400)

    stops_total = len(trip["bus"].get("stops") or [])

    live_state = {
        "status": status,
        "mode": "sim" if payload.get("mode") == "sim" else "gps",
        "lat": lat,
        "lng": lng,
        "bearing": _number(payload.get("bearing"), 0, 360, 0.0),
        "accuracy": _number(payload.get("accuracy"), 0, 100_000),
        "traveledM": _number(payload.get("traveledM"), 0, trip["total_m"] * 1.05 + 50, 0.0),
        "stopsDone": int(_number(payload.get("stopsDone"), 0, stops_total, 0)),
        "updatedAt": now,
    }

    store.update_live(trip, live_state)
    return jsonify({"ok": True})


@trips_bp.delete("/<trip_id>")
def revoke(trip_id):
    trip, _, error = _authorize(trip_id, {"driver"})
    if error:
        return error

    store.delete(trip_id)
    return jsonify({"ok": True})

