"""
clustering.py
--------------
Step 1 of the pipeline: turn a flat list of individual student home
locations into a small number of shared "pickup points".

Algorithm: DBSCAN + walking-distance repair
---------------------------------------------
1. DBSCAN (density-based clustering) groups students who are close to each
   other, using the haversine metric so distances are real-world metres,
   not flat-earth degrees. `eps` is set to the configured max walking
   distance, and `min_samples=1` so no student is ever discarded as noise -
   an isolated student simply becomes their own pickup point.

2. Walking-distance validation & repair: DBSCAN only guarantees that
   consecutive points in a cluster are within `eps` of *some* neighbour
   (density-reachability), which can, in rare chained configurations,
   place two students in the same cluster who are farther apart than
   `eps`. We explicitly re-check every cluster against the medoid and
   split any cluster that violates the walking-distance constraint using
   complete-linkage clustering (which *does* give a hard guarantee on
   maximum pairwise distance). This two-stage approach keeps DBSCAN's
   realistic, density-aware grouping while still making a hard promise:
   no student is ever farther than `max_walk_distance_m` from their
   assigned pickup point.
"""
import numpy as np
from sklearn.cluster import DBSCAN, AgglomerativeClustering

from config import DBSCAN_MIN_SAMPLES, EARTH_RADIUS_M
from services.geo_utils import haversine_distance_m, medoid
from services.validation import validate_pickup_point


def cluster_students_into_pickup_points(students, max_walk_distance_m):
    """
    students: list of dicts -> {id, name, lat, lng}
    Returns: list of pickup point dicts ->
        {id, lat, lng, studentIds, studentCount, maxWalkDistanceM, validated, ...}
    """
    n = len(students)
    if n == 0:
        return []

    if n == 1:
        return [_make_pickup_point(0, students, max_walk_distance_m)]

    raw_groups = _dbscan_group(students, max_walk_distance_m)

    # Walking-distance validation & repair: split any group that breaks the
    # walking-distance promise into sub-groups that satisfy it.
    final_groups = []
    for group in raw_groups:
        final_groups.extend(_repair_group(group, max_walk_distance_m))

    return [
        _make_pickup_point(idx, group, max_walk_distance_m)
        for idx, group in enumerate(final_groups)
    ]


def _dbscan_group(students, max_walk_distance_m):
    """Runs DBSCAN with the haversine metric and returns a list of
    student-groups (each group is a list of student dicts)."""
    coords_rad = np.radians([[s["lat"], s["lng"]] for s in students])
    eps_rad = max_walk_distance_m / EARTH_RADIUS_M

    labels = DBSCAN(
        eps=eps_rad,
        min_samples=DBSCAN_MIN_SAMPLES,
        metric="haversine",
    ).fit_predict(coords_rad)

    groups = {}
    for student, label in zip(students, labels):
        groups.setdefault(label, []).append(student)
    return list(groups.values())


def _repair_group(group, max_walk_distance_m):
    """If every member of `group` is already within max_walk_distance_m of
    the group's medoid, return it unchanged. Otherwise, split it using
    complete-linkage clustering (hard max-pairwise-distance guarantee) and
    return the resulting sub-groups."""
    if len(group) == 1:
        return [group]

    points = [(m["lat"], m["lng"]) for m in group]
    medoid_idx = medoid(points)
    medoid_lat, medoid_lng = points[medoid_idx]

    walk_ok = all(
        haversine_distance_m(m["lat"], m["lng"], medoid_lat, medoid_lng) <= max_walk_distance_m
        for m in group
    )
    if walk_ok:
        return [group]

    # Split with a hard distance guarantee.
    n = len(group)
    dist_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            d = haversine_distance_m(*points[i], *points[j])
            dist_matrix[i][j] = dist_matrix[j][i] = d

    model = AgglomerativeClustering(
        metric="precomputed",
        linkage="complete",
        distance_threshold=max_walk_distance_m,
        n_clusters=None,
    )
    sub_labels = model.fit_predict(dist_matrix)

    sub_groups = {}
    for member, label in zip(group, sub_labels):
        sub_groups.setdefault(label, []).append(member)
    return list(sub_groups.values())


def _make_pickup_point(pp_id, members, max_walk_distance_m):
    points = [(m["lat"], m["lng"]) for m in members]
    medoid_idx = medoid(points) if len(points) > 1 else 0
    lat, lng = points[medoid_idx]

    walk_distances = [haversine_distance_m(m["lat"], m["lng"], lat, lng) for m in members]
    max_walk = max(walk_distances)
    validation = validate_pickup_point(lat, lng)

    return {
        "id": f"PP-{pp_id + 1:03d}",
        "lat": lat,
        "lng": lng,
        "studentIds": [m["id"] for m in members],
        "studentNames": [m["name"] for m in members],
        "studentCount": len(members),
        "maxWalkDistanceM": round(max_walk, 1),
        "avgWalkDistanceM": round(sum(walk_distances) / len(walk_distances), 1),
        "walkDistanceOk": max_walk <= max_walk_distance_m + 1e-6,
        "validated": validation["validated"],
        "validationNote": validation["note"],
    }
