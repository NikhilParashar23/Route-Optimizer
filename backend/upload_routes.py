"""
upload_routes.py
----------------
POST /api/upload-students   (multipart/form-data)

Fields:
    file        CSV / XLSX / XLS roster (student_name, plus_code)
    schoolLat   school latitude  (used to complete short Plus Codes)
    schoolLng   school longitude
"""

from flask import Blueprint, jsonify, request

from services.roster_import import RosterImportError, import_roster

upload_bp = Blueprint("upload", __name__)


@upload_bp.app_errorhandler(413)
def file_too_large(_error):
    return jsonify({"error": "The uploaded file is too large (max 5 MB)."}), 413


@upload_bp.post("/api/upload-students")
def upload_students():
    file = request.files.get("file")

    if file is None or not file.filename:
        return jsonify({"error": "No file was uploaded."}), 400

    try:
        school_lat = float(request.form["schoolLat"])
        school_lng = float(request.form["schoolLng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "schoolLat and schoolLng are required numbers."
        }), 400

    if abs(school_lat) > 90 or abs(school_lng) > 180:
        return jsonify({"error": "The school location is out of range."}), 400

    try:
        result = import_roster(file, school_lat, school_lng)
    except RosterImportError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result)