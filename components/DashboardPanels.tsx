'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  Bus,
  CheckCircle2,
  Clock,
  DollarSign,
  Fuel,
  Navigation,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const telemetryData = [
  { time: '06:30', onTimeRate: 94.2, legacyRate: 82.0, activeBuses: 4 },
  { time: '07:00', onTimeRate: 96.8, legacyRate: 83.5, activeBuses: 4 },
  { time: '07:30', onTimeRate: 99.4, legacyRate: 84.1, activeBuses: 4 },
  { time: '08:00', onTimeRate: 98.9, legacyRate: 81.2, activeBuses: 4 },
  { time: '08:30', onTimeRate: 99.1, legacyRate: 85.0, activeBuses: 2 },
  { time: '14:30', onTimeRate: 97.5, legacyRate: 82.4, activeBuses: 4 },
  { time: '15:00', onTimeRate: 99.2, legacyRate: 83.9, activeBuses: 4 },
  { time: '15:30', onTimeRate: 99.6, legacyRate: 80.5, activeBuses: 4 },
  { time: '16:00', onTimeRate: 98.7, legacyRate: 84.2, activeBuses: 3 },
];

const costComparisonData = [
  { metric: 'Fuel Gallons', legacy: 320, routewise: 218, unit: 'gal' },
  { metric: 'Driver Hours', legacy: 180, routewise: 126, unit: 'hrs' },
  { metric: 'Deadhead Km', legacy: 145, routewise: 48, unit: 'km' },
  { metric: 'Idling Mins', legacy: 410, routewise: 115, unit: 'min' },
];

const fleetUnits = [
  {
    id: 'BUS-01',
    driver: 'Marcus Vance',
    route: 'North Ridge Express',
    students: '24 / 28',
    status: 'On Time (07:42 ETA)',
    speed: '34 mph',
    batteryFuel: '92%',
    state: 'active',
  },
  {
    id: 'BUS-02',
    driver: 'Elena Rossi',
    route: 'West Valley Loop',
    students: '22 / 24',
    status: 'On Time (07:44 ETA)',
    speed: '28 mph',
    batteryFuel: '88%',
    state: 'active',
  },
  {
    id: 'BUS-03',
    driver: 'Devon Miller',
    route: 'South Crossing Line',
    students: '21 / 25',
    status: 'Departed Stop 6',
    speed: '31 mph',
    batteryFuel: '95%',
    state: 'active',
  },
  {
    id: 'BUS-04',
    driver: 'Sarah Jenkins',
    route: 'Highland Park Shuttle',
    students: '19 / 20',
    status: 'Arrived at School Main',
    speed: '0 mph (Parked)',
    batteryFuel: '91%',
    state: 'completed',
  },
];

