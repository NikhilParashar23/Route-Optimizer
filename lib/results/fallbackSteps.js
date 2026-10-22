import { pointAtDistance } from "@/lib/results/navigation";

const FALLBACK_SPEED_MPS = 8.33; // ~30 km/h, used only for step durations

/**
 * Nearest route vertex at or after `fromM` (small tolerance behind).
 * Self-contained so it does not depend on other helpers in navigation.js.
 */
function snapStopToPath(path, lng, lat, fromM) {
  const { coords, cum } = path;
  const kx = Math.cos((lat * Math.PI) / 180) * 111320;
  const ky = 110540;
  let bestDist = Infinity;
  let bestM = fromM;

  for (let i = 0; i < coords.length; i++) {
    if (cum[i] < fromM - 50) continue;
    const dx = (coords[i][0] - lng) * kx;
    const dy = (coords[i][1] - lat) * ky;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestM = cum[i];
    }
  }

  return bestM;
}

/**
 * Fallback turn list, used only when the backend sent no OSRM steps.
 * Builds "drive to stop N" + "pickup stop N" steps and a final
 * "arrive at school" step from the road line and the ordered stops.
 * The step shape matches the backend's directions, so the panel and the
 * hook work unchanged. Step locations are [lat, lng].
 *
 * path: { coords: [[lng, lat], ...], cum: [metres...], total: metres }
 */
export function buildFallbackSteps(path, stops = []) {
  if (!path || !(path.total > 0)) return [];

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
    const snapped = snapStopToPath(
      path,
      Number(stop.lng),
      Number(stop.lat),
      from
    );
    const m = Math.min(path.total, Math.max(from, snapped));

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