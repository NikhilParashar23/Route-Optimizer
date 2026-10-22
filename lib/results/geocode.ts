/**
 * lib/results/geocode.ts
 * ----------------------
 * Turns whatever the user typed into school coordinates.
 *
 * Accepted input:
 *   1. Coordinates:        "20.9597, 77.7505"
 *   2. Full Plus Code:     "7JFVXQ52+V5H"
 *   3. Short Plus Code:    "XQ54+J63 Amravati, Maharashtra"
 *                          (the locality is geocoded to find the right area)
 *   4. Address / place:    "Government College of Engineering, Amravati"
 */

export type LatLng = { lat: number; lng: number };

export type ResolvedLocation = LatLng & {
  label: string;
  source: 'coordinates' | 'pluscode' | 'address';
};

/* -------------------------------------------------------------------------- */
/* Plus Code maths (pair section only: accurate to ~14 m)                      */
/* -------------------------------------------------------------------------- */

const ALPHABET = '23456789CFGHJMPQRVWX';
const PAIR_RES = [20, 1, 0.05, 0.0025, 0.000125];

function encodePairs(lat: number, lng: number): string {
  let latV = Math.min(Math.max(lat, -90), 89.999999) + 90;
  let lngV = (((lng + 180) % 360) + 360) % 360;
  let code = '';

  for (const res of PAIR_RES) {
    const li = Math.min(19, Math.floor(latV / res));
    const gi = Math.min(19, Math.floor(lngV / res));
    latV -= li * res;
    lngV -= gi * res;
    code += ALPHABET[li] + ALPHABET[gi];
  }

  return code;
}

function decodePairs(code: string): LatLng {
  let digits = code.replace('+', '').toUpperCase().slice(0, 10);
  if (digits.length % 2) digits = digits.slice(0, -1);
  if (digits.length < 2) throw new Error('That Plus Code is too short.');

  let lat = -90;
  let lng = -180;
  let size = PAIR_RES[0];

  for (let i = 0; i < digits.length; i += 2) {
    const res = PAIR_RES[i / 2];
    const a = ALPHABET.indexOf(digits[i]);
    const b = ALPHABET.indexOf(digits[i + 1]);
    if (a < 0 || b < 0) throw new Error('That Plus Code has invalid characters.');
    lat += a * res;
    lng += b * res;
    size = res;
  }

  return { lat: lat + size / 2, lng: lng + size / 2 };
}

/** Complete a short code using the nearest match to a reference point. */
function recoverNearest(shortCode: string, ref: LatLng): LatLng {
  const plus = shortCode.indexOf('+');
  const padding = 8 - plus;
  const resolution = Math.pow(20, 2 - padding / 2);
  const half = resolution / 2;

  const prefix = encodePairs(ref.lat, ref.lng).slice(0, padding);
  const area = decodePairs(prefix + shortCode.replace('+', ''));

  let { lat, lng } = area;
  const latDiff = lat - ref.lat;
  const lngDiff = lng - ref.lng;

  if (latDiff > half) lat -= resolution;
  else if (latDiff < -half) lat += resolution;

  if (lngDiff > half) lng -= resolution;
  else if (lngDiff < -half) lng += resolution;

  return { lat: Math.min(90, Math.max(-90, lat)), lng };
}

/* -------------------------------------------------------------------------- */
/* Geocoding (OpenStreetMap Nominatim)                                         */
/* -------------------------------------------------------------------------- */

async function geocodeAddress(query: string): Promise<(LatLng & { label: string }) | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
    encodeURIComponent(query);

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  if (!results.length) return null;

  const lat = Number(results[0].lat);
  const lng = Number(results[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, label: results[0].display_name };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

const COORDINATES = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const PLUS_CODE = /^\s*([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,3})(?:[\s,]+(.+))?$/i;

/**
 * @param input     text from the form
 * @param reference used to complete short Plus Codes when no locality
 *                  is typed (or the locality cannot be found)
 */
export async function resolveLocation(
  input: string,
  reference: LatLng
): Promise<ResolvedLocation> {
  const text = input.trim();
  if (!text) throw new Error('Enter a school location.');

  // 1. Plain coordinates
  const coords = text.match(COORDINATES);
  if (coords) {
    const lat = Number(coords[1]);
    const lng = Number(coords[2]);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Coordinates must be latitude (-90 to 90) then longitude (-180 to 180).');
    }
    return { lat, lng, label: `${lat}, ${lng}`, source: 'coordinates' };
  }

  // 2. Plus Code (full or short)
  const plus = text.match(PLUS_CODE);
  if (plus) {
    const code = plus[1].toUpperCase();
    const locality = plus[2]?.trim();
    const prefixLength = code.indexOf('+');

    if (prefixLength === 8) {
      const point = decodePairs(code);
      return { ...point, label: code, source: 'pluscode' };
    }

    if (prefixLength % 2 === 0 && prefixLength >= 2 && prefixLength < 8) {
      let ref = reference;

      if (locality) {
        try {
          const place = await geocodeAddress(locality);
          if (place) ref = place;
        } catch {
          /* fall back to the reference point */
        }
      }

      const point = recoverNearest(code, ref);
      return {
        ...point,
        label: locality ? `${code} ${locality}` : code,
        source: 'pluscode',
      };
    }

    throw new Error('That Plus Code is not valid. Example: XQ52+V5H Amravati');
  }

  // 3. Address or place name
  const place = await geocodeAddress(text);
  if (!place) {
    throw new Error(
      'Could not find that location. Try "latitude, longitude" (for example 20.9597, 77.7505).'
    );
  }

  return { lat: place.lat, lng: place.lng, label: place.label, source: 'address' };
}