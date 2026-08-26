'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { useCanvasSequence } from '@/hooks/useCanvasSequence';
import { CHAPTERS, FRAME_COUNT, REDUCED_MOTION_FRAME_INDEX, getFramePath } from '@/lib/sequenceConfig';
import { ArrowDown, Bus, Compass, ShieldCheck, Sparkles, Zap } from 'lucide-react';

/**
 * Calculates smooth opacity curve for chapter cross-fade
 */
function getChapterOpacity(
  progress: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number
): { opacity: number; translateY: number; pointerEvents: 'auto' | 'none' } {
  if (progress < fadeInStart || progress > fadeOutEnd) {
    return { opacity: 0, translateY: 15, pointerEvents: 'none' };
  }

  let opacity = 1;
  let translateY = 0;

  if (progress < fadeInEnd) {
    // Fading in
    const t = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
    opacity = Math.max(0, Math.min(1, t));
    translateY = 15 * (1 - opacity);
  } else if (progress > fadeOutStart) {
    // Fading out
    const t = (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
    opacity = Math.max(0, Math.min(1, 1 - t));
    translateY = -15 * (1 - opacity);
  }

  return {
    opacity,
    translateY,
    pointerEvents: opacity > 0.3 ? 'auto' : 'none',
  };
}

export function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef<number>(1);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Preloader hook
  const { images, loadedCount, progress: preloadProgress, isReady } = useImagePreloader();

  // Decoupled Canvas Sequence hook
  useCanvasSequence({
    canvasRef,
    images,
    currentFrameRef,
    isReady,
    objectFit: 'contain',
  });

  // Direct high-performance scroll tracker
  useEffect(() => {
    if (!isReady || prefersReducedMotion) return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const totalDistance = rect.height - window.innerHeight;
        
        if (totalDistance <= 0) return;

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalDistance));

        // Directly calculate frame 1 to 600
        const targetFrame = Math.max(1, Math.min(FRAME_COUNT, Math.round(progress * (FRAME_COUNT - 1) + 1)));
        currentFrameRef.current = targetFrame;
        setScrollProgress(progress);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isReady, prefersReducedMotion]);

  // Click handler to jump/scroll to specific chapter
  const scrollToChapter = useCallback((chapterIdx: number) => {
    if (!containerRef.current) return;
    const chapter = CHAPTERS[chapterIdx];
    if (!chapter) return;

    const targetProgress = (chapter.progressRange[0] + chapter.progressRange[1]) / 2;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const totalDistance = rect.height - window.innerHeight;
    const targetScrollY = containerTop + targetProgress * totalDistance;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }, []);

  // Reduced motion fallback view
  if (prefersReducedMotion) {
    return (
      <section className="relative w-full min-h-[90vh] bg-bg-grid flex items-center justify-center pt-24 pb-16 px-4 overflow-hidden">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Fleet Logistics
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-text-primary tracking-tight leading-[1.1]">
              School transportation,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-route-blue to-signal-cyan">
                optimized.
              </span>
            </h1>
            <p className="text-lg text-text-muted max-w-lg leading-relaxed">
              RouteWise delivers autonomous route computation, student ridership telemetry, and district-wide efficiency.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#demo"
                className="px-6 py-3 rounded-full bg-route-blue hover:bg-blue-600 text-white font-medium text-sm transition-all shadow-glow-blue"
              >
                Request District Demo
              </a>
              <a
                href="#services"
                className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary font-medium text-sm transition-all"
              >
                Explore Platform
              </a>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-bg-panel/70 p-3 shadow-2xl">
            <img
              src={getFramePath(REDUCED_MOTION_FRAME_INDEX)}
              alt="RouteWise school bus fleet route optimization visualization"
              className="w-full h-auto rounded-xl object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-widest font-mono">Status</p>
                <p className="text-sm font-bold text-signal-cyan font-mono">14 Waypoints · 4 Buses</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted uppercase tracking-widest font-mono">Efficiency</p>
                <p className="text-sm font-bold text-route-blue font-mono">48.2 km Optimized</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Preloader Screen
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-grid flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-route-blue/20 to-signal-cyan/20 border border-white/10 flex items-center justify-center shadow-glow-cyan">
            <Bus className="w-8 h-8 text-bus-yellow animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-heading font-bold text-text-primary tracking-tight">
              Route<span className="text-signal-cyan">Wise</span> Engine
            </h2>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest">
              Synchronizing 60fps Scrollytelling Sequence
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-route-blue via-signal-cyan to-route-blue rounded-full transition-all duration-150 ease-out shadow-glow-cyan"
                style={{ width: `${preloadProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-text-muted">
              <span>INITIALIZING TELEMETRY</span>
              <span className="text-signal-cyan font-bold tabular-nums">
                {preloadProgress}% ({loadedCount}/{FRAME_COUNT})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compute smooth cross-fade opacity and translations
  const ch1 = getChapterOpacity(scrollProgress, 0.00, 0.00, 0.16, 0.22);
  const ch2 = getChapterOpacity(scrollProgress, 0.17, 0.22, 0.36, 0.42);
  const ch3 = getChapterOpacity(scrollProgress, 0.37, 0.42, 0.56, 0.62);
  const ch4 = getChapterOpacity(scrollProgress, 0.57, 0.62, 0.76, 0.82);
  const ch5 = getChapterOpacity(scrollProgress, 0.77, 0.82, 1.00, 1.00);

  // Local chapter progress for scrubbing stat counters
  const ch2Prog = Math.max(0, Math.min(1, (scrollProgress - 0.20) / 0.20));
  const ch3Prog = Math.max(0, Math.min(1, (scrollProgress - 0.40) / 0.20));
  const ch4Prog = Math.max(0, Math.min(1, (scrollProgress - 0.60) / 0.20));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600vh] bg-bg-grid select-none"
      id="hero-sequence"
    >
      {/* Pinned Sticky Viewport Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        {/* Chapter Overlays Layer */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-7xl mx-auto">
          {/* Top spacer for fixed header */}
          <div className="h-20" />

          {/* Chapter Content Cross-fades */}
          <div className="relative flex-1 flex flex-col justify-center max-w-3xl">
            {/* CHAPTER 1: Hero (0.00 - 0.20) */}
            <div
              style={{
                opacity: ch1.opacity,
                transform: `translateY(${ch1.translateY}px)`,
                pointerEvents: ch1.pointerEvents,
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 transition-opacity duration-300 ease-out"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-signal-cyan text-xs font-mono tracking-wider uppercase shadow-glow-cyan/20">
                  <span className="w-2 h-2 rounded-full bg-signal-cyan animate-ping" />
                  Autonomous Fleet Logistics
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold text-text-primary tracking-tight leading-[1.05]">
                  School transportation,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-route-blue via-signal-cyan to-white">
                    optimized.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed font-sans">
                  Next-generation telemetry, automated dispatching, and dynamic route computation for modern educational districts.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-route-blue hover:bg-blue-600 text-white font-medium text-sm transition-all shadow-glow-blue hover:scale-105 active:scale-95"
                  >
                    Schedule District Demo <Zap className="w-4 h-4 text-signal-cyan" />
                  </a>
                  <a
                    href="#dashboard"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary font-medium text-sm backdrop-blur-md transition-all hover:border-white/20"
                  >
                    Explore Telematics
                  </a>
                </div>
              </div>
            </div>

            {/* CHAPTER 2: Count-up (0.20 - 0.40) */}
            <div
              style={{
                opacity: ch2.opacity,
                transform: `translateY(${ch2.translateY}px)`,
                pointerEvents: ch2.pointerEvents,
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 transition-opacity duration-300 ease-out"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-signal-cyan text-xs font-mono tracking-wider uppercase">
                  <Compass className="w-3.5 h-3.5" /> Chapter 02 · Ridership
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-text-primary tracking-tight">
                  Real-time student ridership sync
                </h2>

                <p className="text-base text-text-muted max-w-lg leading-relaxed">
                  Dynamic NFC boarding sensors and parent notifications confirm student safety at every single stop in real-time.
                </p>
              </div>
            </div>

            {/* CHAPTER 3: Pickup points (0.40 - 0.60) */}
            <div
              style={{
                opacity: ch3.opacity,
                transform: `translateY(${ch3.translateY}px)`,
                pointerEvents: ch3.pointerEvents,
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 transition-opacity duration-300 ease-out"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-signal-cyan text-xs font-mono tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Chapter 03 · Stop Clustering
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-text-primary tracking-tight">
                  Intelligent cluster resolution
                </h2>

                <p className="text-base text-text-muted max-w-lg leading-relaxed">
                  Eliminate hazardous road crossings and minimize walking distances with neural stop clustering algorithms.
                </p>
              </div>
            </div>

            {/* CHAPTER 4: Route draw (0.60 - 0.80) */}
            <div
              style={{
                opacity: ch4.opacity,
                transform: `translateY(${ch4.translateY}px)`,
                pointerEvents: ch4.pointerEvents,
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 transition-opacity duration-300 ease-out"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-route-blue text-xs font-mono tracking-wider uppercase shadow-glow-blue/20">
                  <Zap className="w-3.5 h-3.5" /> Chapter 04 · Live Trajectory
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-text-primary tracking-tight">
                  Dynamic turn-by-turn routing
                </h2>

                <p className="text-base text-text-muted max-w-lg leading-relaxed">
                  Real-time rerouting avoids sudden traffic jams and weather hazards, cutting total transit time by up to 28%.
                </p>
              </div>
            </div>

            {/* CHAPTER 5: Dashboard reveal (0.80 - 1.00) */}
            <div
              style={{
                opacity: ch5.opacity,
                transform: `translateY(${ch5.translateY}px)`,
                pointerEvents: ch5.pointerEvents,
              }}
              className="absolute top-1/2 -translate-y-1/2 left-0 transition-opacity duration-300 ease-out"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-signal-cyan text-xs font-mono tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Chapter 05 · Complete Control
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-text-primary tracking-tight">
                  One intelligent fleet
                </h2>

                <p className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed font-sans">
                  You manage scheduling, routing, and communication — while RouteWise handles the optimization for buses, riders, and drivers.
                </p>

                <div className="pt-2">
                  <a
                    href="#dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-signal-cyan hover:bg-teal-300 text-bg-grid font-bold text-sm transition-all shadow-glow-cyan hover:scale-105"
                  >
                    View Live Telematics Grid <ArrowDown className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Scrollytelling Progress Indicator & Interactive Navigation */}
            <div className="flex justify-end items-end border-t border-white/10 pt-4 pointer-events-auto">

          </div>
        </div>
      </div>
    </div>
  );
}
