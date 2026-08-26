'use client';

import React from 'react';
import Link from 'next/link';
import { Bus, Shield, CheckCircle, Heart, ArrowUp } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full bg-bg-grid border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-text-muted">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-route-blue/30 to-signal-cyan/30 border border-white/15 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-bus-yellow"
                  fill="currentColor"
                >
                  <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                </svg>
              </div>
              <span className="font-heading font-bold text-2xl tracking-tight text-text-primary">
                Route<span className="text-signal-cyan">Wise</span>
              </span>
            </Link>

            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              The next-generation autonomous student transportation and fleet optimization operating system.
            </p>

            {/* Live Telemetry System Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-signal-cyan/10 border border-signal-cyan/20 text-signal-cyan text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
              <span>ALL DISPATCH SYSTEMS OPERATIONAL (99.98%)</span>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-primary">Platform</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="#products" className="hover:text-signal-cyan transition-colors">
                  Route Optimizer AI
                </Link>
              </li>
              <li>
                <Link href="#products" className="hover:text-signal-cyan transition-colors">
                  1-Sec GPS Telemetry
                </Link>
              </li>
              <li>
                <Link href="#products" className="hover:text-signal-cyan transition-colors">
                  Parent Guardian App
                </Link>
              </li>
              <li>
                <Link href="#products" className="hover:text-signal-cyan transition-colors">
                  Driver Navigation Tablet
                </Link>
              </li>
              <li>
                <Link href="#products" className="hover:text-signal-cyan transition-colors">
                  District Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-primary">Solutions</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="#services" className="hover:text-signal-cyan transition-colors">
                  Special Education (SPED)
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-signal-cyan transition-colors">
                  Multi-Tier Bell Sync
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-signal-cyan transition-colors">
                  Hazard Zone Pathfinding
                </Link>
              </li>
              <li>
                <Link href="#services" className="hover:text-signal-cyan transition-colors">
                  Substitute Driver Dispatch
                </Link>
              </li>
              <li>
                <Link href="#dashboard" className="hover:text-signal-cyan transition-colors">
                  State-Aid Mileage Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-primary">Compliance</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center gap-1.5 text-text-primary">
                <CheckCircle className="w-3.5 h-3.5 text-signal-cyan" /> FERPA Compliant
              </li>
              <li className="flex items-center gap-1.5 text-text-primary">
                <CheckCircle className="w-3.5 h-3.5 text-signal-cyan" /> COPPA Certified
              </li>
              <li className="flex items-center gap-1.5 text-text-primary">
                <CheckCircle className="w-3.5 h-3.5 text-signal-cyan" /> SOC2 Type II Certified
              </li>
              <li className="flex items-center gap-1.5 text-text-primary">
                <CheckCircle className="w-3.5 h-3.5 text-signal-cyan" /> AES-256 Encrypted
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <p>© {new Date().getFullYear()} RouteWise Technologies Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="#demo" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#demo" className="hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="#demo" className="hover:text-text-primary transition-colors">
              Security Whitepaper
            </Link>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary transition-all ml-2"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
