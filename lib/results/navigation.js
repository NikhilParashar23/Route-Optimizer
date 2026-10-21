const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const FALLBACK_SPEED_MPS = 8.33; // ~30 km/h, used only for fallback step durations

export function haversine(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function bearing(a, b) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
    Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Backend roadGeometry is [[lat,lng],...] -> path with [lng,lat] + cumulative metres. */
export function buildPath(roadGeometry) {
  const coords = (Array.isArray(roadGeometry) ? roadGeometry : [])
    .map((p) => [Number(p?.[1]), Number(p?.[0])])
    .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
  const cum = [0];
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  }
  return { coords, cum, total: cum[cum.length - 1] || 0 };
}

export function pointAtDistance(path, d) {
  const { coords, cum, total } = path;
  if (coords.length < 2) return null;
  const dist = Math.max(0, Math.min(d, total));
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= dist) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (dist - cum[lo]) / seg;
  const a = coords[lo];
  const b = coords[hi];
  return {
    lng: a[0] + (b[0] - a[0]) * t,
    lat: a[1] + (b[1] - a[1]) * t,
    bearing: bearing(a, b),
    index: lo,
  };
}

export function splitPath(path, d) {
  const p = pointAtDistance(path, d);
  if (!p) return { traveled: [], remaining: path.coords };
  return {
    traveled: [...path.coords.slice(0, p.index + 1), [p.lng, p.lat]],
    remaining: [[p.lng, p.lat], ...path.coords.slice(p.index + 1)],
  };
}

/** Snap a GPS fix to the route. Only searches near/after the last known progress
 *  so the school (start == end) doesn't confuse the match. */
export function snapToPath(path, lng, lat, fromM = 0) {
  let best = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < path.coords.length; i++) {
    if (path.cum[i] < fromM - 50) continue;
    const d = haversine([lng, lat], path.coords[i]);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  return { traveledM: path.cum[bestIdx], offRouteM: best };
}

/**
 * Fallback turn list, used only when the backend sent no OSRM steps.
 * Builds "drive to stop N" + "pickup stop N" steps and a final "arrive at
 * school" step from the road line and the ordered stops. Step shape matches
 * the backend's directions so NavigationPanel and the hook work unchanged.
 * Step locations are [lat, lng].
 */
export function buildFallbackSteps(path, stops = []) {
  if (!path || path.total <= 0) return [];

  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const steps = [];

  const locationAt = (m) => {
    const p = pointAtDistance(path, m);
    return p ? [p.lat, p.lng] : null;
  };

  const drive = (legIndex, fromM, toM, instruction, maneuverType) => {
    const distanceM = Math.max(0, toM - fromM);
    steps.push({
      instruction,
      roadName: "",
      distanceM: Math.round(distanceM * 10) / 10,
      durationS: Math.round((distanceM / FALLBACK_SPEED_MPS) * 10) / 10,
      maneuverType,
      modifier: "",
      location: locationAt(fromM),
      legIndex,
    });
  };

  let from = 0;

  ordered.forEach((stop, i) => {
    const snap = snapToPath(path, Number(stop.lng), Number(stop.lat), from);
    const m = Math.min(path.total, Math.max(from, snap.traveledM));

    drive(
      i,
      from,
      m,
      i === 0 ? "Depart from school" : "Continue along the route",
      i === 0 ? "depart" : "continue"
    );

    steps.push({
      instruction: `Pickup stop ${stop.sequence}: ${
        stop.studentCount ?? 0
      } student(s) board here`,
      roadName: "",
      distanceM: 0,
      durationS: 0,
      maneuverType: "arrive",
      modifier: "",
      location: locationAt(m),
      legIndex: i,
      isStop: true,
      stopSequence: stop.sequence,
      pickupPointId: stop.pickupPointId,
    });

    from = m;
  });

  drive(
    ordered.length,
    from,
    path.total,
    ordered.length ? "Continue to school" : "Follow the route",
    ordered.length ? "continue" : "depart"
  );

  steps.push({
    instruction: "Arrive at school",
    roadName: "",
    distanceM: 0,
    durationS: 0,
    maneuverType: "arrive",
    modifier: "",
    location: locationAt(path.total),
    legIndex: ordered.length,
    isSchool: true,
  });

  return steps;
}

export function formatDistance(m) {
  if (!Number.isFinite(m)) return "—";
  if (m < 100) return `${Math.round(m)} m`;
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatMinutes(min) {
  if (!Number.isFinite(min)) return "—";
  const m = Math.max(0, Math.round(min));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}