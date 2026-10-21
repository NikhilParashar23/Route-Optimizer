"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colorForBus } from "@/lib/results/busPalette";
import { splitPath } from "@/lib/results/navigation";

/*
 * WHY THIS LINE EXISTS
 * maplibre-gl 6.x loads its web worker from a separate file and only finds it
 * on its own when import.meta.url is an http(s) URL. Under Next.js it isn't,
 * so the map silently never renders. The file is copied into /public by
 * scripts/copy-maplibre-worker.js.
 */
const WORKER_PATH = "/maplibre-gl-worker.js";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(new URL(WORKER_PATH, window.location.origin).href);
}

const DEFAULT_CENTER = [77.755547, 20.959013]; // [lng, lat]

const ROUTE_SRC = "routecraft-bus-routes";
const ROUTE_ROAD_LAYER = "routecraft-bus-route-road";
const ROUTE_FALLBACK_LAYER = "routecraft-bus-route-fallback";

const NAV_TRAVELED_SRC = "routecraft-nav-traveled";
const NAV_REMAINING_SRC = "routecraft-nav-remaining";
const NAV_TRAVELED_LAYER = "routecraft-nav-traveled-line";
const NAV_REMAINING_LAYER = "routecraft-nav-remaining-line";

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };

const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/bright";
const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

/* ------------------------------------------------------------------------ */
/* DOM helpers                                                               */
/* ------------------------------------------------------------------------ */

function makePopup(title, rows) {
  const container = document.createElement("div");
  container.style.cssText =
    "font:13px/1.6 system-ui,sans-serif;min-width:160px;color:#17202a";

  const heading = document.createElement("strong");
  heading.textContent = title;
  container.appendChild(heading);

  rows.forEach(([label, value]) => {
    if (value === undefined || value === null || value === "") return;
    const line = document.createElement("div");
    line.textContent = `${label}: ${value}`;
    container.appendChild(line);
  });

  return container;
}

function makeMarker(color, label, size = 28) {
  const element = document.createElement("div");
  element.textContent = label;
  element.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${color};border:2px solid #0A0C10;
    box-shadow:0 2px 12px #0008;
    font:700 ${Math.round(size * 0.5)}px/1 system-ui,sans-serif;color:#0A0C10;
    cursor:pointer;
  `;
  return element;
}

// Numbered pickup stop used during navigation. state: done | next | pending
function makeStopElement(color, label, state) {
  const size = state === "next" ? 38 : 30;
  const background =
    state === "done" ? "#5b6573" : state === "next" ? "#FFC93C" : color;

  const element = document.createElement("div");
  element.textContent = state === "done" ? "✓" : String(label);
  element.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${background};color:#0A0C10;
    font:700 ${state === "next" ? 15 : 13}px/1 monospace;
    border:2px solid ${state === "next" ? "#ffffff" : "#0A0C10"};
    box-shadow:${
      state === "next"
        ? "0 0 0 5px #FFC93C55, 0 2px 12px #000a"
        : "0 2px 10px #0008"
    };
    opacity:${state === "done" ? 0.7 : 1};
    cursor:pointer;
  `;
  return element;
}

function makeVehicleElement(color) {
  const element = document.createElement("div");
  element.textContent = "▲";
  element.style.cssText = `
    width:36px;height:36px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${color};color:#0A0C10;font-size:16px;line-height:1;
    border:3px solid #ffffff;
    box-shadow:0 0 0 6px ${color}55, 0 3px 14px #000a;
  `;
  return element;
}

/* ------------------------------------------------------------------------ */
/* Data helpers                                                              */
/* ------------------------------------------------------------------------ */

function getLatLng(item) {
  const lat = Number(item?.lat ?? item?.latitude);
  const lng = Number(item?.lng ?? item?.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }
  return { lat, lng };
}

function getStopStudents(point) {
  if (Array.isArray(point?.students)) return point.students;
  if (Array.isArray(point?.studentNames)) {
    return point.studentNames.map((name) => ({ name }));
  }
  return [];
}

function lineData(coords) {
  return coords.length > 1
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        ],
      }
    : EMPTY_COLLECTION;
}

