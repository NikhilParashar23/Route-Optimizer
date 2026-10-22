"use client";

import {
  Users, MapPin, Bus, Route, Footprints, Gauge, Fuel, Wallet, Satellite, RadioTower,
} from "lucide-react";
import { motion } from "framer-motion";

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const items = [
    { icon: Users, label: "Students", value: stats.totalStudents, tint: "#3B82F6" },
    { icon: MapPin, label: "Pickup points", value: stats.totalPickupPoints, tint: "#FFC93C" },
    { icon: Bus, label: "Buses used", value: `${stats.totalBuses}/${stats.fleetSize}`, tint: "#00E5C7" },
    { icon: Route, label: "Total distance", value: `${stats.totalDistanceKm} km`, tint: "#B586FF" },
    { icon: Footprints, label: "Avg walk", value: `${stats.avgWalkDistanceM} m`, tint: "#33D6C0" },
    { icon: Gauge, label: "Seat utilization", value: `${stats.avgBusUtilizationPct}%`, tint: "#FF5470" },
    { icon: Fuel, label: "Est. fuel", value: `${stats.totalFuelLitres} L`, tint: "#F2A65A" },
    { icon: Wallet, label: "Est. fuel cost", value: `₹${stats.totalFuelCost}`, tint: "#3ECF8E" },
  ];

  const live = stats.routingSource === "osrm";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
              style={{ backgroundColor: item.tint }}
            />
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${item.tint}22`, color: item.tint }}
            >
              <item.icon size={16} />
            </div>
            <div className="mt-3 font-heading text-2xl font-extrabold leading-none text-text-primary">
              {item.value}
            </div>
            <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
        {live ? (
          <>
            <Satellite size={12} className="text-emerald-400" />
            Live OSRM road distances &amp; travel times
          </>
        ) : (
          <>
            <RadioTower size={12} className="text-bus-yellow" />
            OSRM unreachable — straight-line distance with an assumed speed
          </>
        )}
      </div>
    </div>
  );
}