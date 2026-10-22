"""
roster_import.py
----------------
Parses an uploaded CSV/Excel roster of students identified by Plus Codes and
returns optimizer-ready students (with lat/lng). No database is involved, so
it fits the stateless /api/optimize pipeline.

Required columns:  student_name, plus_code
Accepted aliases:  name / student / full_name, home_plus_code / pluscode /
                   google_plus_code / google_maps_plus_code / open_location_code


Short Plus Codes are completed relative to the school.
Rows that cannot be located are returned in `skipped` with a reason.
"""

import os
import re
from collections import Counter

import pandas as pd

from geocoding import resolve_plus_code
from services.geo_utils import haversine_distance_m

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
SUCCESS_STATUSES = {"decoded", "recovered_short_code"}

MAX_STUDENTS = 2000                  # same limit as /api/optimize
MAX_DISTANCE_FROM_SCHOOL_M = 50_000  # catches mistyped full Plus Codes

COLUMN_ALIASES = {
    "student": "student_name",
    "name": "student_name",
    "full_name": "student_name",
    "pluscode": "plus_code",
    "home_plus_code": "plus_code",
    "plus_code_address": "plus_code",
    "google_plus_code": "plus_code",
    "google_maps_plus_code": "plus_code",
    "open_location_code": "plus_code",
}

# Open Location Code alphabet: 23456789CFGHJMPQRVWX
_PLUS_CODE_PATTERN = re.compile(
    r"(?<![A-Z0-9])[2-9CFGHJMPQRVWX]{2,8}\+[2-9CFGHJMPQRVWX]{2,}",
    re.IGNORECASE,
)

DEFAULT_REASONS = {
    "missing_plus_code": "No Plus Code was provided.",
    "invalid_plus_code": "Missing or invalid Plus Code.",
    "needs_reference_location": (
        "Short Plus Code requires the school's reference location."
    ),
    "too_far_from_school": (
        f"Location is more than {MAX_DISTANCE_FROM_SCHOOL_M // 1000} km "
        "from the school."
    ),
}


class RosterImportError(ValueError):
    """Raised for problems the user can fix (bad file, missing column)."""


def _clean(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def extract_plus_code(cell):
    """
    Pull the code out of text such as "XQ54+J63 Amravati, Maharashtra".
    Falls back to the original text so genuinely invalid values are still
    reported (and never given coordinates) by resolve_plus_code.
    """
    match = _PLUS_CODE_PATTERN.search(cell)
    return match.group(0) if match else cell


def _read_frame(file_storage):
    """Read the uploaded file into a DataFrame with normalized columns."""
    extension = os.path.splitext(file_storage.filename or "")[1].lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise RosterImportError("Only CSV, XLSX and XLS files are supported.")

    try:
        if extension == ".csv":
            df = pd.read_csv(file_storage.stream, dtype=str, encoding="utf-8-sig")
        else:
            df = pd.read_excel(file_storage.stream, dtype=str)
    except Exception as exc:  # pandas raises many different error types
        raise RosterImportError(f"Could not read the file: {exc}") from exc

    df.columns = [
        str(column).strip().lower().replace(" ", "_").replace("-", "_")
        for column in df.columns
    ]
    df = df.rename(columns=COLUMN_ALIASES)

    if "plus_code" not in df.columns:
        raise RosterImportError(
            "The file must contain a plus_code column "
            "(home_plus_code and google_plus_code also work)."
        )

    df = df.dropna(how="all").reset_index(drop=True)

    if df.empty:
        raise RosterImportError("The file contains no student rows.")

    if len(df) > MAX_STUDENTS:
        raise RosterImportError(
            f"The file has {len(df)} rows; the maximum is {MAX_STUDENTS}."
        )

    return df


def import_roster(file_storage, school_lat, school_lng):
    """
    Returns:
        {
          "students": [{id, student_name, name, plus_code, lat, lng}, ...],
          "skipped":  [{row, student_name, plus_code, reason, message}, ...],
          "counts":   {status_or_reason: n, ...},
          "totalRows": n,
        }
    `row` is the spreadsheet row number (header = row 1).
    """
    df = _read_frame(file_storage)

    students = []
    skipped = []
    counts = Counter()

    def skip(row_number, name, plus_code, reason, detail=None):
        counts[reason] += 1
        detail = detail or DEFAULT_REASONS[reason]
        skipped.append({
            "row": row_number,
            "student_name": name,
            "plus_code": plus_code,
            "reason": reason,
            "message": (
                f'Plus Code "{plus_code}" rejected: {detail}'
                if plus_code
                else detail
            ),
        })

    for index, row in df.iterrows():
        row_number = index + 2
        name = _clean(row.get("student_name", "")) or f"Student {index + 1}"
        raw_cell = _clean(row.get("plus_code", ""))

        if not raw_cell:
            skip(row_number, name, "", "missing_plus_code")
            continue

        code = extract_plus_code(raw_cell)

        result = resolve_plus_code(
            code,
            reference_latitude=school_lat,
            reference_longitude=school_lng,
        )
        status = result["status"]

        if status not in SUCCESS_STATUSES:
            reason = (
                status if status in DEFAULT_REASONS else "invalid_plus_code"
            )
            skip(row_number, name, raw_cell, reason, result.get("error"))
            continue

        lat = float(result["latitude"])
        lng = float(result["longitude"])

        if (
            haversine_distance_m(school_lat, school_lng, lat, lng)
            > MAX_DISTANCE_FROM_SCHOOL_M
        ):
            skip(row_number, name, raw_cell, "too_far_from_school")
            continue

        counts[status] += 1
        students.append({
            "id": f"up-{index + 1}",
            "student_name": name,
            "name": name,
            "plus_code": result["plus_code"],
            "lat": lat,
            "lng": lng,
        })

    return {
        "students": students,
        "skipped": skipped,
        "counts": dict(counts),
        "totalRows": len(df),
    }