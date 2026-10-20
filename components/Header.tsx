'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RouteCraftLogo } from '@/components/RouteCraftLogo';
import { ArrowRight, Menu, X, Lock, Mail, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isHeroFinished: boolean;
}

export function Header({ isHeroFinished }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignInClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setIsSignInOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Signing in with: ${email}`);
    setIsSignInOpen(false);
  };

  return (
    <>
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
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 ml-auto mr-6">
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

          {/* Right Action CTA - Sign in */}
          <div className="hidden sm:flex items-center shrink-0">
            <a
              href="#signin"
              onClick={handleSignInClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-route-blue hover:bg-blue-600 rounded-full transition-all shadow-glow-blue hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign in
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
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
            <div className="pt-2">
              <a
                href="#signin"
                onClick={handleSignInClick}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white bg-route-blue rounded-full shadow-glow-blue cursor-pointer"
              >
                Sign in
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* SIGN IN MODAL CARD OVERLAY */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md p-8 rounded-2xl bg-bg-panel border border-white/15 shadow-2xl backdrop-blur-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-5 right-5 p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan text-[11px] font-mono tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Portal
              </div>
              <h3 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
                Sign in to <span className="text-signal-cyan">RouteCraft</span>
              </h3>
              <p className="text-xs text-text-muted">
                Enter your district credentials to access fleet telemetry.
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Email Address Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@district.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-primary placeholder:text-text-muted/50 text-sm focus:outline-none focus:border-signal-cyan transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-primary placeholder:text-text-muted/50 text-sm focus:outline-none focus:border-signal-cyan transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Sign In Button Container with spacing above and below */}
              <div className="pt-4 pb-5">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-route-blue hover:bg-blue-600 text-white font-heading font-bold text-sm tracking-wide shadow-glow-blue transition-all duration-200"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}