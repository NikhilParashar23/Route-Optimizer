import {
  Sliders,
  Users,
  Gauge,
  PlayCircle,
  RefreshCw,
  Footprints,
  Bus,
  Timer,
  Scale,
  Fuel,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const [form, setForm] = useState({ name: "", lat: "", lng: "" });

useEffect(() => {
  if (school) {
    setForm({ name: school.name ?? "", lat: school.lat ?? "", lng: school.lng ?? "" });
  }
}, [school?.name, school?.lat, school?.lng]);

const latNum = Number(form.lat);
const lngNum = Number(form.lng);
const validLocation =
  form.lat !== "" && form.lng !== "" &&
  Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;

export default function ControlPanel({
  studentCount,
  setStudentCount,
  maxWalkDistance,
  setMaxWalkDistance,
  fleetTypes,
  setFleetTypes,
  maxRouteDuration,
  setMaxRouteDuration,
  timeWeight,
  setTimeWeight,
  fuelEfficiency,
  setFuelEfficiency,
  fuelPrice,
  setFuelPrice,
  onGenerateSample,
  onRunOptimizer,
  loading,
  hasStudents,
}) {
  return (
    <aside className="w-full lg:w-[300px] shrink-0 border-r border-panel-border bg-panel/60 backdrop-blur-sm flex flex-col">
      <div className="px-5 py-4 border-b border-panel-border">
        <div className="flex items-center gap-2 text-ink-primary font-display font-600 text-sm tracking-wide">
          <Sliders size={15} className="text-amber" />
          MISSION CONTROL
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Configure constraints, then run the optimizer.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-5 py-5 space-y-5">
        
        <SectionLabel>School location</SectionLabel>
<div className="space-y-2">
  <input
    value={form.name}
    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
    placeholder="School name"
    className="w-full rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber"
  />
  <div className="grid grid-cols-2 gap-2">
    <input
      value={form.lat}
      onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
      placeholder="Latitude"
      inputMode="decimal"
      className="rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber"
    />
    <input
      value={form.lng}
      onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
      placeholder="Longitude"
      inputMode="decimal"
      className="rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber"
    />
  </div>
  <button
    type="button"
    disabled={loading || !validLocation}
    onClick={() =>
      onApplySchool?.({ ...school, name: form.name || school?.name, lat: latNum, lng: lngNum })
    }
    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-panel-border py-2 text-xs text-ink-primary hover:border-amber hover:text-amber disabled:opacity-40"
  >
    <MapPin size={13} /> Apply location & regenerate students
  </button>
</div>
        
        <SectionLabel>Demand</SectionLabel>
        <Field icon={<Users size={13} />} label="Demo student count" value={`${studentCount} students`}>
          <input type="range" min={10} max={300} step={10} value={studentCount}
            onChange={(e) => setStudentCount(Number(e.target.value))} className="range-amber" />
        </Field>

        <SectionLabel>Safety & capacity constraints</SectionLabel>
        <Field icon={<Footprints size={13} />} label="Max safe walking distance" value={`${maxWalkDistance} m`}>
          <input type="range" min={100} max={1000} step={50} value={maxWalkDistance}
            onChange={(e) => setMaxWalkDistance(Number(e.target.value))} className="range-amber" />
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs text-ink-muted"><Bus size={13} /> Mixed-capacity fleet</span>
            <span className="text-[10px] font-mono text-amber">{fleetTypes.reduce((sum, type) => sum + Math.max(0, Number(type.count) || 0), 0)} buses · {fleetTypes.reduce((sum, type) => sum + Math.max(0, Number(type.count) || 0) * Math.max(0, Number(type.capacity) || 0), 0)} seats</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-muted">Set quantities and seating capacities. The optimizer prefers smaller buses when they can serve a route.</p>
          {fleetTypes.map((type, index) => (
            <div key={type.id} className="rounded-lg border border-panel-border bg-void/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <input aria-label="Bus type name" value={type.name} onChange={(e) => setFleetTypes((items) => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} className="min-w-0 flex-1 rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber" placeholder="Bus type" maxLength={24} />
                <button type="button" aria-label={`Remove ${type.name || "bus type"}`} title="Remove bus type" onClick={() => setFleetTypes((items) => items.filter((_, i) => i !== index))} disabled={fleetTypes.length === 1} className="rounded-md p-1.5 text-ink-muted hover:text-signal-red disabled:opacity-30"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-ink-muted">Number of buses<input type="number" min="0" max="50" value={type.count} onChange={(e) => setFleetTypes((items) => items.map((item, i) => i === index ? { ...item, count: e.target.value } : item))} className="mt-1 w-full rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber" /></label>
                <label className="text-[10px] text-ink-muted">Seats per bus<input type="number" min="1" max="100" value={type.capacity} onChange={(e) => setFleetTypes((items) => items.map((item, i) => i === index ? { ...item, capacity: e.target.value } : item))} className="mt-1 w-full rounded-md border border-panel-border bg-panel px-2 py-1.5 text-xs text-ink-primary outline-none focus:border-amber" /></label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setFleetTypes((items) => [...items, { id: `type-${Date.now()}`, name: `Bus type ${items.length + 1}`, count: 1, capacity: 20 }])} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-panel-border py-2 text-xs text-ink-muted hover:border-amber hover:text-amber"><Plus size={13} /> Add bus type</button>
        </div>
        <Field icon={<Timer size={13} />} label="Max route duration" value={`${maxRouteDuration} min`}>
          <input type="range" min={20} max={120} step={5} value={maxRouteDuration}
            onChange={(e) => setMaxRouteDuration(Number(e.target.value))} className="range-amber" />
        </Field>

        <SectionLabel>Multi-objective priority</SectionLabel>
        <Field
          icon={<Scale size={13} />}
          label="Distance ↔ Time priority"
          value={timeWeight <= 2 ? "Favor distance" : timeWeight >= 6 ? "Favor time" : "Balanced"}
        >
          <input type="range" min={0} max={8} step={1} value={timeWeight}
            onChange={(e) => setTimeWeight(Number(e.target.value))} className="range-amber" />
          <div className="flex justify-between text-[10px] text-ink-faint font-mono mt-1">
            <span>SHORTER ROUTE</span>
            <span>SHORTER RIDE</span>
          </div>
        </Field>

        <SectionLabel>Fuel model (estimated, not optimized)</SectionLabel>
        <Field icon={<Fuel size={13} />} label="Fuel efficiency" value={`${fuelEfficiency} km/L`}>
          <input type="range" min={3} max={15} step={0.5} value={fuelEfficiency}
            onChange={(e) => setFuelEfficiency(Number(e.target.value))} className="range-amber" />
        </Field>
        <Field icon={<Fuel size={13} />} label="Fuel price" value={`₹${fuelPrice} / L`}>
          <input type="range" min={50} max={150} step={5} value={fuelPrice}
            onChange={(e) => setFuelPrice(Number(e.target.value))} className="range-amber" />
        </Field>

        <div className="pt-2 space-y-2.5">
          <button
            onClick={onGenerateSample}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-panel-border bg-panel-raised hover:bg-panel-raised/70 text-ink-primary text-sm font-medium py-2.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Generate Sample Students
          </button>

          <button
            onClick={onRunOptimizer}
            disabled={loading || !hasStudents}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber hover:bg-amber-soft text-void font-display font-700 text-sm py-2.5 transition-colors shadow-glow disabled:opacity-40 disabled:shadow-none"
          >
            <PlayCircle size={16} />
            {loading ? "Optimizing…" : "Run Route Optimizer"}
          </button>
        </div>

        <div className="rounded-lg border border-panel-border bg-void/40 p-3 text-[11px] leading-relaxed text-ink-muted font-mono">
          PIPELINE: DBSCAN cluster → validate walk distance → real-road
          matrix (OSRM) → OR-Tools multi-objective VRP → fuel estimate.
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-mono tracking-widest text-ink-faint uppercase pt-1 first:pt-0">
      {children}
    </div>
  );
}

function Field({ icon, label, value, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          {icon}
          {label}
        </span>
        <span className="text-xs font-mono text-amber">{value}</span>
      </div>
      {children}
    </div>
  );
}
