
import { ClipboardList } from "lucide-react";
import BusRouteCard from "./BusRouteCard";

export default function RouteManifest({
  buses = [],
  selectedBusIndex,
  setSelectedBusIndex,
  onViewDirections,
  onShareTrip,
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-ink-primary">
            <ClipboardList size={15} className="text-amber" />
            ROUTE MANIFEST
          </div>

          <p className="mt-1 text-xs text-ink-muted">
            {buses.length > 0
              ? "Select a route, view directions, or share a trip."
              : "Bus route sheets will appear here."}
          </p>
        </div>
      </div>

      {buses.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {buses.map((bus, idx) => (
            <BusRouteCard
              key={bus.busId ?? idx}
              bus={bus}
              index={idx}
              isSelected={selectedBusIndex === idx}
              onSelect={() => setSelectedBusIndex(idx)}
              onViewDirections={() => onViewDirections?.(bus)}
              onShareTrip={() => onShareTrip?.(bus)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-16 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-panel-border text-ink-faint">
            🚌
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            No routes generated yet. Configure your constraints and run the
            optimizer.
          </p>
        </div>
      )}
    </section>
  );
}
