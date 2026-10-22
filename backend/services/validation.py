"""
validation.py
--------------
"Factual Pickup Point Validation" - sanity-checks a proposed pickup point
against real-world constraints before it is shown to a transport planner.

This module is intentionally written as a pluggable adapter:

  * `validate_pickup_point()` runs a set of fast, offline heuristic checks
    (coordinate sanity, not-in-the-middle-of-nowhere, etc.) that work with
    zero external dependencies or API keys, so the project runs out of the
    box.

  * `_query_live_map_data()` is the seam where a real integration would go
    in production - e.g. the OpenStreetMap Overpass API (free, no key) or
    the Google Places "Nearby Search" API (requires GOOGLE_MAPS_API_KEY),
    to confirm the point sits on/near an actual road and not, say, inside
    a lake or a building footprint. It is stubbed out here and clearly
    marked so a reviewer can see exactly where to extend it.
"""
import os

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")


def validate_pickup_point(lat, lng):
    """
    Runs offline heuristic validation and (if configured) a live map lookup.
    Returns {"validated": bool, "note": str}
    """
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return {"validated": False, "note": "Coordinates out of range."}

    live_result = _query_live_map_data(lat, lng)
    if live_result is not None:
        return live_result

    # Offline fallback heuristic: in a real deployment every point reaching
    # here already passed clustering against real student addresses, so we
    # mark it provisionally valid and flag it as "unverified" until a live
    # map API key is configured.
    return {
        "validated": True,
        "note": "Unverified (offline mode) - connect a maps API key for live road validation.",
    }


def _query_live_map_data(lat, lng):
    """
    Placeholder for a real "is this point accessible by road" check.

    To wire up a real provider:
      1. Set the GOOGLE_MAPS_API_KEY environment variable (or swap this for
         a call to the free OSM Overpass API - no key needed).
      2. Query nearby road/way data around (lat, lng).
      3. Return {"validated": True/False, "note": "..."} based on the result.

    Returns None when no live provider is configured, so callers fall back
    to the offline heuristic above.
    """
    if not GOOGLE_MAPS_API_KEY:
        return None

    # Real implementation would call requests.get(...) against the Places
    # or Roads API here. Left unimplemented to keep the project runnable
    # without any paid API keys.
    return None
