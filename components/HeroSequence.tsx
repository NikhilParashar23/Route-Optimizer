'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { useCanvasSequence } from '@/hooks/useCanvasSequence';
import { RouteCraftLogo } from '@/components/RouteCraftLogo';
import { Header } from '@/components/Header';
import { FRAME_COUNT } from '@/lib/sequenceConfig';
import { Compass, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

/**
 * Calculates smooth opacity and translateY values for chapter transitions
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
    const t = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
    opacity = Math.max(0, Math.min(1, t));
    translateY = 15 * (1 - opacity);
  } else if (progress > fadeOutStart) {
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

  // Image preloader hook
  const { images, progress: preloadProgress, isReady } = useImagePreloader();

  // Canvas sequence rendering hook
  useCanvasSequence({
    canvasRef,
    images,
    currentFrameRef,
    isReady,
    objectFit: 'contain',
  });

  // High-performance scroll tracking
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

        const targetFrame = Math.max(
          1,
          Math.min(FRAME_COUNT, Math.round(progress * (FRAME_COUNT - 1) + 1))
        );
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

  // Header visibility threshold
  const isHeroFinished = scrollProgress >= 0.98;

  // 1. PRELOADER SCREEN
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-grid flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="relative mx-auto flex items-center justify-center animate-pulse">
            <RouteCraftLogo size={64} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-heading font-bold text-text-primary tracking-tight">
              Route<span className="text-signal-cyan">Craft</span> Engine
            </h2>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest">
              Synchronizing Scrollytelling Sequence
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
                {preloadProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chapter Opacity Calculations
  const ch1 = getChapterOpacity(scrollProgress, 0.00, 0.00, 0.16, 0.22);
  const ch2 = getChapterOpacity(scrollProgress, 0.17, 0.22, 0.36, 0.42);
  const ch3 = getChapterOpacity(scrollProgress, 0.37, 0.42, 0.56, 0.62);
  const ch4 = getChapterOpacity(scrollProgress, 0.57, 0.62, 0.84, 0.90);

  // Chapter 5: Fades in precisely at 90.72%
  const ch5 = getChapterOpacity(scrollProgress, 0.9072, 0.9200, 0.9998, 0.9999);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600vh] bg-bg-grid select-none"
      id="hero-sequence"
    >
      {/* 2. EXTERNALIZED NAVIGATION HEADER */}
      <Header isHeroFinished={isHeroFinished} />

      {/* Pinned Sticky Viewport Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Canvas Layer holding sequence frames */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        {/* Chapter Overlays Layer */}
        <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 z-35 pointer-events-none w-[94%] max-w-7xl mx-auto flex flex-col items-center">
          <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
            
            {/* CHAPTER 1 */}
            <div
              style={{
                opacity: ch1.opacity,
                transform: `translateY(${ch1.translateY}px)`,
                pointerEvents: ch1.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4"
            >
              <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase shadow-glow-cyan/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
                  Autonomous Fleet Logistics
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary tracking-tight leading-[1.05]">
                  School transportation,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-route-blue via-signal-cyan to-white">
                    optimized.
                  </span>
                </h1>
              </div>
            </div>

            {/* CHAPTER 2 */}
            <div
              style={{
                opacity: ch2.opacity,
                transform: `translateY(${ch2.translateY}px)`,
                pointerEvents: ch2.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4"
            >
              <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase">
                  <Compass className="w-3.5 h-3.5" /> Chapter 02 · Spatial Mapping
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary tracking-tight">
                  Mapping student location and identifying stops
                </h2>
              </div>
            </div>

            {/* CHAPTER 3 */}
            <div
              style={{
                opacity: ch3.opacity,
                transform: `translateY(${ch3.translateY}px)`,
                pointerEvents: ch3.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4"
            >
              <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Chapter 03 · Stop Clustering
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary tracking-tight">
                  Intelligent cluster resolution
                </h2>
              </div>
            </div>

            {/* CHAPTER 4 */}
            <div
              style={{
                opacity: ch4.opacity,
                transform: `translateY(${ch4.translateY}px)`,
                pointerEvents: ch4.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4"
            >
              <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase shadow-glow-cyan/20">
                  <Zap className="w-3.5 h-3.5" /> Chapter 04 · Path Synthesis
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary tracking-tight">
                  Optimal path selection
                </h2>
              </div>
            </div>

            {/* CHAPTER 5 */}
            <div
              style={{
                opacity: ch5.opacity,
                transform: `translateY(${ch5.translateY}px)`,
                pointerEvents: ch5.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4 pt-16 sm:pt-24"
            >
              <div className="space-y-4 max-w-2xl mx-auto flex flex-col items-center">

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-text-primary tracking-tight">
                  Smarter Routes. Smarter Decisions.
                </h2>

                <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto leading-relaxed">
                  Your optimized routes are just a few clicks away.
                </p>

                <a
                  href="#optimizer"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-signal-cyan/10 hover:bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan font-heading font-bold text-sm tracking-wide shadow-glow-cyan backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200 mt-4 sm:mt-6 pointer-events-auto"
                >
                  Start Optimizing
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Smooth Bottom Seamless Gradient Blend */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-bg-grid via-bg-grid/80 to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}