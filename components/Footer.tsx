"use client";
import React from 'react';
import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-bg-grid text-white pt-12 pb-6 px-6 md:px-12 border-t border-white/10 relative z-20">
            {/* 4-Column Grid with balanced, equal distribution */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">

                {/* 1. About RouteCraft + Project Tagline */}
                <div className="space-y-3">
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-text-primary tracking-tight">
                        Route<span className="text-signal-cyan">Craft</span>
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-signal-cyan">
                        Connecting Points, Crafting Routes
                    </p>
                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed pt-1">
                        Smart school bus routing—converting student locations into safe, optimal neighborhood pickup paths.
                    </p>
                </div>

                {/* 2. Quick Links */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Quick Links</h4>
                    <ul className="space-y-3 text-sm sm:text-base text-zinc-400">
                        <li><Link href="/" className="hover:text-white transition-colors duration-300">Home</Link></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Features</a></li>
                        <li><a href="#optimizer" className="hover:text-white transition-colors duration-300">Route Optimizer</a></li>
                        <li><a href="#about" className="hover:text-white transition-colors duration-300">About Us</a></li>
                    </ul>
                </div>

                {/* 3. Route Craft Workflow */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Route Craft</h4>
                    <ul className="space-y-3 text-sm sm:text-base text-zinc-400">
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Spatial Mapping</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Stop Resolution</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Stop Clustering</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Path Synthesis</a></li>
                    </ul>
                </div>

                {/* 4. Contact Section */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Contact</h4>
                    <ul className="space-y-3 text-sm sm:text-base text-zinc-400">
                        <li className="flex items-center gap-2">
                            <span>📧</span> contact@routecraft.io
                        </li>
                        <li className="flex items-center gap-2">
                            <span>📸</span> @routecraft
                        </li>
                        <li className="flex items-center gap-2">
                            <span>🌐</span> India
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] uppercase tracking-widest text-zinc-500">
                <div className="text-center md:text-left">
                    © 2026 RouteCraft. All rights reserved. <span className="mx-2 hidden md:inline">|</span> Designed for smarter school bus routes.
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>
            </div>
        </footer>
    );
};