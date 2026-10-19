"use client";
import React from 'react';
import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-bg-grid text-white pt-10 pb-4 px-6 md:px-12 border-t border-white/10 relative z-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-11">

                {/* 1. About Us */}
                <div className="space-y-4">
                    <h3 className="font-serif text-3xl tracking-tighter text-text-primary">ROUTEWISE</h3>
                    <p className="text-zinc-400 text-base leading-relaxed">
                        An autonomous district fleet operating system optimizing school transportation, real-time ridership, and turn-by-turn routing at scale.
                    </p>
                </div>

                {/* 2. Quick Links */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Quick Links</h4>
                    <ul className="space-y-3 text-base text-zinc-400">
                        <li><Link href="/" className="hover:text-white transition-colors duration-300">Home</Link></li>
                        <li><a href="#services" className="hover:text-white transition-colors duration-300">Services</a></li>
                        <li><a href="#routes" className="hover:text-white transition-colors duration-300">Active Routes</a></li>
                        <li><a href="#demo" className="hover:text-white transition-colors duration-300">Schedule Demo</a></li>
                    </ul>
                </div>

                {/* 3. Features */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Platform OS</h4>
                    <ul className="space-y-3 text-base text-zinc-400">
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Ridership Sync</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Stop Clustering</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Live Telematics</a></li>
                        <li><a href="#features" className="hover:text-white transition-colors duration-300">Dispatch Hub</a></li>
                    </ul>
                </div>

                {/* 4. Contact Section */}
                <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] font-bold mb-6 text-zinc-200">Contact</h4>
                    <ul className="space-y-3 text-base text-zinc-400">
                        <li className="flex items-center gap-2">
                            <span>📧</span> dispatch@routewise.io
                        </li>
                        <li className="flex items-center gap-2">
                            <span>📸</span> @routewise
                        </li>
                        <li className="flex items-center gap-2">
                            <span>🌐</span> India
                        </li>
                    </ul>
                </div>
            </div>

            {/* 5. Bottom Bar */}
            <div className="max-w-7xl mx-auto pt-1 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] uppercase tracking-widest text-zinc-500">
                <div className="text-center md:text-left">
                    © 2026 RouteWise. All rights reserved. <span className="mx-2 hidden md:inline">|</span> Designed with ❤️ for smarter fleet routing.
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>
            </div>
        </footer>
    );
};