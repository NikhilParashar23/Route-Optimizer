'use client';

import React from 'react';
import {
  Rocket,
  GraduationCap,
  HeadphonesIcon,
  Workflow,
  CheckCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

const services = [
  {
    icon: Rocket,
    tag: 'Phase 01',
    title: 'District Implementation & GIS Ingestion',
    description:
      'Seamless ingestion of district student GIS datasets, bell schedules, IEP requirements, and hazard geofences with zero downtime.',
    features: [
      'Automated boundary & hazard zoning',
      'SIS (PowerSchool, Infinite Campus) sync',
      'Historical route data import',
    ],
    accent: 'border-route-blue/30 text-route-blue',
  },
  {
    icon: Workflow,
    tag: 'Phase 02',
    title: 'Turnkey Onboarding & Dispatch Setup',
    description:
      'Our dedicated transportation engineers configure multi-tier tiering, bell synchronization, and depot allocation tailored to your fleet.',
    features: [
      'Multi-tier bell schedule balancing',
      'Depot capacity load distribution',
      'Driver route bidding management',
    ],
    accent: 'border-signal-cyan/30 text-signal-cyan',
  },
  {
    icon: GraduationCap,
    tag: 'Phase 03',
    title: 'Driver Training & In-Vehicle Tablets',
    description:
      'Intuitive tablet interfaces designed for commercial drivers. Turn-by-turn spoken guidance, dynamic student manifests, and instant stop notifications.',
    features: [
      'High-contrast night & daylight modes',
      'Voice-guided student pickup prompts',
      'Hands-free compliance logging',
    ],
    accent: 'border-bus-yellow/30 text-bus-yellow',
  },
  {
    icon: HeadphonesIcon,
    tag: 'Phase 04',
    title: '24/7 Live Dedicated Operations Support',
    description:
      'Real-time morning and afternoon live dispatch monitoring with dedicated technical support specialists on standby for immediate assistance.',
    features: [
      'Sub-60 second morning response SLA',
      'Weather emergency reroute support',
      'Direct parent notification broadcast hub',
    ],
    accent: 'border-signal-cyan/30 text-signal-cyan',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="relative w-full bg-bg-grid py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-route-blue text-xs font-mono tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Full-Lifecycle Services
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-bold text-text-primary tracking-tight">
              From day one to peak efficiency.
            </h2>
            <p className="text-base sm:text-lg text-text-muted">
              We do not just hand you software. Our transportation specialists manage setup, integration, and training for your district.
            </p>
          </div>

          <a
            href="#demo"
            className="inline-flex items-center gap-2 text-sm font-mono text-signal-cyan hover:text-white transition-colors group"
          >
            Explore onboarding roadmap{' '}
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-3xl bg-bg-panel/70 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all group flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-text-primary group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-signal-cyan" />
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-muted">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-bold text-text-primary">
                    {service.title}
                  </h3>

                  <p className="text-sm text-text-muted leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2.5">
                  {service.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5 text-xs font-mono text-text-primary">
                      <CheckCircle className="w-4 h-4 text-route-blue shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
