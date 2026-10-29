'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bus, AlertCircle } from 'lucide-react';

import '@/app/results/results.css';
import NavigationPanel from '@/components/results/NavigationPanel';
import { useRouteNavigation } from '@/hooks/results/useRouteNavigation';

const MapView = dynamic(
  () => import('@/components/results/MapView'),
  { ssr: false }
);

// Same-origin: Next.js rewrites /api/* to the Flask server (see next.config.js).
const API_BASE = '';

type TripData = {
  tripId: string;
  bus: Record<string, any>;
  school: Record<string, any>;
  live?: Record<string, any>;
};

export default function DriverPage() {
  const params = useParams();
  const tripId = String(params.tripId ?? '');

  const [token, setToken] = useState('');
  const [trip, setTrip] = useState<TripData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusStep, setFocusStep] = useState<{
    index: number;
    nonce: number;
  } | null>(null);

  const lastPublishRef = useRef(0);

  const nav = useRouteNavigation(trip?.bus ?? null);

  // Read the driver token and fetch the full trip.
  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      try {
        const url = new URL(window.location.href);
        const driverToken = url.searchParams.get('t');

        if (!driverToken) {
          throw new Error('Driver token is missing from this link.');
        }

        setToken(driverToken);

        const response = await fetch(
          `${API_BASE}/api/trips/${encodeURIComponent(tripId)}/driver`,
          {
            headers: { 'X-Trip-Token': driverToken },
            cache: 'no-store',
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ?? result.message ?? 'Could not load this trip.'
          );
        }

        if (!result.bus || !result.school) {
          throw new Error('The server returned incomplete route details.');
        }

        if (!cancelled) {
          setTrip(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load the trip.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (tripId) {
      loadTrip();
    } else {
      setError('Trip ID is missing.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // Publish the driver's current navigation position to Flask.
  useEffect(() => {
    if (!trip || !token || !nav.position || nav.status === 'idle') {
      return;
    }

    const now = Date.now();

    // Avoid sending a request on every animation frame.
    if (nav.status !== 'finished' && now - lastPublishRef.current < 1000) {
      return;
    }

    const position: any = nav.position;

    const lat = Number(
      Array.isArray(position)
        ? position[0]
        : position.lat ?? position.latitude
    );

    const lng = Number(
      Array.isArray(position)
        ? position[1]
        : position.lng ?? position.longitude
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return;
    }

    lastPublishRef.current = now;

    const payload = {
      lat,
      lng,
      status: nav.status,
      mode: nav.mode,
      bearing: position.bearing ?? position.heading ?? null,
      accuracy: nav.gpsAccuracy ?? null,
      traveledM: nav.traveledM ?? 0,
      stopsDone: nav.stopsDone ?? 0,
    };

    fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trip-Token': token,
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          console.warn('Location publish rejected:', response.status, result);
        }
      })
      .catch((err) => {
        console.error('Location publish failed:', err);
      });
  }, [
    tripId,
    trip,
    token,
    nav.position,
    nav.status,
    nav.mode,
    nav.traveledM,
    nav.stopsDone,
    nav.gpsAccuracy,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-grid text-text-primary">
        Loading driver trip…
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-grid px-4 text-text-primary">
        <div className="max-w-md rounded-2xl border border-white/10 bg-bg-panel p-6">
          <AlertCircle className="mb-3 h-6 w-6 text-red-400" />
          <h1 className="text-xl font-bold">Unable to open trip</h1>
          <p className="mt-2 text-sm text-text-muted">{error}</p>
          <p className="mt-3 text-xs text-text-muted">
            Check that the link is correct and the Flask server is running.
          </p>
        </div>
      </main>
    );
  }

  const bus = trip.bus;

  return (
    <main className="min-h-screen bg-bg-grid p-4 text-text-primary sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-cyan/10 text-signal-cyan">
          <Bus className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-xl font-bold">RouteCraft Driver</h1>
          <p className="text-xs text-text-muted">
            {bus.busName ?? bus.busType ?? 'Assigned bus'} · Trip {trip.tripId}
          </p>
        </div>
      </header>

      <section className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10">
        <MapView
          school={trip.school}
          students={[]}
          pickupPoints={bus.stops ?? []}
          buses={[bus]}
          selectedBusIndex={0}
          navigationBus={bus}
          nav={nav}
          focusStep={focusStep}
        />

        <NavigationPanel
          bus={bus}
          colorIndex={0}
          nav={nav}
          onClose={() => nav.pause()}
          onFocusStep={(index: number) => {
            nav.setFollow(false);
            setFocusStep({ index, nonce: Date.now() });
          }}
        />
      </section>

      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        Start navigation using the controls. When a valid position is available,
        RouteCraft will publish updates to the trip server.
      </p>
    </main>
  );
}