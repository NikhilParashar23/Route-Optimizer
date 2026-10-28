
'use client';

import { useCallback, useEffect,useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bus, MapPin, AlertCircle, Clock } from 'lucide-react';

import '@/app/results/results.css';

const MapView = dynamic(
  () => import('@/components/results/MapView'),
  { ssr: false }
);

const API_BASE = '';
const POLL_INTERVAL = 3000;

type Trip = {
  tripId: string;
  bus: Record<string, any>;
  school: Record<string, any>;
};

type LiveLocation = {
  lat: number;
  lng: number;
  status?: string;
  mode?: string;
  bearing?: number | null;
  accuracy?: number | null;
  traveledM?: number;
  stopsDone?: number;
  updatedAt?: string | null;
  timestamp?: string;
  stale?: boolean;
  ageSeconds?: number;
};

export default function ParentTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const tripId = String(params.tripId ?? '');
  const token = searchParams.get('t') ?? '';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [live, setLive] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRoute = useCallback(async () => {
    if (!tripId || !token) {
      setError('The tracking link is missing its trip ID or access token.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/trips/${encodeURIComponent(tripId)}/public?t=${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? result.message ?? 'Unable to load this bus route.'
        );
      }

      if (!result.bus || !result.school) {
        throw new Error('The server returned incomplete route details.');
      }

      setTrip(result);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load the bus route.'
      );
    } finally {
      setLoading(false);
    }
  }, [tripId, token]);

  const loadLiveLocation = useCallback(async () => {
    if (!tripId || !token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/trips/${encodeURIComponent(tripId)}/live?t=${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? result.message ?? 'Unable to fetch bus location.'
        );
      }

      // Flask may return { position: {...}, status, updatedAt }.
      // Also support the alternative response shapes.
      const location =
        result.position ??
        result.location ??
        result.live ??
        (result.lat != null || result.latitude != null ? result : null);

      if (!location) {
        setLive({stale: Boolean(result.stale ?? location.stale),
          ageSeconds: result.ageSeconds ?? location.ageSeconds ?? 0});
        setLastUpdated(null);
        setError('');
        return;
      }

      const lat = Number(location.lat ?? location.latitude);
      const lng = Number(location.lng ?? location.longitude);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        setLive({
          ...location,
          lat,
          lng,
          bearing: Number(location.bearing ?? location.heading ?? 0),
          status: result.status ?? location.status ?? 'running',
          mode: location.mode,
          accuracy: location.accuracy ?? null,
          traveledM: location.traveledM ?? 0,
          stopsDone: location.stopsDone ?? 0,
          updatedAt: result.updatedAt ?? location.updatedAt ?? null,
        });

        setLastUpdated(new Date());
        setError('');
      } else {
        setLive(null);
        setLastUpdated(null);
      }
    } catch (err) {
      // Keep the last valid marker visible during a temporary polling failure.
      console.error('Live location update failed:', err);
    }
  }, [tripId, token]);

  useEffect(() => {
    void loadRoute();
  }, [loadRoute]);

  useEffect(() => {
    if (!trip) return;

    void loadLiveLocation();

    const intervalId = window.setInterval(() => {
      void loadLiveLocation();
    }, POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [trip, loadLiveLocation]);
  const mapBuses = useMemo(() => (trip ? [trip.bus] : []), [trip]);
const mapPickupPoints = useMemo(() => trip?.bus.stops ?? [], [trip]);
const mapStudents = useMemo(() => [], []);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <p>Loading bus tracking details...</p>
      </main>
    );
  }

  if (error && !trip) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <section className="max-w-lg rounded-xl border p-6">
          <AlertCircle className="mb-3" size={30} />
          <h1 className="text-xl font-semibold">Tracking unavailable</h1>
          <p className="mt-2">{error}</p>
          <button
            className="mt-4 rounded-lg border px-4 py-2"
            onClick={() => {
              setLoading(true);
              void loadRoute();
            }}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!trip) return null;

  const bus = trip.bus;
  const isMoving = live?.status === 'running' && !live?.stale;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm opacity-70">RouteCraft · Parent Tracking</p>
          <h1 className="mt-1 text-2xl font-bold">
            <Bus className="mr-2 inline-block" size={25} />
            Bus Live Tracking
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Follow the bus route and check its latest reported position.
          </p>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <p className="text-sm opacity-70">Trip status</p>
          <p className="mt-1 font-semibold">
  {live && !live.stale
    ? live.status!.charAt(0).toUpperCase() + live.status!.slice(1)
    : 'Not started yet'}
</p>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm opacity-70">Bus</p>
          <p className="mt-1 font-semibold">
            {bus.busName ?? bus.name ?? bus.busNumber ?? 'Assigned bus'}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm opacity-70">Latest location</p>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            <MapPin size={17} />
            {live
              ? `${live.lat.toFixed(5)}, ${live.lng.toFixed(5)}`
              : 'Waiting for driver'}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm opacity-70">Last update received</p>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            <Clock size={17} />
            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : 'Not received yet'}
          </p>
        </div>
      </section>

      {(!live || live.stale) && (
        <div className="mb-4 rounded-xl border p-4 text-sm">
          The route is loaded, but no current bus position is available.
          Keep this page open while the driver starts navigation.
        </div>
      )}

      {live && !live.stale && !isMoving && (
        <div className="mb-4 rounded-xl border p-4 text-sm">
          The latest reported bus status is{' '}
          <strong>{live.status ?? 'unknown'}</strong>.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border">
        <MapView
  school={trip.school}
  students={mapStudents}
  pickupPoints={mapPickupPoints}
  buses={mapBuses}
  selectedBusIndex={0}
  navigationBus={null}
  nav={null}
  focusStep={null}
  livePosition={live}
  showSummary={false}
/>
      </section>

      <p className="mt-4 text-sm opacity-70">
        Location refreshes approximately every 3 seconds when the tracking
        service is available. Updates depend on the driver's device and network.
      </p>
    </main>
  );
}
