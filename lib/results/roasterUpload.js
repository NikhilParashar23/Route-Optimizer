// lib/results/roasterUpload.js

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

/**
 * Sends a CSV/Excel roster to Flask. The school location is sent so short
 * Plus Codes can be completed relative to it.
 *
 * @param {File} file
 * @param {{ lat: number, lng: number }} school
 */
export async function uploadStudentRoster(file, school) {
  const body = new FormData();
  body.append('file', file);
  body.append('schoolLat', String(school.lat));
  body.append('schoolLng', String(school.lng));

  // Do not set Content-Type yourself; the browser adds the multipart boundary.
  const response = await fetch(`${BASE_URL}/api/upload-students`, {
    method: 'POST',
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Upload failed (HTTP ${response.status}).`);
  }

  return data;
}