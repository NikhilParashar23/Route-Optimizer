// Origin used inside share links. Set NEXT_PUBLIC_PUBLIC_URL in .env.local
// (for example https://routecraft.example.com) to force a fixed public address.
export function getPublicOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return window.location.origin;
}

export function buildTripLinks(trip: {
  tripId: string;
  driverToken: string;
  parentToken: string;
}) {
  const origin = getPublicOrigin();
  const id = encodeURIComponent(trip.tripId);

  return {
    parentUrl: `${origin}/track/${id}?t=${encodeURIComponent(trip.parentToken)}`,
    driverUrl: `${origin}/driver/${id}?t=${encodeURIComponent(trip.driverToken)}`,
  };
}