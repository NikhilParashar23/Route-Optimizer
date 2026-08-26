'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bus, ChevronDown, Menu, X, ArrowRight, Shield, Layers, Navigation2, FileText, PhoneCall, CheckCircle } from 'lucide-react';

export function Header() {
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 600vh is roughly the hero sequence height
      const heroElement = document.getElementById('hero-sequence');
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect();
        // If bottom of hero element has passed top of viewport
        setIsScrolledPastHero(rect.bottom <= 120);
      } else {
        setIsScrolledPastHero(window.scrollY > 800);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-7xl transition-all duration-500 ${
        isScrolledPastHero
          ? 'bg-bg-panel/90 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl py-3 px-6'
          : 'bg-bg-panel/50 backdrop-blur-md border border-white/10 shadow-glass-panel rounded-full py-3.5 px-6'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-route-blue/30 via-bg-panel to-signal-cyan/30 border border-white/15 flex items-center justify-center transition-transform group-hover:scale-105 shadow-glow-cyan/20">
            {/* Geometric bus / fork icon */}
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
  );
}
