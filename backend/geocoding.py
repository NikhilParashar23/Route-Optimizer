
"""
geocoding.py
------------
Resolves Open Location Codes (Plus Codes) into coordinates.

- Full Plus Codes are decoded directly.
- Short Plus Codes require a reference location.
- Invalid codes never receive coordinates.
- No address-based geocoding or city-centre fallback.
"""

import re
from openlocationcode import openlocationcode as olc


def normalize_plus_code(plus_code):
    """Normalize whitespace and letter case."""
    if plus_code is None:
        return ""

    return re.sub(r"\s+", "", str(plus_code)).upper()


def resolve_plus_code(
    plus_code,
    reference_latitude=None,
    reference_longitude=None,
):
    """
    Resolve a Plus Code.

    Returns:
        {
            "plus_code": str,
            "latitude": float | None,
            "longitude": float | None,
            "status": str,
            "error": str | None
        }
    """

    code = normalize_plus_code(plus_code)

    result = {
        "plus_code": code,
        "latitude": None,
        "longitude": None,
        "status": "invalid_plus_code",
        "error": None,
    }

    if not code or not olc.isValid(code):
        result["error"] = "Missing or invalid Plus Code."
        return result

    try:
        if olc.isFull(code):
            decoded = olc.decode(code)
            result.update({
                "latitude": decoded.latitudeCenter,
                "longitude": decoded.longitudeCenter,
                "status": "decoded",
                "error": None,
            })
            return result

        # Short Plus Codes need a known reference location.
        if reference_latitude is None or reference_longitude is None:
            result.update({
                "status": "needs_reference_location",
                "error": (
                    "Short Plus Code requires the school's "
                    "reference latitude and longitude."
                ),
            })
            return result

        ref_lat = float(reference_latitude)
        ref_lng = float(reference_longitude)

        if not (-90 <= ref_lat <= 90 and -180 <= ref_lng <= 180):
            result["error"] = "Invalid reference coordinates."
            return result

        recovered = olc.recoverNearest(code, ref_lat, ref_lng)

        if not olc.isValid(recovered) or not olc.isFull(recovered):
            result["error"] = "Could not recover the short Plus Code."
            return result

        decoded = olc.decode(recovered)

        result.update({
            "plus_code": code,
            "latitude": decoded.latitudeCenter,
            "longitude": decoded.longitudeCenter,
            "status": "recovered_short_code",
            "error": None,
        })

        return result

    except (ValueError, TypeError, OverflowError) as exc:
        result["error"] = str(exc)
        return result