// Backend geometry is [lat, lng]; MapLibre needs [lng, lat].
function toLngLatCoords(roadGeometry) {
  return (Array.isArray(roadGeometry) ? roadGeometry : [])
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const lat = Number(point[0]);
      const lng = Number(point[1]);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        return null;
      }
      return [lng, lat];
    })
    .filter(Boolean);
}

// Landmark labels (gymkhana, canteen, parking...) drawn by us, straight from
// the base map's own vector tiles. This bypasses the style's POI filters and
// ranks, which hide small places, and always sits above the route lines.
const LANDMARK_TEXT_LAYER = "routecraft-landmark-labels";
const LANDMARK_DOT_LAYER = "routecraft-landmark-dots";

function addLandmarkLabels(map, theme) {
  const style = map.getStyle();
  if (!style) return;

  const vectorSourceId = Object.keys(style.sources ?? {}).find(
    (id) => style.sources[id].type === "vector"
  );
  if (!vectorSourceId) return;

  const dark = theme === "dark";
  const textColor = dark ? "#E6EDF3" : "#1B2430";
  const haloColor = dark ? "#0D1117" : "#FFFFFF";

  // Reuse a font the style already ships, so glyphs are guaranteed to load.
  const fontLayer = (style.layers ?? []).find(
    (layer) => layer.type === "symbol" && layer.layout?.["text-font"]
  );
  const font = fontLayer?.layout?.["text-font"] ?? ["Noto Sans Regular"];

  [LANDMARK_TEXT_LAYER, LANDMARK_DOT_LAYER].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });

  map.addLayer({
    id: LANDMARK_DOT_LAYER,
    type: "circle",
    source: vectorSourceId,
    "source-layer": "poi",
    minzoom: 14,
    filter: ["has", "name"],
    paint: {
      "circle-radius": 3,
      "circle-color": textColor,
      "circle-stroke-color": haloColor,
      "circle-stroke-width": 1.5,
    },
  });

  map.addLayer({
    id: LANDMARK_TEXT_LAYER,
    type: "symbol",
    source: vectorSourceId,
    "source-layer": "poi",
    minzoom: 14,
    filter: ["has", "name"],
    layout: {
      "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
      "text-font": font,
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 0.7],
      "text-max-width": 8,
      "text-padding": 3,
      "text-optional": true,
      "symbol-sort-key": ["coalesce", ["get", "rank"], 1000],
    },
    paint: {
      "text-color": textColor,
      "text-halo-color": haloColor,
      "text-halo-width": 1.6,
    },
  });

  // Diagnostic: tells you whether the tiles contain landmark data at all.
  map.once("idle", () => {
    try {
      const count = map.querySourceFeatures(vectorSourceId, {
        sourceLayer: "poi",
        filter: ["has", "name"],
      }).length;
      console.info(
        `[MapView] landmark features in loaded tiles: ${count} (zoom ${map
          .getZoom()
          .toFixed(1)})`
      );
    } catch {
      /* diagnostic only */
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Component                                                                 */
/* ------------------------------------------------------------------------ */

export default function MapView({
  school,
  pickupPoints = [],
  buses = [],
  selectedBusIndex = null,
  students = [],
  navigationBus = null,
  nav = null,
  focusStep = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const loadedRef = useRef(false);
  const markersRef = useRef([]);
  const navStopMarkersRef = useRef([]);
  const vehicleRef = useRef(null);
  const navRef = useRef(nav);
  const appliedThemeRef = useRef("dark");

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTheme, setMapTheme] = useState("dark");
  const [mapError, setMapError] = useState("");

  navRef.current = nav;

  const selectedBus =
    selectedBusIndex == null ? null : buses[selectedBusIndex] ?? null;
  const nextStop = selectedBus?.stops?.[0] ?? null;

  const navBusIndex = navigationBus
    ? buses.findIndex((bus) => bus.busId === navigationBus.busId)
    : -1;
  const navColor = colorForBus(Math.max(0, navBusIndex));

  const vehicleLat = nav?.position?.lat;
  const vehicleLng = nav?.position?.lng;
  const vehicleBearing = nav?.position?.bearing ?? 0;

  const allPoints = useMemo(() => {
    const items = [];
    const schoolPosition = getLatLng(school);
    if (schoolPosition) items.push(schoolPosition);
    students.forEach((student) => {
      const position = getLatLng(student);
      if (position) items.push(position);
    });
    pickupPoints.forEach((point) => {
      const position = getLatLng(point);
      if (position) items.push(position);
    });
    return items;
  }, [school, students, pickupPoints]);

  /* ---- 0. Pre-flight: is the worker file actually being served? -------- */
  useEffect(() => {
    let cancelled = false;
    fetch(WORKER_PATH)
      .then((response) => {
        const type = response.headers.get("content-type") || "";
        if (cancelled) return;
        if (!response.ok || !/javascript|ecmascript/i.test(type)) {
          setMapError(
            `The map worker file (${WORKER_PATH}) is missing from /public. ` +
              "Run: npm run copy-worker  — then restart the dev server."
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- 1. Create the map once ----------------------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const schoolLocation = getLatLng(school);
    loadedRef.current = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: schoolLocation
        ? [schoolLocation.lng, schoolLocation.lat]
        : DEFAULT_CENTER,
      zoom: 12,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

    map.on("load", () => {
      loadedRef.current = true;
      setMapError("");
      setMapLoaded(true);
    });

    map.on("error", (event) => {
      console.error("[MapView] map error:", event?.error ?? event);
      // Tile hiccups after the first render are not fatal; only report
      // failures that stop the map from ever loading.
      if (!loadedRef.current) {
        setMapError(
          event?.error?.message ||
            "The map could not be loaded. Check your internet connection and the browser console."
        );
      }
    });

    // Dragging the map by hand turns off auto-follow during navigation.
    map.on("dragstart", (event) => {
      if (event.originalEvent) navRef.current?.setFollow?.(false);
    });

    // Keep the canvas sized correctly when its container changes size
    // (page layout settling, panel open/close, window resize).
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      navStopMarkersRef.current.forEach((marker) => marker.remove());
      navStopMarkersRef.current = [];
      vehicleRef.current?.remove();
      vehicleRef.current = null;
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      appliedThemeRef.current = "dark";
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- 2. Light / dark base map --------------------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || appliedThemeRef.current === mapTheme) return;

    appliedThemeRef.current = mapTheme;
    setMapLoaded(false); // custom sources/layers are wiped by setStyle

    const handleStyleLoad = () => setMapLoaded(true);
    map.once("style.load", handleStyleLoad);
    map.setStyle(mapTheme === "dark" ? DARK_STYLE : LIGHT_STYLE);

    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [mapTheme]);

  /* ---- 3. Navigation line layers (created once per style) ------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!map.getSource(NAV_TRAVELED_SRC)) {
      map.addSource(NAV_TRAVELED_SRC, { type: "geojson", data: EMPTY_COLLECTION });
    }
    if (!map.getSource(NAV_REMAINING_SRC)) {
      map.addSource(NAV_REMAINING_SRC, { type: "geojson", data: EMPTY_COLLECTION });
    }

    if (!map.getLayer(NAV_TRAVELED_LAYER)) {
      map.addLayer({
        id: NAV_TRAVELED_LAYER,
        type: "line",
        source: NAV_TRAVELED_SRC,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#8892a0", "line-width": 6, "line-opacity": 0.6 },
      });
    }

    if (!map.getLayer(NAV_REMAINING_LAYER)) {
      map.addLayer({
        id: NAV_REMAINING_LAYER,
        type: "line",
        source: NAV_REMAINING_SRC,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFC93C", "line-width": 6, "line-opacity": 0.95 },
      });
    }
  }, [mapLoaded]);

  /* ---- 4. School, student and pickup-point markers --------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    function addMarker(position, element, popupContent) {
      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        maxWidth: "280px",
      }).setDOMContent(popupContent);

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([position.lng, position.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    const schoolPosition = getLatLng(school);
    if (schoolPosition) {
      addMarker(
        schoolPosition,
        makeMarker("#FFC93C", "🏫", 38),
        makePopup(school?.name || "School / Depot", [
          ["Role", "Route starting and ending point"],
        ])
      );
    }

    // While navigating, only the school is drawn here.
    if (navigationBus) return;

    students.forEach((student) => {
      const position = getLatLng(student);
      if (!position) return;
      addMarker(
        position,
        makeMarker("#54C7EC", "", 12),
        makePopup(student.student_name || student.name || "Student", [
          ["Student ID", student.id],
          ["Latitude", position.lat.toFixed(6)],
          ["Longitude", position.lng.toFixed(6)],
          ["Pickup point", student.pickupPointId],
        ])
      );
    });

    pickupPoints.forEach((point) => {
      const position = getLatLng(point);
      if (!position) return;

      const busIndex = buses.findIndex((bus) =>
        bus.stops?.some((stop) => stop.pickupPointId === point.id)
      );
      const color = colorForBus(busIndex >= 0 ? busIndex : 0);
      const associatedStudents = getStopStudents(point);

      addMarker(
        position,
        makeMarker(color, "P", 28),
        makePopup(`Pickup point ${point.id}`, [
          ["Students", point.studentCount ?? associatedStudents.length],
          ["Assigned bus", busIndex >= 0 ? buses[busIndex].busId : "Unassigned"],
          [
            "Max walking distance",
            point.maxWalkDistanceM == null ? undefined : `${point.maxWalkDistanceM} m`,
          ],
          ["Validation", point.validated ? "Validated" : "Needs review"],
          [
            "Student names",
            associatedStudents
              .map((student) => student.student_name || student.name)
              .filter(Boolean)
              .join(", ") || "Names not included in API response",
          ],
        ])
      );
    });

    if (allPoints.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      allPoints.forEach((point) => bounds.extend([point.lng, point.lat]));
      map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 700 });
    }
  }, [mapLoaded, school, students, pickupPoints, buses, allPoints, navigationBus]);

  /* ---- 5. Planned bus routes ------------------------------------------ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer(ROUTE_ROAD_LAYER)) map.removeLayer(ROUTE_ROAD_LAYER);
    if (map.getLayer(ROUTE_FALLBACK_LAYER)) map.removeLayer(ROUTE_FALLBACK_LAYER);
    if (map.getSource(ROUTE_SRC)) map.removeSource(ROUTE_SRC);

    const schoolPosition = getLatLng(school);

    const features = navigationBus
      ? []
      : buses.flatMap((bus, index) => {
          if (!schoolPosition || !bus.stops?.length) return [];

          const roadCoords = toLngLatCoords(bus.roadGeometry);
          const hasRoad = roadCoords.length > 1;

          const coordinates = hasRoad
            ? roadCoords
            : [
                [schoolPosition.lng, schoolPosition.lat],
                ...bus.stops
                  .map((stop) => {
                    const position = getLatLng(stop);
                    return position ? [position.lng, position.lat] : null;
                  })
                  .filter(Boolean),
                [schoolPosition.lng, schoolPosition.lat],
              ];

          if (coordinates.length < 2) return [];

          return [
            {
              type: "Feature",
              properties: {
                busIndex: index,
                color: colorForBus(index),
                selected: selectedBusIndex === index,
                dim: selectedBusIndex != null && selectedBusIndex !== index,
                isRoadRoute: hasRoad,
              },
              geometry: { type: "LineString", coordinates },
            },
          ];
        });

    map.addSource(ROUTE_SRC, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    // Keep planned routes underneath the navigation layers.
    const beforeId = map.getLayer(NAV_TRAVELED_LAYER) ? NAV_TRAVELED_LAYER : undefined;

    const paint = {
      "line-color": ["get", "color"],
      "line-width": ["case", ["get", "selected"], 7, 4.5],
      "line-opacity": ["case", ["get", "dim"], 0.28, 0.92],
    };

    map.addLayer(
      {
        id: ROUTE_ROAD_LAYER,
        type: "line",
        source: ROUTE_SRC,
        filter: ["==", ["get", "isRoadRoute"], true],
        layout: { "line-join": "round", "line-cap": "round" },
        paint,
      },
      beforeId
    );

    // line-dasharray cannot be data-driven, so straight-line fallbacks
    // (when OSRM had no road geometry) get their own dashed layer.
    map.addLayer(
      {
        id: ROUTE_FALLBACK_LAYER,
        type: "line",
        source: ROUTE_SRC,
        filter: ["==", ["get", "isRoadRoute"], false],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { ...paint, "line-dasharray": [2, 2] },
      },
      beforeId
    );
  }, [mapLoaded, school, buses, selectedBusIndex, navigationBus]);

  /* ---- 6. Zoom to a bus when it is selected --------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || navigationBus || !selectedBus) return;

    const coords = toLngLatCoords(selectedBus.roadGeometry);
    if (coords.length < 2) return;

    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((coord) => bounds.extend(coord));
    map.fitBounds(bounds, {
      padding: { top: 70, bottom: 70, left: 70, right: 70 },
      maxZoom: 15,
      duration: 700,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, selectedBusIndex]);

  /* ---- 7. Navigation: traveled / remaining lines ----------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const traveledSource = map.getSource(NAV_TRAVELED_SRC);
    const remainingSource = map.getSource(NAV_REMAINING_SRC);
    if (!traveledSource || !remainingSource) return;

    if (!navigationBus || !nav?.path || nav.path.coords.length < 2) {
      traveledSource.setData(EMPTY_COLLECTION);
      remainingSource.setData(EMPTY_COLLECTION);
      return;
    }

    const idle = nav.status === "idle";
    const { traveled, remaining } = splitPath(nav.path, idle ? 0 : nav.traveledM);

    traveledSource.setData(lineData(idle ? [] : traveled));
    remainingSource.setData(lineData(remaining));
    map.setPaintProperty(NAV_REMAINING_LAYER, "line-color", navColor);
  }, [mapLoaded, navigationBus, nav?.path, nav?.traveledM, nav?.status, navColor]);

  /* ---- 7b. Landmark labels, always above the route lines -------------- */
  // Must stay AFTER the effects that create the route layers (3, 5 and 7):
  // React runs effects in declaration order, so this layer is added last
  // and therefore drawn on top of every route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    addLandmarkLabels(map, mapTheme);
  }, [mapLoaded, mapTheme, school, buses, selectedBusIndex, navigationBus]);

  /* ---- 8. Navigation: numbered pickup stops ---------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    navStopMarkersRef.current.forEach((marker) => marker.remove());
    navStopMarkersRef.current = [];

    if (!navigationBus) return;

    const done = nav?.stopsDone ?? 0;

    [...(navigationBus.stops ?? [])]
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((stop) => {
        const position = getLatLng(stop);
        if (!position) return;

        const state =
          stop.sequence <= done
            ? "done"
            : stop.sequence === done + 1
            ? "next"
            : "pending";

        const popup = new maplibregl.Popup({
          offset: 20,
          closeButton: true,
          maxWidth: "280px",
        }).setDOMContent(
          makePopup(`Stop ${stop.sequence} · ${stop.pickupPointId}`, [
            [
              "Status",
              state === "done" ? "Picked up" : state === "next" ? "Next stop" : "Upcoming",
            ],
            ["Students boarding", stop.studentCount],
            ["ETA", `+${stop.etaMinutesFromDeparture} min`],
            ["Names", (stop.studentNames ?? []).join(", ")],
          ])
        );

        const marker = new maplibregl.Marker({
          element: makeStopElement(navColor, stop.sequence, state),
          anchor: "center",
        })
          .setLngLat([position.lng, position.lat])
          .setPopup(popup)
          .addTo(map);

        navStopMarkersRef.current.push(marker);
      });
  }, [mapLoaded, navigationBus, nav?.stopsDone, navColor]);

  /* ---- 9. Navigation: moving vehicle + follow camera ------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const hasPosition =
      navigationBus && Number.isFinite(vehicleLat) && Number.isFinite(vehicleLng);

    if (!hasPosition) {
      vehicleRef.current?.remove();
      vehicleRef.current = null;
      return;
    }

    if (!vehicleRef.current) {
      vehicleRef.current = new maplibregl.Marker({
        element: makeVehicleElement(navColor),
        anchor: "center",
        rotationAlignment: "map",
        pitchAlignment: "map",
      })
        .setLngLat([vehicleLng, vehicleLat])
        .addTo(map);
    }

    vehicleRef.current.setLngLat([vehicleLng, vehicleLat]).setRotation(vehicleBearing);

    if (nav?.follow) {
      map.easeTo({
        center: [vehicleLng, vehicleLat],
        zoom: Math.max(map.getZoom(), 17),
        duration: 250,
        essential: true,
      });
    }
  }, [mapLoaded, navigationBus, vehicleLat, vehicleLng, vehicleBearing, nav?.follow, navColor]);

  /* ---- 10. Fit the whole route when navigation opens ------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !navigationBus) return;

    const coords = nav?.path?.coords ?? [];
    if (coords.length < 2) return;

    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((coord) => bounds.extend(coord));

    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const wide = width >= 768;

    map.fitBounds(bounds, {
      padding: wide
        ? { top: 60, bottom: 60, left: Math.min(380, Math.round(width * 0.4)), right: 60 }
        : { top: 60, bottom: Math.round(height * 0.5), left: 30, right: 30 },
      maxZoom: 16,
      duration: 700,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, navigationBus]);

  /* ---- 11. Clicking a step in the panel flies to that manoeuvre -------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !focusStep || !nav?.steps) return;

    // Step location is [lat, lng].
    const location = nav.steps[focusStep.index]?.location;
    if (!Array.isArray(location) || location.length < 2) return;

    const lat = Number(location[0]);
    const lng = Number(location[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, focusStep]);

  /* ---- Render ---------------------------------------------------------- */
  return (
    <div
      className="relative w-full overflow-hidden bg-[#0d1117]"
      style={{ height: "100%", minHeight: 460 }}
    >
      {/* data-lenis-prevent: stop the page's smooth-scroll from eating wheel zoom */}
      <div
        ref={containerRef}
        data-lenis-prevent
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {/* Loading / error states */}
      {!mapLoaded && !mapError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg-panel/90 px-4 py-3 text-xs text-text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal-cyan border-t-transparent" />
            Loading map…
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/90 p-6">
          <div className="max-w-sm rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center text-xs leading-relaxed text-red-200">
            <p className="font-semibold">Map failed to load</p>
            <p className="mt-1 text-red-200/80">{mapError}</p>
            <p className="mt-2 text-red-200/60">
              If this mentions a worker, run <code>npm run copy-worker</code> and restart
              the dev server. Then open <code>/maplibre-gl-worker.js</code> in the browser — it should show code, not a 404.
            </p>
          </div>
        </div>
      )}

      {/* Light / dark base-map toggle (sits left of the zoom controls) */}
      <div className="absolute right-14 top-3 z-20 flex items-center gap-1 rounded-xl border border-white/15 bg-slate-950/90 p-1 shadow-xl backdrop-blur-md">
        {[
          ["light", "☀ Light"],
          ["dark", "☾ Dark"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMapTheme(value)}
            aria-pressed={mapTheme === value}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              mapTheme === value
                ? value === "light"
                  ? "bg-white text-slate-900"
                  : "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Selected bus summary */}
      {selectedBus && !navigationBus && (
        <div className="absolute left-3 top-3 z-10 w-[min(280px,calc(100%-24px))] rounded-2xl border border-white/10 bg-bg-panel/90 p-4 text-text-primary shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorForBus(selectedBusIndex) }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Route summary
            </span>
          </div>
          <div className="mt-1 font-heading text-lg font-bold">{selectedBus.busId}</div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-[10px] uppercase text-text-muted">First stop</div>
              <div className="font-mono text-xs">{nextStop?.pickupPointId ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-text-muted">Distance</div>
              <div className="font-mono text-xs">
                {selectedBus.totalDistanceKm == null ? "—" : `${selectedBus.totalDistanceKm} km`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-text-muted">Time</div>
              <div className="font-mono text-xs">
                {selectedBus.totalDurationMin == null ? "—" : `${selectedBus.totalDurationMin} min`}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-snug text-text-muted">
            Press “View directions” on the bus card to start turn-by-turn navigation.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-xl border border-white/10 bg-bg-panel/85 px-3 py-2 text-[11px] leading-5 text-text-primary shadow backdrop-blur md:block">
        {navigationBus ? (
          <>
            <div>▲ Vehicle</div>
            <div>1 2 3 Pickup stops (yellow = next, ✓ = done)</div>
            <div>Grey line: traveled · Coloured line: remaining</div>
          </>
        ) : (
          <>
            <div>🏫 School · <span className="text-sky-300">●</span> Students</div>
            <div>P Pickup points · coloured lines are bus routes</div>
          </>
        )}
      </div>
    </div>
  );
}