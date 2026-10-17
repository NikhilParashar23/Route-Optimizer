'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { useCanvasSequence } from '@/hooks/useCanvasSequence';
import { CHAPTERS, FRAME_COUNT, REDUCED_MOTION_FRAME_INDEX, getFramePath } from '@/lib/sequenceConfig';
import { ArrowDown, Bus, Compass, ShieldCheck, Sparkles, Zap, ChevronDown, PhoneCall, Shield, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

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
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Only show header once the scrollytelling sequence is fully completed (98%+)
  const isHeroFinished = scrollProgress >= 0.98;

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
                {preloadProgress}% 
                {/* ({loadedCount}/{FRAME_COUNT}) */}
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600vh] bg-bg-grid select-none"
      id="hero-sequence"
    >
      {/* Navigation Header that fades in smoothly only after the hero scrollytelling ends */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-7xl transition-all duration-700 ease-out ${
          isHeroFinished
            ? 'opacity-100 translate-y-0 pointer-events-auto bg-bg-panel/90 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl py-3 px-6'
            : 'opacity-0 -translate-y-10 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-route-blue/30 via-bg-panel to-signal-cyan/30 border border-white/15 flex items-center justify-center transition-transform group-hover:scale-105 shadow-glow-cyan/20">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-bus-yellow"
                fill="currentColor"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-tight text-text-primary">
                Route<span className="text-signal-cyan">Wise</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-text-muted uppercase hidden sm:block">
                District Fleet OS
              </span>
            </div>
          </Link>

          {/* Center Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="#services"
              className="px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
            >
              Services
            </Link>
            <Link
              href="#routes"
              className="px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
            >
              Routes
            </Link>
            <Link
              href="#products"
              className="px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
            >
              Products
            </Link>
            <Link
              href="#dashboard"
              className="px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
            >
              Reports
            </Link>

            {/* Contact Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsContactDropdownOpen(true)}
              onMouseLeave={() => setIsContactDropdownOpen(false)}
            >
              <button
                onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
                aria-expanded={isContactDropdownOpen}
              >
                Contact
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isContactDropdownOpen ? 'rotate-180 text-signal-cyan' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isContactDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 p-2 rounded-2xl bg-bg-panel/95 border border-white/10 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    href="#demo"
                    onClick={() => setIsContactDropdownOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-route-blue/20 flex items-center justify-center text-route-blue group-hover:text-white group-hover:bg-route-blue transition-colors">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">District Demo</p>
                      <p className="text-[11px] text-text-muted">Live dispatch simulation</p>
                    </div>
                  </Link>

                  <Link
                    href="#services"
                    onClick={() => setIsContactDropdownOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-signal-cyan/20 flex items-center justify-center text-signal-cyan group-hover:text-bg-grid group-hover:bg-signal-cyan transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">24/7 Operations Hub</p>
                      <p className="text-[11px] text-text-muted">Emergency driver support</p>
                    </div>
                  </Link>

                  <div className="mt-1 pt-2 border-t border-white/5 px-2.5 py-1 flex items-center justify-between text-[11px] font-mono text-signal-cyan">
                    <span>99.98% DISPATCH UPTIME</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="#demo"
              className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors border border-white/10 hover:border-white/20 rounded-full hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-route-blue hover:bg-blue-600 rounded-full transition-all shadow-glow-blue hover:scale-105 active:scale-95"
            >
              Sign Up Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 pb-2 animate-in fade-in duration-200">
            <Link
              href="#services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg"
            >
              Services
            </Link>
            <Link
              href="#routes"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg"
            >
              Routes
            </Link>
            <Link
              href="#products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg"
            >
              Products
            </Link>
            <Link
              href="#dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg"
            >
              Reports & Telematics
            </Link>
            <Link
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-text-primary hover:bg-white/5 rounded-lg"
            >
              Contact & Support
            </Link>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="#demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-text-primary border border-white/10 rounded-full"
              >
                Log In
              </Link>
              <Link
                href="#demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-white bg-route-blue rounded-full shadow-glow-blue"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Pinned Sticky Viewport Container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        {/* Chapter Overlays Layer - Positioned at top-8 sm:top-12 */}
        <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 z-35 pointer-events-none w-[94%] max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
            
            {/* CHAPTER 1: Hero (0.00 - 0.20) */}
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

            {/* CHAPTER 2: Count-up (0.20 - 0.40) */}
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
                  <Compass className="w-3.5 h-3.5" /> Chapter 02 · Ridership
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary tracking-tight">
                  Real-time student ridership sync
                </h2>
              </div>
            </div>

            {/* CHAPTER 3: Pickup points (0.40 - 0.60) */}
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

            {/* CHAPTER 4: Route draw (0.60 - 0.80) */}
            <div
              style={{
                opacity: ch4.opacity,
                transform: `translateY(${ch4.translateY}px)`,
                pointerEvents: ch4.pointerEvents,
              }}
              className="absolute inset-x-0 top-0 flex flex-col items-center text-center transition-opacity duration-300 ease-out px-4"
            >
              <div className="space-y-2 max-w-3xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-route-blue text-xs font-mono tracking-wider uppercase shadow-glow-blue/20">
                  <Zap className="w-3.5 h-3.5" /> Chapter 04 · Live Trajectory
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary tracking-tight">
                  Dynamic turn-by-turn routing
                </h2>
              </div>
            </div>

          </div>
        </div>

        {/* Seamless Bottom Gradient Fade to merge into the next section smoothly */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-bg-grid via-bg-grid/80 to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}