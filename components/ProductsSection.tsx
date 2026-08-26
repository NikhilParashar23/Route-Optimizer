'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Navigation2,
  BellRing,
  Smartphone,
  LayoutDashboard,
  CheckCircle,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';

const products = [
  {
    id: 'optimizer',
    name: 'Route Optimizer',
    icon: Cpu,
    tagline: 'Autonomous AI routing & hazard-aware pathfinding',
    description:
      'Solves the multi-depot vehicle routing problem (MDVRP) in seconds. Dynamically compresses multi-stop bus runs while honoring time windows and capacity constraints.',
    highlights: [
      'Sub-second route re-optimization on live traffic changes',
      'Hazard zone and left-turn reduction heuristic',
      'Dynamic stop clustering with safe-walk thresholds',
      'Automated bell-time tiering for triple-run buses',
    ],
    badge: 'Neural Engine 4.2',
    accentColor: '#3B82F6',
  },
  {
    id: 'gps',
    name: 'Live GPS Tracking',
    icon: Radio,
    tagline: '1-second refresh real-time vehicle telematics',
    description:
      'High-frequency hardware telemetry tracking exact vehicle trajectory, battery/fuel status, door open/close events, and instantaneous stop arrival timestamps.',
    highlights: [
      '1000ms latency stream over 5G IoT mesh',
      'Automated geofence stop entry/exit triggers',
      'Driver speed and harsh braking compliance alerts',
      'Deadhead and idling fuel burn analytics',
    ],
    badge: 'Low-Latency IoT',
    accentColor: '#00E5C7',
  },
  {
    id: 'parent',
    name: 'Parent Notifications',
    icon: BellRing,
    tagline: 'Peace of mind with live stop ETAs and boarding alerts',
    description:
      'Native iOS and Android mobile experience for parents. Live moving bus map, customizable arrival radius push alerts, and RFID student boarding confirmation.',
    highlights: [
      'Real-time bus map with 2-minute proximity alerts',
      'NFC/RFID badge scan notifications for student boarding',
      'Substitute driver and route delay automated SMS',
      'Multi-child and joint custody schedule support',
    ],
    badge: '4.9★ App Store',
    accentColor: '#FFC93C',
  },
  {
    id: 'driver',
    name: 'Driver App & Navigation',
    icon: Smartphone,
    tagline: 'Hands-free, voice-guided commercial navigation',
    description:
      'Ruggedized commercial tablet navigation built specifically for school bus clearances, bridge weight restrictions, and student pickup safety rules.',
    highlights: [
      'Turn-by-turn commercial vehicle routing (bridge heights, weight)',
      'Visual and audio student manifest at each waypoint',
      'Emergency one-touch panic dispatch alert button',
      'Automated pre-trip and post-trip digital inspection (DVIR)',
    ],
    badge: 'DOT / FMCSA Ready',
    accentColor: '#3B82F6',
  },
  {
    id: 'admin',
    name: 'Admin Command Console',
    icon: LayoutDashboard,
    tagline: 'Total district fleet situational awareness',
    description:
      'Central control station for transportation directors. Live multi-fleet maps, driver substitute assignment, state reporting exports, and parent dispute resolution logs.',
    highlights: [
      'Multi-depot unified visual dispatch board',
      'Instant substitute driver assignment and manifest sync',
      'One-click state state-aid compliance reporting',
      'Full route replay telemetry for dispute investigation',
    ],
    badge: 'Unified Dispatch',
    accentColor: '#00E5C7',
  },
];

export function ProductsSection() {
  const [activeProductId, setActiveProductId] = useState('optimizer');
  const activeProduct = products.find((p) => p.id === activeProductId) || products[0];
  const Icon = activeProduct.icon;

  return (
    <section id="products" className="relative w-full bg-bg-grid py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5" /> Product Architecture
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading font-bold text-text-primary tracking-tight">
            Integrated fleet intelligence software
          </h2>
          <p className="text-base sm:text-lg text-text-muted">
            Modular tools purpose-built for transportation directors, mechanics, drivers, and parents.
          </p>
        </div>

        {/* Product Navigation Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {products.map((p) => {
            const PIcon = p.icon;
            const isSelected = p.id === activeProductId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-route-blue text-white shadow-glow-blue scale-105'
                    : 'bg-bg-panel/80 text-text-muted hover:text-text-primary border border-white/10 hover:bg-white/5'
                }`}
              >
                <PIcon className="w-4 h-4" />
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Active Product Detailed Glass Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 sm:p-12 rounded-3xl bg-bg-panel/80 border border-white/10 backdrop-blur-2xl shadow-glass-panel items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-signal-cyan">
                {activeProduct.badge}
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-heading font-bold text-text-primary">
              {activeProduct.name}
            </h3>

            <p className="text-base sm:text-lg font-medium text-signal-cyan font-mono">
              {activeProduct.tagline}
            </p>

            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              {activeProduct.description}
            </p>

            <div className="space-y-3 pt-2">
              {activeProduct.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-sans text-text-primary">
                  <CheckCircle className="w-4 h-4 text-signal-cyan shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-text-primary text-xs font-mono transition-all hover:scale-105"
              >
                Request Technical Deep Dive <ArrowRight className="w-3.5 h-3.5 text-signal-cyan" />
              </a>
            </div>
          </div>

          {/* Interactive Feature Terminal / Visual Mock */}
          <div className="lg:col-span-6 rounded-2xl bg-bg-grid/90 border border-white/10 p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[11px] text-text-muted ml-2">routewise://module/{activeProduct.id}</span>
              </div>
              <span className="text-[10px] text-signal-cyan uppercase">SYS_ACTIVE_OK</span>
            </div>

            <div className="space-y-2 text-text-muted">
              <p className="text-signal-cyan font-bold">
                $ routewise optimize --district &quot;Unified-District-402&quot; --mode dynamic
              </p>
              <p>&gt; Ingesting 86 student addresses... [OK]</p>
              <p>&gt; Validating 14 pickup clusters against hazard maps... [OK]</p>
              <p>&gt; Applying bell schedule constraint solver (3-tier matrix)...</p>
              <p className="text-route-blue">&gt; Optimal solution computed: 4 buses | 48.2 km | 99.4% on-time ETA</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-muted">Engine Convergence Time:</span>
                <span className="text-signal-cyan font-bold">0.42 ms</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-muted">Vehicle Utilization:</span>
                <span className="text-text-primary font-bold">89.5%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-muted">Hazard Zone Bypass:</span>
                <span className="text-signal-cyan font-bold">100% (0 left turns across highway)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
