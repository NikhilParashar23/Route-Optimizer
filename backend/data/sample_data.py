"""
sample_data.py
--------------
A ready-made dataset so the app is demoable immediately without requiring
the user to type in dozens of student addresses by hand. Coordinates are
spread in a realistic radius around the school location you pass in.
"""
import random

# Default school, used only when no location is supplied.
SCHOOL = {
    "name": "Government college of engineering",
    "lat": 20.959013,
    "lng": 77.755547,
}

_FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Ishaan", "Krishna", "Sai", "Arjun", "Reyansh",
    "Ananya", "Diya", "Isha", "Myra", "Saanvi", "Aadhya", "Kiara", "Anika",
    "Rohan", "Dev", "Kabir", "Nikhil", "Riya", "Meera", "Tara", "Zara",
]
_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Iyer", "Nair", "Kulkarni", "Deshmukh", "Reddy",
    "Patil", "Joshi", "Rao", "Menon", "Chawla", "Bose", "Kapoor", "Naidu",
]


def generate_sample_students(count=60, seed=42, center=None):
    """Randomly generate `count` student homes scattered around `center`
    (a dict with "lat" and "lng"; defaults to SCHOOL) within a few km,
    biased into a handful of loose neighbourhoods so the clustering result
    looks realistic rather than uniformly random."""
    center = center or SCHOOL

    rng = random.Random(seed)
    neighbourhoods = [
        (0.020, 0.015), (-0.025, 0.018), (0.015, -0.028),
        (-0.018, -0.020), (0.032, -0.005), (-0.005, 0.030),
    ]

    students = []
    for i in range(count):
        base_lat_off, base_lng_off = rng.choice(neighbourhoods)
        jitter_lat = rng.uniform(-0.006, 0.006)
        jitter_lng = rng.uniform(-0.006, 0.006)
        students.append({
            "id": f"S{i + 1:03d}",
            "name": f"{rng.choice(_FIRST_NAMES)} {rng.choice(_LAST_NAMES)}",
            "lat": round(float(center["lat"]) + base_lat_off + jitter_lat, 6),
            "lng": round(float(center["lng"]) + base_lng_off + jitter_lng, 6),
            "grade": rng.choice(["1", "2", "3", "4", "5", "6", "7", "8"]),
        })
    return students