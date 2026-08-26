'use client';

import React, { useState } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star, ShieldCheck, Award } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Dr. Arthur Campbell',
    role: 'Director of Student Transportation',
    district: 'Lakeview Consolidated School District (12,400 Students)',
    fleet: 'Fleet: 64 Buses',
    metrics: '$210,000 saved in fuel & overtime in year one',
    quote:
      'Before RouteWise, routing adjustments after student address changes took our staff 4 to 5 days. Now, the dynamic clustering engine balances our runs in seconds, and our morning parent call volume dropped by 84%.',
    verified: 'Verified District Partner',
  },
  {
    id: 2,
    name: 'Patricia Henderson',
    role: 'Chief Transportation Officer',
    district: 'Oakridge County Public Schools (28,000 Students)',
    fleet: 'Fleet: 142 Buses',
    metrics: '99.6% morning on-time arrival rate',
    quote:
      'The live GPS precision and voice-guided tablet navigation gave our drivers immediate confidence, especially substitutes. Parents love the stop-proximity push notifications. It transformed district relations.',
    verified: 'Verified District Partner',
  },
  {
    id: 3,
    name: 'Robert Vance',
    role: 'Assistant Superintendent of Operations',
    district: 'Tri-Valley Regional School System (9,800 Students)',
    fleet: 'Fleet: 48 Buses',
    metrics: 'Reduced fleet by 6 buses while expanding coverage',
    quote:
      'RouteWise allowed us to optimize bell-schedule tiers across three high schools and five elementary campuses. We eliminated 6 lease units, cutting total district overhead without increasing rider ride times.',
    verified: 'Verified District Partner',
  },
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const current = testimonials[currentIndex];

  return (
    <section className="relative w-full bg-bg-grid py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-bus-yellow text-xs font-mono tracking-wider uppercase">
              <Award className="w-3.5 h-3.5" /> District Leadership Reviews
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-bold text-text-primary tracking-tight">
              Trusted by transportation directors nationwide.
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary transition-all hover:scale-105 active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary transition-all hover:scale-105 active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Featured Testimonial Card */}
        <div className="relative p-8 sm:p-12 md:p-16 rounded-3xl bg-bg-panel/80 border border-white/10 backdrop-blur-2xl shadow-glass-panel">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-1 text-bus-yellow">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>

              <blockquote className="text-xl sm:text-2xl md:text-3xl font-heading font-medium text-text-primary leading-snug">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-text-primary">
                    {current.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-muted">
                    {current.role} · <span className="text-signal-cyan">{current.district}</span>
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/20 text-signal-cyan text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> {current.verified}
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 font-mono">
              <span className="text-xs uppercase tracking-widest text-text-muted">District Key Metric</span>
              <p className="text-xl font-bold text-signal-cyan leading-tight">
                {current.metrics}
              </p>
              <div className="text-xs text-text-muted pt-2 border-t border-white/5 flex justify-between">
                <span>Active Deployment:</span>
                <span className="text-text-primary font-bold">{current.fleet}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center items-center gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'w-8 bg-signal-cyan shadow-glow-cyan'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
