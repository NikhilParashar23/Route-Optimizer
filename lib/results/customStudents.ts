import { resolveLocation, type LatLng } from '@/lib/results/geocode';

export type CustomStudentInput = {
  name?: string;
  plusCode?: string;
  landmark?: string;
};

export type RosterStudent = {
  id: string;
  name: string;
  student_name: string;
  plus_code: string;
  landmark: string;
  lat: number;
  lng: number;
  custom: true;
};

// A mistyped Plus Code can resolve to another city. Reject anything this far
// from the school instead of silently creating a huge outlier pickup point.
const MAX_DISTANCE_FROM_SCHOOL_M = 50_000;

const isFilled = (entry: CustomStudentInput) =>
  Boolean(
    entry.name?.trim() || entry.plusCode?.trim() || entry.landmark?.trim()
  );

function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Number of form rows the user actually filled in. */
export function countCustomStudents(entries?: CustomStudentInput[]): number {
  return (entries ?? []).filter(isFilled).length;
}

/**
 * Convert the "Custom student entries" rows into roster students with real
 * coordinates, ready to be appended to the Flask-generated roster.
 * Uses the Plus Code if given (completed relative to the school), otherwise
 * the landmark. Rows are resolved one at a time to be gentle on geocoders.
 */
export async function resolveCustomStudents(
  entries: CustomStudentInput[] | undefined,
  school: LatLng
): Promise<RosterStudent[]> {
  const rows = (entries ?? []).filter(isFilled);
  const result: RosterStudent[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name?.trim() || `Custom student ${i + 1}`;
    const plusCode = row.plusCode?.trim() || '';
    const landmark = row.landmark?.trim() || '';
    const query = plusCode || landmark;

    if (!query) {
      throw new Error(`${name}: enter a Home Plus Code or a landmark.`);
    }

    let point: LatLng;
    try {
      const resolved = await resolveLocation(query, school);
      point = { lat: Number(resolved.lat), lng: Number(resolved.lng) };
    } catch (error) {
      const reason = error instanceof Error ? ` ${error.message}` : '';
      throw new Error(`${name}: could not locate "${query}".${reason}`);
    }

    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      throw new Error(`${name}: "${query}" did not resolve to a valid location.`);
    }

    if (distanceM(point, school) > MAX_DISTANCE_FROM_SCHOOL_M) {
      throw new Error(
        `${name}: "${query}" is more than ${
          MAX_DISTANCE_FROM_SCHOOL_M / 1000
        } km from the school. Check the Plus Code or landmark.`
      );
    }

    result.push({
      id: `custom-${i + 1}`,
      name,
      student_name: name,
      plus_code: plusCode,
      landmark,
      lat: point.lat,
      lng: point.lng,
      custom: true,
    });
  }

  return result;
}