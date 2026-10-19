import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
}

export function RouteCraftLogo({ className = '', size = 40 }: LogoProps) {
  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,229,199,0.3)] border border-cyan-500/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="RouteCraft Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}