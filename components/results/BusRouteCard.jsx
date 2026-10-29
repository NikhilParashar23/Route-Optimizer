"use client";

import { useState } from "react";
import {
  ChevronDown, MapPin, Clock, Users, CheckCircle2, AlertTriangle, Fuel, Navigation,Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { colorForBus } from "@/lib/results/busPalette";

export default function BusRouteCard({ bus, index, isSelected, onSelect, onViewDirections,onShareTrip }) {
  const [expanded, setExpanded] = useState(false);
  const color = colorForBus(index);
  const stops = bus.stops || [];
  const util = Math.min(100, Math.max(0, Number(bus.utilizationPct) || 0));

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white/[0.03] transition ${
        isSelected ? "shadow-lg" : "border-white/10 hover:border-white/20"
      }`}
      style={isSelected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}55, 0 8px 30px ${color}22` } : undefined}
    >
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={() => onSelect(isSelected ? null : index)}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-heading text-base font-extrabold text-bg-grid"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-semibold tracking-wide">{bus.busId}</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              {bus.busType || "Bus"} · {bus.capacity} seats
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
            <span className="flex items-center gap-1"><Users size={11} />{bus.studentCount}/{bus.capacity}</span>
            <span className="flex items-center gap-1"><MapPin size={11} />{bus.totalDistanceKm} km</span>
            <span className="flex items-center gap-1"><Clock size={11} />{bus.totalDurationMin} min</span>
            <span className="flex items-center gap-1"><Fuel size={11} />₹{bus.estimatedFuelCost}</span>
          </div>
        </div>

        <button
          type="button"
          aria-label={expanded ? "Collapse pickup stops" : "Expand pickup stops"}
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-white/10"
        >
          <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${util}%`, backgroundColor: color }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
          <span>{util}% seats filled</span>
          <span>{stops.length} stops</span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewDirections?.(); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-signal-cyan/30 bg-signal-cyan/10 px-3 py-2 text-xs font-semibold text-signal-cyan transition hover:bg-signal-cyan/20"
        >
          <Navigation size={14} />
          View directions
        </button>
        <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    onShareTrip?.(bus);
  }}
  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
>
  <Share2 size={14} />
  Share trip
</button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-dashed border-white/15"
          >
            <ol data-lenis-prevent className="scroll-thin max-h-64 space-y-2.5 overflow-y-auto px-4 py-3">
              {stops.map((stop, i) => (
                <li key={stop.pickupPointId ?? i} className="flex items-start gap-3 text-xs">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-bg-grid"
                    style={{ backgroundColor: color }}
                  >
                    {stop.sequence ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      {stop.pickupPointId}
                      {stop.validated && stop.walkDistanceOk ? (
                        <CheckCircle2 size={11} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={11} className="text-bus-yellow" />
                      )}
                    </div>
                    <div className="mt-0.5 text-text-muted">
                      {stop.studentCount} student(s) · ETA +{stop.etaMinutesFromDeparture} min · {stop.cumulativeDistanceKm} km in
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}