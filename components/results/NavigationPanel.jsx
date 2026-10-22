"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  Square,
  LocateFixed,
  Crosshair,
  MapPin,
  Flag,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  RefreshCw,
  Navigation,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { colorForBus } from "@/lib/results/busPalette";
import { formatDistance, formatMinutes } from "@/lib/results/navigation";

function iconFor(step) {
  if (!step) return Flag;
  if (step.isSchool) return Flag;
  if (step.isStop) return MapPin;
  const t = step.maneuverType;
  const m = step.modifier;
  if (t === "depart") return Navigation;
  if (["roundabout", "rotary", "roundabout turn"].includes(t)) return RefreshCw;
  if (m === "uturn") return RotateCcw;
  if (m === "left" || m === "sharp left") return CornerUpLeft;
  if (m === "right" || m === "sharp right") return CornerUpRight;
  if (m === "slight left") return ArrowUpLeft;
  if (m === "slight right") return ArrowUpRight;
  return ArrowUp;
}

function formatStepDuration(seconds) {
  const s = Number(seconds) || 0;
  if (s <= 0) return "";
  if (s < 60) return `${Math.round(s)} sec`;
  return `${Math.max(1, Math.round(s / 60))} min`;
}

export default function NavigationPanel({ bus, colorIndex = 0, nav, onClose, onFocusStep }) {
  const listRef = useRef(null);
  const color = colorForBus(colorIndex);

  // Single source of truth: the same steps the hook uses for progress.
  const directions = nav?.steps ?? [];
  const stopsBySeq = new Map((bus?.stops ?? []).map((s) => [s.sequence, s]));

  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector(`[data-step="${nav?.stepIndex}"]`);
    if (!list || !row) return;
    // Scroll only inside the list (scrollIntoView would also scroll the page).
    const top = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [nav?.stepIndex]);

  if (!bus || !nav) return null;

  const active = nav.status === "running" || nav.status === "paused";
  const BannerIcon = iconFor(nav.nextStep);

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 flex max-h-[58%] flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-panel/95 text-text-primary shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-3 md:left-3 md:top-3 md:max-h-none md:w-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-9 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Navigation
            </div>
            <div className="truncate font-heading text-base font-bold">{bus.busId}</div>
            <div className="text-[11px] text-text-muted">
              {bus.stops?.length ?? 0} pickup stops · {bus.totalDistanceKm ?? "—"} km
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-text-muted transition hover:bg-white/10 hover:text-text-primary"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      {/* Next manoeuvre banner */}
      {active && (
        <div className="m-3 rounded-xl p-3 text-bg-grid" style={{ backgroundColor: color }}>
          <div className="flex items-center gap-3">
            <BannerIcon size={32} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-heading text-xl font-extrabold leading-tight">
                {nav.nextStep ? formatDistance(nav.distanceToNextM) : "Arriving"}
              </div>
              <div className="text-sm font-medium leading-snug">
                {nav.nextStep?.instruction ?? "Follow the road to school"}
              </div>
            </div>
          </div>
        </div>
      )}

      {nav.status === "finished" && (
        <div className="m-3 flex items-center gap-2 rounded-xl bg-emerald-400/15 p-3 text-sm text-emerald-300">
          <CheckCircle2 size={16} /> Route complete — back at school.
        </div>
      )}

      {nav.offRoute && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-amber-400/15 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} /> Vehicle is off the planned route.
        </div>
      )}

      {nav.gpsError && (
        <div className="mx-3 mb-2 rounded-lg bg-amber-400/15 px-3 py-2 text-xs text-amber-300">
          GPS: {nav.gpsError}
        </div>
      )}

      {/* Progress + stats */}
      <div className="px-4 pt-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${nav.progressPct}%`, backgroundColor: color }}
          />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-text-muted">Remaining</div>
            <div className="font-mono">{formatDistance(nav.remainingM)}</div>
          </div>
          <div>
            <div className="text-text-muted">ETA</div>
            <div className="font-mono">
              {formatMinutes(nav.status === "idle" ? bus.totalDurationMin : nav.remainingMin)}
            </div>
          </div>
          <div>
            <div className="text-text-muted">Stops</div>
            <div className="font-mono">
              {nav.stopsDone}/{bus.stops?.length ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {!active ? (
          <>
            <button
              onClick={() => nav.start("sim")}
              className="flex items-center gap-1.5 rounded-lg bg-signal-cyan/15 px-3 py-2 text-xs font-semibold text-signal-cyan transition hover:bg-signal-cyan/25"
            >
              <Play size={14} /> {nav.status === "finished" ? "Replay" : "Start (simulate)"}
            </button>
            <button
              onClick={() => nav.start("gps")}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium transition hover:bg-white/10"
            >
              <LocateFixed size={14} /> Use GPS
            </button>
          </>
        ) : (
          <>
            {nav.status === "running" ? (
              <button
                onClick={nav.pause}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
              >
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button
                onClick={nav.resume}
                className="flex items-center gap-1.5 rounded-lg bg-signal-cyan/15 px-3 py-2 text-xs text-signal-cyan transition hover:bg-signal-cyan/25"
              >
                <Play size={14} /> Resume
              </button>
            )}

            <button
              onClick={nav.stop}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10"
            >
              <Square size={14} /> End
            </button>

            <button
              onClick={() => nav.setFollow(!nav.follow)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition ${
                nav.follow ? "bg-bus-yellow/20 text-bus-yellow" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <Crosshair size={14} /> Follow
            </button>

            {nav.mode === "sim" && (
              <select
                value={nav.speed}
                onChange={(e) => nav.setSpeed(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-bg-grid px-2 py-2 text-xs"
              >
                {[1, 2, 4, 8, 16].map((s) => (
                  <option key={s} value={s}>
                    {s}x
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* Step list. data-lenis-prevent lets this list scroll under Lenis. */}
      <ol
        ref={listRef}
        data-lenis-prevent
        className="scroll-thin relative min-h-[120px] flex-1 space-y-1 overflow-y-auto border-t border-white/10 px-3 py-3"
      >
        {directions.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-text-muted">
            No route steps could be built for this bus (its road geometry is empty).
          </li>
        )}

        {directions.map((step, i) => {
          const Icon = iconFor(step);
          const stop = step.isStop ? stopsBySeq.get(step.stopSequence) : null;
          const current = active && i === nav.stepIndex;
          const passed = nav.status !== "idle" && i < nav.stepIndex;
          const duration = formatStepDuration(step.durationS);

          return (
            <li key={`${step.legIndex}-${i}`} data-step={i}>
              <button
                onClick={() => onFocusStep?.(i)}
                className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-xs transition ${
                  current ? "bg-bus-yellow/15" : "hover:bg-white/5"
                } ${passed ? "opacity-40" : ""}`}
              >
                {step.isStop ? (
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-bg-grid"
                    style={{ backgroundColor: color }}
                  >
                    {step.stopSequence}
                  </span>
                ) : (
                  <Icon
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      step.isSchool ? "text-bus-yellow" : "text-text-muted"
                    }`}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className={step.isStop || step.isSchool ? "font-semibold" : ""}>
                    {step.instruction}
                  </div>

                  {step.roadName && !step.isStop && !step.isSchool && (
                    <div className="text-text-muted">{step.roadName}</div>
                  )}

                  {stop && (
                    <div className="mt-0.5 text-text-muted">
                      {step.pickupPointId} · ETA +{stop.etaMinutesFromDeparture} min
                      {stop.studentNames?.length ? ` · ${stop.studentNames.join(", ")}` : ""}
                    </div>
                  )}

                  {!step.isStop && !step.isSchool && step.distanceM > 0 && (
                    <div className="text-text-muted">
                      {formatDistance(step.distanceM)}
                      {duration ? ` · ${duration}` : ""}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}