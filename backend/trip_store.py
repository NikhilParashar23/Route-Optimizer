
"""
trip_store.py
-------------
Temporary in-memory storage for shared bus routes.
No database required.
"""

import math
import secrets
import time
from threading import RLock

MAX_GEOMETRY_POINTS = 20_000
TRIP_LIFETIME_SECONDS = 12 * 60 * 60  # 12 hours


def _distance_m(point_a, point_b):
    """Calculate distance between [lat, lng] points in metres."""
    lat1, lng1 = map(math.radians, point_a[:2])
    lat2, lng2 = map(math.radians, point_b[:2])

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    value = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2)
        * math.sin(dlng / 2) ** 2
    )
    return 6_371_000 * 2 * math.asin(min(1, math.sqrt(value)))


def _route_distance(bus):
    geometry = bus.get("roadGeometry") or []
    return sum(
        _distance_m(geometry[i - 1], geometry[i])
        for i in range(1, len(geometry))
    )


class TripStore:
    def __init__(self):
        self._trips = {}
        self._lock = RLock()

    def _remove_expired(self):
        now = time.time()
        expired = [
            trip_id
            for trip_id, trip in self._trips.items()
            if trip["expires_at"] <= now
        ]
        for trip_id in expired:
            del self._trips[trip_id]

    def create(self, bus, school):
        now = time.time()

        # Copy the incoming objects so callers cannot mutate stored data.
        bus_copy = dict(bus)
        school_copy = dict(school)

        trip = {
            "id": secrets.token_urlsafe(12),
            "driver_token": secrets.token_urlsafe(32),
            "parent_token": secrets.token_urlsafe(32),
            "bus": bus_copy,
            "school": school_copy,
            "live": None,
            "total_m": _route_distance(bus_copy),
            "created_at": now,
            "expires_at": now + TRIP_LIFETIME_SECONDS,
        }

        with self._lock:
            self._remove_expired()
            self._trips[trip["id"]] = trip

        return trip

    def get(self, trip_id):
        with self._lock:
            self._remove_expired()
            return self._trips.get(trip_id)

    def update_live(self, trip, live_state):
        with self._lock:
            current = self._trips.get(trip["id"])
            if current is not None:
                current["live"] = live_state

    def delete(self, trip_id):
        with self._lock:
            self._trips.pop(trip_id, None)


store = TripStore()


def role_for(trip, token):
    if not token:
        return None
    if secrets.compare_digest(token, trip["driver_token"]):
        return "driver"
    if secrets.compare_digest(token, trip["parent_token"]):
        return "parent"
    return None


def live_view(trip):
    live = trip.get("live")

    if live is None:
        return {
            "status": "not_started",
            "position": None,
            "updatedAt": None,
        }

    # Return a copy rather than exposing the stored dictionary.
    age_seconds = max(0, time.time() - live["updatedAt"])
    result = dict(live)

    # The position may be stale if the driver's phone stops sending GPS.
    result["stale"] = age_seconds > 30
    result["ageSeconds"] = int(age_seconds)

    return result


def sanitize_public_bus(bus):
    """
    Public/parent view: route and stop coordinates only.
    Never expose student names, phone numbers, addresses, or IDs.
    """
    safe_stops = []

    for stop in bus.get("stops", []):
        safe_stop = {
            key: stop[key]
            for key in ("lat", "lng", "sequence")
            if key in stop
        }

        # Keep a generic stop label only if one exists.
        if isinstance(stop.get("name"), str):
            safe_stop["name"] = stop["name"]

        safe_stops.append(safe_stop)

    return {
        "roadGeometry": bus.get("roadGeometry", []),
        "stops": safe_stops,
        "busName": bus.get("busName") or bus.get("name") or "School Bus",
        "capacity": bus.get("capacity"),
    }
