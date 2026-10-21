'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RouteCraftLogo } from '@/components/RouteCraftLogo';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  isHeroFinished: boolean;
}

export function Header({ isHeroFinished }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-7xl transition-all duration-700 ease-out ${
        isHeroFinished
          ? 'opacity-100 translate-y-0 pointer-events-auto bg-bg-panel/90 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl py-3 px-6'
          : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <RouteCraftLogo size={42} />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl tracking-tight text-text-primary">
              Route<span className="text-signal-cyan">Craft</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-text-muted uppercase hidden sm:block">
              Bus Route Optimizer
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 ml-auto">
          <Link
            href="/"
            className="px-4 py-1.5 text-[15px] font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
          >
            Home
          </Link>
          <Link
            href="#features"
            className="px-4 py-1.5 text-[15px] font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
          >
            Features
          </Link>
          <Link
            href="#optimizer"
            className="px-4 py-1.5 text-[15px] font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
          >
            Optimizer
          </Link>
          <Link
            href="#about"
            className="px-4 py-1.5 text-[15px] font-medium text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
          >
            About Us
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 focus:outline-none ml-auto"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 pb-2">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-[15px] font-medium text-text-primary hover:bg-white/5 rounded-lg"
          >
            Home
          </Link>
          <Link
            href="#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-[15px] font-medium text-text-primary hover:bg-white/5 rounded-lg"
          >
            Features
          </Link>
          <Link
            href="#optimizer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-[15px] font-medium text-text-primary hover:bg-white/5 rounded-lg"
          >
            Optimizer
          </Link>
          <Link
            href="#about"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 text-[15px] font-medium text-text-primary hover:bg-white/5 rounded-lg"
          >
            About Us
          </Link>
        </div>
      )}
    </header>
  );
}