'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface RouteLineOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  progress: number; // 0 to 1 scroll progress from parent spring
}

export function RouteLineOverlay({ containerRef, progress }: RouteLineOverlayProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const busRef = useRef<SVGGElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Chapter 4 range: 0.60 to 0.80
  const isChapter4 = progress >= 0.58 && progress <= 0.82;
  const localProgress = Math.max(0, Math.min(1, (progress - 0.60) / 0.20));

  useEffect(() => {
    if (!pathRef.current) return;
    const path = pathRef.current;
    const length = path.getTotalLength();

    // Set initial dasharray and dashoffset
    path.style.strokeDasharray = `${length}`;
    
    // Direct scrub mapping for instant 60fps lockstep
    const currentOffset = length * (1 - localProgress);
    path.style.strokeDashoffset = `${currentOffset}`;

    // Position bus along path
    if (busRef.current && localProgress > 0 && localProgress <= 1) {
      const point = path.getPointAtLength(length * localProgress);
      const nextPoint = path.getPointAtLength(Math.min(length, length * localProgress + 2));
      const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;

      busRef.current.setAttribute(
        'transform',
        `translate(${point.x}, ${point.y}) rotate(${angle})`
      );
      busRef.current.style.opacity = '1';
    } else if (busRef.current) {
      busRef.current.style.opacity = '0';
    }
  }, [localProgress]);

  // GSAP ScrollTrigger backup registration if container is available
  useEffect(() => {
    if (!containerRef.current || !pathRef.current) return;

    const ctx = gsap.context(() => {
      const path = pathRef.current;
      if (!path) return;
      const length = path.getTotalLength();

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // Remap overall progress 0.60 -> 0.80 to 0 -> 1
          const p = self.progress;
          const mapped = Math.max(0, Math.min(1, (p - 0.60) / 0.20));
          if (path) {
            path.style.strokeDashoffset = `${length * (1 - mapped)}`;
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);

  // Waypoint coordinate map in 1000x562 viewport space
  const waypoints = [
    { x: 180, y: 390, name: 'North Stop A' },
    { x: 310, y: 440, name: 'West Valley 1' },
    { x: 450, y: 370, name: 'Central Commons' },
    { x: 590, y: 460, name: 'East Ridge' },
    { x: 720, y: 360, name: 'Academy Way' },
    { x: 840, y: 430, name: 'Highland Park' },
    { x: 920, y: 340, name: 'School District Main' },
  ];

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-opacity duration-500 ${
        isChapter4 ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isChapter4}
    >
      <svg
        viewBox="0 0 1000 562"
        className="w-full h-full max-w-7xl max-h-[85vh] drop-shadow-glow-blue"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#00E5C7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Underlying subtle dashed guide */}
        <path
          d="M 180 390 Q 245 425 310 440 T 450 370 T 590 460 T 720 360 T 840 430 T 920 340"
          fill="none"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="3"
          strokeDasharray="6 6"
        />

        {/* Scrub-drawn Glowing Route Line */}
        <path
          ref={pathRef}
          d="M 180 390 Q 245 425 310 440 T 450 370 T 590 460 T 720 360 T 840 430 T 920 340"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-glow-cyan"
        />

        {/* Waypoint nodes */}
        {waypoints.map((wp, i) => (
          <g key={i} className="transition-transform duration-300">
            {/* Pulsing outer ring */}
            <circle
              cx={wp.x}
              cy={wp.y}
              r="12"
              fill="none"
              stroke="#00E5C7"
              strokeWidth="1.5"
              className="animate-ping opacity-30 origin-center"
            />
            {/* Steady node */}
            <circle
              cx={wp.x}
              cy={wp.y}
              r="6"
              fill="#00E5C7"
              filter="url(#cyanGlow)"
            />
            <circle cx={wp.x} cy={wp.y} r="2.5" fill="#0A0C10" />
            
            {/* Node ID label */}
            <text
              x={wp.x}
              y={wp.y - 12}
              textAnchor="middle"
              fill="#8A93A3"
              className="text-[10px] font-mono tracking-widest fill-text-muted select-none"
            >
              WP-0{i + 1}
            </text>
          </g>
        ))}

        {/* Dynamic Bus Icon Following the Path */}
        <g ref={busRef} style={{ opacity: 0 }} className="transition-opacity duration-200">
          <g transform="translate(-16, -10)">
            <rect
              width="32"
              height="20"
              rx="4"
              fill="#FFC93C"
              stroke="#0A0C10"
              strokeWidth="1.5"
              className="shadow-glow-yellow"
            />
            {/* Windshield */}
            <rect x="22" y="3" width="7" height="14" rx="1.5" fill="#12151C" />
            {/* Side Windows */}
            <rect x="4" y="3" width="5" height="6" rx="1" fill="#12151C" />
            <rect x="11" y="3" width="5" height="6" rx="1" fill="#12151C" />
            <rect x="18" y="3" width="3" height="6" rx="1" fill="#12151C" />
            {/* Headlights */}
            <circle cx="31" cy="5" r="1.5" fill="#00E5C7" />
            <circle cx="31" cy="15" r="1.5" fill="#00E5C7" />
          </g>
        </g>
      </svg>
    </div>
  );
}
