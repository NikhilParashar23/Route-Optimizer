"""
config.py
---------
All tunable constants live here so the rest of the codebase never hard-codes
"magic numbers". Anyone reviewing the project can understand and change the
optimizer's behaviour by editing only this file.
"""
import os

# ---------------------------------------------------------------------------
# Walking distance & pickup clustering
# ---------------------------------------------------------------------------
# Default maximum distance (metres) a student is expected to walk to reach a
# common pickup point. Overridable per-request from the frontend.
DEFAULT_MAX_WALK_DISTANCE_M = 400

# DBSCAN requires at least this many points to even attempt density-based
# grouping; a single student always becomes their own pickup point.
DBSCAN_MIN_SAMPLES = 1

# Earth radius used for haversine distance calculations (metres).
EARTH_RADIUS_M = 6371000

# ---------------------------------------------------------------------------
# Bus fleet & routing constraints
# ---------------------------------------------------------------------------
DEFAULT_BUS_CAPACITY = 40
DEFAULT_FLEET_SIZE = 8                 # max number of buses available
DEFAULT_MAX_ROUTE_DURATION_MIN = 60    # a single student should not ride longer than this

# Extra dwell time added for every stop a bus makes (boarding, safety
# checks), in minutes. Included in the OR-Tools duration dimension AND in
# the final ETA calculation shown to the user.
DWELL_TIME_PER_STOP_MIN = 1.5

# ---------------------------------------------------------------------------
# Road network (OSRM) integration
# ---------------------------------------------------------------------------
# Public demo server by default - no API key required. Point this at a
# self-hosted OSRM instance in production via the OSRM_BASE_URL env var.
OSRM_BASE_URL = os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org")
OSRM_PROFILE = "driving"
OSRM_TIMEOUT_S = 8

# Fallback average road speed (km/h) used ONLY when OSRM is unreachable, to
# turn straight-line (haversine) distance into a rough travel time estimate.
FALLBACK_AVERAGE_SPEED_KMPH = 28

# ---------------------------------------------------------------------------
# Multi-objective cost weighting (distance vs. time)
# ---------------------------------------------------------------------------
# OR-Tools needs a single scalar arc cost. We combine distance (metres) and
# duration (seconds) into one number:
#
#     arc_cost = DISTANCE_WEIGHT * distance_m + TIME_WEIGHT * duration_s
#
# TIME_WEIGHT is expressed in "metres per second of travel time" - i.e. how
# many metres of extra distance the solver should be willing to accept to
# save one second of travel time. A higher value makes the solver prioritise
# short journey times over short distances.
DEFAULT_DISTANCE_WEIGHT = 1.0
DEFAULT_TIME_WEIGHT = 4.0  # ~ willing to add 4m of driving to save 1s of time

# Time given to the OR-Tools local search metaheuristic before it must
# return its best solution so far (keeps the API responsive).
ORTOOLS_SOLVER_TIME_LIMIT_S = 8

# ---------------------------------------------------------------------------
# Fuel estimation (post-hoc, NOT part of the optimization objective)
# ---------------------------------------------------------------------------
# Fuel is estimated *after* the optimizer has already minimized distance and
# time, using a simple vehicle fuel-efficiency figure. This keeps the model
# technically honest: we are not pretending to optimize fuel burn directly
# without a real fuel-consumption model, only reporting an estimate derived
# from the optimized route.
DEFAULT_FUEL_EFFICIENCY_KMPL = 8.0   # km travelled per litre of diesel
DEFAULT_FUEL_PRICE_PER_LITRE = 100.0  # currency units per litre
