"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildPath,
  pointAtDistance,
  bearing,
  haversine,
} from "@/lib/results/navigation";
import { buildFallbackSteps } from "@/lib/results/fallbackSteps";

const BASE_SPEED_MPS = 8.33; // ~30 km/h at 1x
const ON_ROUTE_M = 60; // a fix this close to the line counts as "on route"

/**
 * Match a GPS fix to the route using only a window around the last known
 * progress. Searching the whole route would confuse the start and the end
 * (both are the school) and roads the route passes twice.
 */
function snapNear(path, lng, lat, fromM, aheadM = 200, behindM = 30) {
  const { coords, cum } = path;
  const kx = Math.cos((lat * Math.PI) / 180) * 111320; // metres per degree lng
  const ky = 110540; // metres per degree lat
  let best = { dist: Infinity, traveledM: fromM };

  for (let i = 0; i < coords.length - 1; i++) {
    if (cum[i + 1] < fromM - behindM) continue;
    if (cum[i] > fromM + aheadM) break;

    const ax = (coords[i][0] - lng) * kx;
    const ay = (coords[i][1] - lat) * ky;
    const bx = (coords[i + 1][0] - lng) * kx;
    const by = (coords[i + 1][1] - lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t =
      len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const dist = Math.hypot(ax + t * dx, ay + t * dy);

    if (dist < best.dist) {
      best = { dist, traveledM: cum[i] + t * (cum[i + 1] - cum[i]) };
    }
  }

  return { traveledM: best.traveledM, offRouteM: best.dist };
}

function gpsErrorMessage(err) {
  if (err.code === 1) {
    return "Location permission was denied. Allow location access for this site.";
  }
  if (err.code === 2) {
    return "Your position is unavailable. Check that device location is turned on.";
  }
  if (err.code === 3) {
    return "Timed out while getting your location. Trying again…";
  }
  return err.message || "Could not read your location.";
}

export function useRouteNavigation(bus) {
  const path = useMemo(() => buildPath(bus?.roadGeometry), [bus]);

  // Use real OSRM steps when the backend sent them. If it sent none (or only
  // a stops-only placeholder), build turns + pickup stops from the road line.
  const steps = useMemo(() => {
    const backend = Array.isArray(bus?.directions) ? bus.directions : [];
    const hasRoadSteps =
      backend.length > 0 && bus?.directionsSource !== "stops-only";

    let raw = backend;
    if (!hasRoadSteps && path.total > 0) {
      raw = buildFallbackSteps(path, bus?.stops ?? []);
    }

    let acc = 0;
    return raw.map((d) => {
      const s = { ...d, startM: acc };
      acc += Number(d.distanceM) || 0;
      return s;
    });
  }, [bus, path]);

  const [status, setStatus] = useState("idle"); // idle | running | paused | finished
  const [mode, setMode] = useState("sim"); // sim | gps
  const [speed, setSpeed] = useState(4);
  const [follow, setFollow] = useState(true);
  const [traveledM, setTraveledM] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [gpsError, setGpsError] = useState("");
  // The device's real position: { lat, lng, bearing, accuracy }.
  const [gpsFix, setGpsFix] = useState(null);

  const traveledRef = useRef(0);
  const lastFixRef = useRef(null);

  // Reset whenever another bus is opened.
  useEffect(() => {
    traveledRef.current = 0;
    lastFixRef.current = null;
    setTraveledM(0);
    setStatus("idle");
    setOffRoute(false);
    setGpsError("");
    setGpsFix(null);
    setFollow(true);
  }, [bus]);

  // Simulation: move a vehicle along the road geometry.
  useEffect(() => {
    if (status !== "running" || mode !== "sim" || path.total <= 0) return;
    let raf;
    let last = performance.now();
    let lastEmit = 0;

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      traveledRef.current = Math.min(
        path.total,
        traveledRef.current + dt * BASE_SPEED_MPS * speed
      );
      const done = traveledRef.current >= path.total;
      if (done || now - lastEmit > 100) {
        lastEmit = now;
        setTraveledM(traveledRef.current);
      }
      if (done) {
        setStatus("finished");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, mode, speed, path]);

  // Real GPS (the device running the page). Needs HTTPS or localhost.
  // The marker always follows the REAL position; route progress only
  // advances while that position is actually on the planned route.
  useEffect(() => {
    if (status !== "running" || mode !== "gps") return;

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported in this browser.");
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setGpsError(
        "GPS needs a secure page. Open the app over HTTPS or on localhost."
      );
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, heading } = pos.coords;
        setGpsError("");

        // Heading: the device's own value when moving, otherwise derived
        // from the previous fix, otherwise the last known heading.
        const previous = lastFixRef.current;
        let course = previous?.bearing ?? 0;
        if (Number.isFinite(heading)) {
          course = heading;
        } else if (
          previous &&
          haversine([previous.lng, previous.lat], [lng, lat]) > 4
        ) {
          course = bearing([previous.lng, previous.lat], [lng, lat]);
        }

        const fix = { lat, lng, bearing: course, accuracy };
        lastFixRef.current = fix;
        setGpsFix(fix); // <- this is what the map shows

        // Route progress: only from reasonably accurate fixes near the line.
        if (path.total <= 0 || (Number.isFinite(accuracy) && accuracy > 50)) {
          return;
        }

        let snap = snapNear(path, lng, lat, traveledRef.current);
        if (snap.offRouteM > ON_ROUTE_M) {
          // Wider look-ahead (fast movement or a GPS gap), accepted only
          // when the fix is genuinely on the line.
          const wide = snapNear(path, lng, lat, traveledRef.current, 5001);
          if (wide.offRouteM <= 40) snap = wide;
        }

        const off = snap.offRouteM > ON_ROUTE_M;
        setOffRoute(off);
        if (off) return; // never move route progress from an off-route fix

        if (snap.traveledM > traveledRef.current) {
          traveledRef.current = snap.traveledM;
          setTraveledM(traveledRef.current);
        }

        if (traveledRef.current >= path.total - 15) setStatus("finished");
      },
      (err) => setGpsError(gpsErrorMessage(err)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [status, mode, path]);

  const start = (m = "sim") => {
    setMode(m);
    setGpsError("");
    if (m === "gps") {
      lastFixRef.current = null;
      setGpsFix(null);
      setOffRoute(false);
    }
    if (status === "idle" || status === "finished") {
      traveledRef.current = 0;
      setTraveledM(0);
    }
    setFollow(true);
    setStatus("running");
  };
  const pause = () => setStatus("paused");
  const resume = () => setStatus("running");
  const stop = () => {
    traveledRef.current = 0;
    lastFixRef.current = null;
    setTraveledM(0);
    setGpsFix(null);
    setOffRoute(false);
    setStatus("idle");
  };

  // ---- Derived values -----------------------------------------------------
  const lastStep = steps[steps.length - 1];
  const stepsTotal = lastStep
    ? lastStep.startM + (Number(lastStep.distanceM) || 0)
    : 0;
  const scale = path.total > 0 && stepsTotal > 0 ? stepsTotal / path.total : 1;
  const traveledOnSteps = traveledM * scale;

  let stepIndex = 0;
  steps.forEach((s, i) => {
    if (s.startM <= traveledOnSteps + 0.5) stepIndex = i;
  });

  const nextStep = steps[stepIndex + 1] ?? null;
  const distanceToNextM = nextStep
    ? Math.max(0, (nextStep.startM - traveledOnSteps) / scale)
    : 0;
  const stopsDone = steps.filter(
    (s) => s.isStop && s.startM <= traveledOnSteps + 5
  ).length;

  const ratio = path.total > 0 ? Math.min(1, traveledM / path.total) : 0;
  const remainingM = Math.max(0, path.total - traveledM);
  const remainingMin = (Number(bus?.totalDurationMin) || 0) * (1 - ratio);

  // Simulation: a point on the route. GPS: the device's real position
  // (never the school / route start).
  const simPosition = status === "idle" ? null : pointAtDistance(path, traveledM);
  const position =
    mode === "gps" ? (status === "idle" ? null : gpsFix) : simPosition;

  // True between pressing "Use GPS" and the first location fix arriving.
  const locating =
    mode === "gps" && status === "running" && !gpsFix && !gpsError;

  return {
    path, steps, status, mode, speed, setSpeed, follow, setFollow,
    traveledM, position, stepIndex, nextStep, distanceToNextM, stopsDone,
    remainingM, remainingMin, progressPct: ratio * 100, offRoute, gpsError,
    gpsAccuracy: gpsFix?.accuracy ?? null,
    locating,
    start, pause, resume, stop,
  };
}