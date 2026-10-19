'use client';

import React from 'react';
import { Network, Cpu, ShieldCheck, MapPin } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  glowColor: 'cyan' | 'blue';
}

const features = [
  {
    icon: <Network className="w-6 h-6 text-signal-cyan" />,
    title: 'Intelligent Cluster Resolution',
    description:
      'Spatial clustering algorithms aggregate student locations into optimized pickup zones, minimizing walking distances and eliminating stop redundancy.',
    tag: 'SPATIAL DBSCAN',
    glowColor: 'cyan' as const,
  },
  {
    icon: <Cpu className="w-6 h-6 text-route-blue" />,
    title: 'Automated Path Synthesis',
    description:
      'Advanced vehicle routing problem solvers construct non-overlapping bus itineraries based on passenger load constraints and time windows.',
    tag: 'SOLVER ENGINE',
    glowColor: 'blue' as const,
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-signal-cyan" />,
    title: 'Roster & Reregistration Sync',
    description:
      'Directly sync passenger rosters from district databases or static imports, ensuring passenger count changes immediately recalculate route loads.',
    tag: 'DATA INGESTION',
    glowColor: 'cyan' as const,
  },
  {
    icon: <MapPin className="w-6 h-6 text-route-blue" />,
    title: 'Multi-Vehicle Fleet OS',
    description:
      'Coordinate heterogenous bus fleets across single and multi-school bell times while maximizing vehicle capacity and reducing fuel usage.',
    tag: 'DISTRICT FLEET',
    glowColor: 'blue' as const,
  },
];

export function Features() {
  return (
    <section 
      id="features" 
      className="relative w-full pt-8 sm:pt-12 pb-24 sm:pb-32 bg-bg-grid overflow-hidden border-t border-white/5"
    >
      {/* Background Glow Elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-route-blue/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-signal-cyan/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-widest uppercase shadow-glow-cyan/10">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse" />
            Autonomous Fleet Logistics
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary tracking-tight">
            Route<span className="text-signal-cyan">Craft</span>
          </h2>

          <p className="text-lg sm:text-2xl font-heading text-text-muted tracking-tight font-medium">
            Connecting Points, Crafting Routes
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between p-7 rounded-2xl bg-bg-panel/70 border border-white/10 hover:border-white/25 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Card Top / Content */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    feature.glowColor === 'cyan' 
                      ? 'bg-signal-cyan/10 border-signal-cyan/30 text-signal-cyan shadow-glow-cyan/20' 
                      : 'bg-route-blue/10 border-route-blue/30 text-route-blue shadow-glow-blue/20'
                  }`}>
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-text-muted">
                    {feature.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-heading font-bold text-text-primary group-hover:text-signal-cyan transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom Subtle Accent Bar */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>MODULE 0{idx + 1}</span>
                <span className="group-hover:text-signal-cyan transition-colors">ACTIVE</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}