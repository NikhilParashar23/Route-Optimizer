// Plain fetch client (no axios dependency).
// Point NEXT_PUBLIC_API_URL at your Flask server; defaults to port 5001.
const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"
).replace(/\/$/, "");

async function request(path, { method = "GET", params, body, timeoutMs = 90000 } = {}) {
  const url = new URL(BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, String(value))
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      /* non-JSON response */
    }

    if (!response.ok) {
      const error = new Error(data?.error || `Request failed (${response.status})`);
      // Same shape the form already reads: error.response.data.error
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The backend took too long to respond.");
    }
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach the backend at ${BASE_URL}. Is Flask running?`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchSampleData(count = 60, school = null, seed = null) {
  const params = { count };
  if (school?.lat != null && school?.lng != null) {
    params.lat = school.lat;
    params.lng = school.lng;
  }
  if (school?.name) params.name = school.name;
  if (seed != null) params.seed = seed;
  return request("/api/sample-data", { params });
}

export function runOptimizer(payload) {
  return request("/api/optimize", { method: "POST", body: payload }); // { school, pickupPoints, buses, stats }
}

export function checkHealth() {
  return request("/api/health");
}