export function DashboardPanels() {
  const [activeTab, setActiveTab] = useState<'realtime' | 'cost' | 'safety'>('realtime');

  return (
    <section id="dashboard" className="relative w-full bg-bg-grid py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-route-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-signal-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header matching Reference.md §7 */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-signal-cyan animate-pulse" /> Live Telematics Stream
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary tracking-tight">
            One intelligent fleet
          </h2>

          <p className="text-lg text-text-muted font-sans leading-relaxed">
            You manage scheduling, routing, and communication — while RouteWise handles the optimization for buses, riders, and drivers.
          </p>
        </div>

        {/* Real-time Telemetry Metrics Pill Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-signal-cyan/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-text-muted">On-Time Score</span>
              <div className="w-8 h-8 rounded-lg bg-signal-cyan/15 flex items-center justify-center text-signal-cyan group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-text-primary">99.4%</span>
              <span className="text-xs font-mono font-medium text-signal-cyan flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +15.8%
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">vs manual district routing</p>
          </div>

          <div className="p-6 rounded-2xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-route-blue/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Ridership Load</span>
              <div className="w-8 h-8 rounded-lg bg-route-blue/15 flex items-center justify-center text-route-blue group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-text-primary">86/96</span>
              <span className="text-xs font-mono font-medium text-route-blue flex items-center">
                89.5% capacity
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">Balanced student load</p>
          </div>

          <div className="p-6 rounded-2xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-bus-yellow/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Fuel & Miles</span>
              <div className="w-8 h-8 rounded-lg bg-bus-yellow/15 flex items-center justify-center text-bus-yellow group-hover:scale-110 transition-transform">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-text-primary">48.2 km</span>
              <span className="text-xs font-mono font-medium text-signal-cyan flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -31.4%
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">Daily distance reduced</p>
          </div>

          <div className="p-6 rounded-2xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-signal-cyan/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-text-muted">Safety Index</span>
              <div className="w-8 h-8 rounded-lg bg-signal-cyan/15 flex items-center justify-center text-signal-cyan group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-text-primary">100%</span>
              <span className="text-xs font-mono font-medium text-signal-cyan flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Zero incidents
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">Automated hazard geo-fencing</p>
          </div>
        </div>

        {/* Charts & Interactive Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main On-Time Performance Area Chart (2 cols) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-bg-panel/80 border border-white/10 backdrop-blur-2xl shadow-glass-panel flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-heading font-bold text-text-primary">
                  Live Dispatch On-Time Telemetry
                </h3>
                <p className="text-xs font-mono text-text-muted">
                  RouteWise Neural Dispatch vs Traditional Fixed Scheduling
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-signal-cyan shadow-glow-cyan" />
                  <span className="text-text-primary">RouteWise (99.4%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-white/30" />
                  <span className="text-text-muted">Legacy (82.1%)</span>
                </div>
              </div>
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5C7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00E5C7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#8A93A3"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#8A93A3"
                    fontSize={11}
                    domain={[75, 100]}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12151C',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#F5F6F8',
                      fontFamily: 'var(--font-space-mono)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="onTimeRate"
                    stroke="#00E5C7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#cyanArea)"
                    name="RouteWise"
                  />
                  <Area
                    type="monotone"
                    dataKey="legacyRate"
                    stroke="#8A93A3"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#blueArea)"
                    name="Legacy"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fleet Efficiency Cost-Per-Mile Comparison Bar Chart (1 col) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-bg-panel/80 border border-white/10 backdrop-blur-2xl shadow-glass-panel flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-xl font-heading font-bold text-text-primary">
                Resource Optimization
              </h3>
              <p className="text-xs font-mono text-text-muted">
                Daily operational metric reduction
              </p>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="metric"
                    stroke="#8A93A3"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#8A93A3"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12151C',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#F5F6F8',
                      fontFamily: 'var(--font-space-mono)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="legacy" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Legacy Baseline" />
                  <Bar dataKey="routewise" fill="#3B82F6" radius={[4, 4, 0, 0]} name="RouteWise" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Avg District Savings:</span>
              <span className="text-signal-cyan font-bold">$184,200 / year</span>
            </div>
          </div>
        </div>

        {/* Live Fleet Telematics Status Cards (4 Buses from Reference.md) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold text-text-primary">
              Active Fleet Manifest (4 Buses Synchronized)
            </h3>
            <span className="text-xs font-mono text-signal-cyan flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-signal-cyan animate-ping" />
              ALL UNITS OPERATIONAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fleetUnits.map((bus) => (
              <div
                key={bus.id}
                className="p-5 rounded-2xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-bus-yellow/15 flex items-center justify-center">
                      <Bus className="w-4 h-4 text-bus-yellow" />
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-bold text-text-primary">{bus.id}</h4>
                      <p className="text-[11px] text-text-muted">{bus.driver}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      bus.state === 'active'
                        ? 'bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30'
                        : 'bg-white/10 text-text-muted'
                    }`}
                  >
                    {bus.state === 'active' ? 'EN ROUTE' : 'AT BASE'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-text-muted">
                    <span>Route:</span>
                    <span className="text-text-primary font-medium">{bus.route}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Riders:</span>
                    <span className="text-signal-cyan font-bold">{bus.students}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Speed / Battery:</span>
                    <span className="text-text-primary">{bus.speed} · {bus.batteryFuel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-text-muted text-[11px]">{bus.status}</span>
                  <Navigation className="w-3.5 h-3.5 text-route-blue" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
