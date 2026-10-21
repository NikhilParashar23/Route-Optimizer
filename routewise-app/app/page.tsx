'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bus, MapPinned, SearchX } from 'lucide-react';

import './results.css';

import StatsBar from '@/components/results/StatsBar';
import RouteManifest from '@/components/results/RouteManifest';
import NavigationPanel from '@/components/results/NavigationPanel';
import { useRouteNavigation } from '@/hooks/useRouteNavigation';
import { colorForBus } from '@/lib/results/busPalette';

/*
 * maplibre-gl touches `window` when it is imported, so it must never run
 * during server rendering. ssr:false loads it in the browser only.
 */
const MapView = dynamic(() => import('@/components/results/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[460px] items-center justify-center bg-[#0d1117] text-xs text-text-muted">
      Loading map…
    </div>
  ),
});

const STORAGE_KEY = 'routecraft-results';

type Bus = Record<string, any>;

type ResultsPayload = {
  school: Record<string, any>;
  pickupPoints: Array<Record<string, any>>;
  buses: Bus[];
  stats: Record<string, any> | null;
  input?: { students?: Array<Record<string, any>> };
};

function loadResults(): ResultsPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.buses)) return null;

    return {
      school: parsed.school ?? parsed.input?.school ?? {},
      pickupPoints: parsed.pickupPoints ?? [],
      buses: parsed.buses.map((bus: Bus) => ({
        ...bus,
        stops: bus.stops ?? [],
        roadGeometry: bus.roadGeometry ?? [],
        directions: bus.directions ?? [],
      })),
      stats: parsed.stats ?? null,
      input: parsed.input,
    };
  } catch (error) {
    console.error('Could not read saved results:', error);
    return null;
  }
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedBusIndex, setSelectedBusIndex] = useState<number | null>(null);
  const [directionsBus, setDirectionsBus] = useState<Bus | null>(null);
  const [focusStep, setFocusStep] = useState<{ index: number; nonce: number } | null>(null);
  const mapCardRef = useRef<HTMLDivElement>(null);

  const nav = useRouteNavigation(directionsBus);

  useEffect(() => {
    setData(loadResults());
    setReady(true);
  }, []);

  // Helpful when the road line or directions are empty: shows in the console.
  useEffect(() => {
    if (!data) return;
    console.table(
      data.buses.map((bus) => ({
        busId: bus.busId,
        busType: bus.busType,
        students: bus.studentCount,
        stops: bus.stops.length,
        geometryPoints: bus.roadGeometry.length,
        directionsCount: bus.directions.length,
        directionsSource: bus.directionsSource ?? 'n/a',
      }))
    );
  }, [data]);

  const directionsBusIndex = useMemo(
    () => (data ? data.buses.findIndex((b) => b.busId === directionsBus?.busId) : -1),
    [data, directionsBus]
  );

  const openDirections = (bus: Bus) => {
    setFocusStep(null);
    setDirectionsBus(bus);
    mapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const closeDirections = () => {
    setDirectionsBus(null);
    setFocusStep(null);
  };

  /* ---------------------------- States ---------------------------------- */

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-grid">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-signal-cyan border-t-transparent" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-grid px-4 text-text-primary">
        <div className="max-w-md rounded-3xl border border-white/10 bg-bg-panel/80 p-8 text-center shadow-glass-panel">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-cyan/10 text-signal-cyan">
            <SearchX className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-extrabold">No routes to show yet</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Run the route optimizer first. Results are kept for this browser tab only.
          </p>
          <Link
            href="/#demo"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-route-blue via-signal-cyan to-route-blue px-5 py-3 text-xs font-bold uppercase tracking-wider text-bg-grid"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to optimizer
          </Link>
        </div>
      </main>
    );
  }

  const { school, pickupPoints, buses, stats } = data;
  const students = data.input?.students ?? [];
  const typeSummary: Array<Record<string, any>> = stats?.busTypeSummary ?? [];

  /* ---------------------------- Page ------------------------------------ */

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-grid text-text-primary selection:bg-signal-cyan selection:text-bg-grid">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-route-blue/20 via-signal-cyan/15 to-transparent blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1500px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/#demo"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-text-primary transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            New optimization
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-signal-cyan/20 bg-signal-cyan/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-signal-cyan">
            <Bus className="h-3.5 w-3.5" />
            Route results
          </div>
        </div>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your optimized{' '}
            <span className="bg-gradient-to-r from-route-blue to-signal-cyan bg-clip-text text-transparent">
              bus routes
            </span>
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted sm:text-base">
            <MapPinned className="h-4 w-4 text-signal-cyan" />
            {school?.name?.trim() || 'School'}
            {stats && (
              <>
                <span className="text-white/20">·</span>
                {stats.totalStudents} students
                <span className="text-white/20">·</span>
                {stats.totalPickupPoints} pickup points
                <span className="text-white/20">·</span>
                {stats.totalBuses} buses
              </>
            )}
          </p>
        </motion.header>

        <StatsBar stats={stats} />

        {/* Map + manifest */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div
            ref={mapCardRef}
            className="relative h-[560px] overflow-hidden rounded-3xl border border-white/10 shadow-glass-panel lg:h-[700px]"
          >
            <MapView
              school={school}
              students={students}
              pickupPoints={pickupPoints}
              buses={buses}
              selectedBusIndex={selectedBusIndex}
              navigationBus={directionsBus}
              nav={nav}
              focusStep={focusStep}
            />

            {directionsBus && (
              <NavigationPanel
                bus={directionsBus}
                colorIndex={Math.max(0, directionsBusIndex)}
                nav={nav}
                onClose={closeDirections}
                onFocusStep={(index: number) => {
                  nav.setFollow(false);
                  setFocusStep({ index, nonce: Date.now() });
                }}
              />
            )}
          </div>

          <div className="h-[560px] lg:h-[700px]">
            <RouteManifest
              buses={buses}
              selectedBusIndex={selectedBusIndex}
              setSelectedBusIndex={setSelectedBusIndex}
              onViewDirections={openDirections}
            />
          </div>
        </section>

        {/* Fleet usage */}
        {typeSummary.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-bg-panel/70 p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold">Fleet usage</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typeSummary.map((type, i) => {
                const pct = type.count > 0 ? Math.round((type.used / type.count) * 100) : 0;
                const color = colorForBus(i);
                return (
                  <div key={type.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold">{type.name}</span>
                      <span className="font-mono text-xs text-text-muted">{type.capacity} seats</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <div className="mt-1.5 font-mono text-[11px] text-text-muted">
                      {type.used} of {type.count} buses used
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}