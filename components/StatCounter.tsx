'use client';

import React from 'react';

interface StatCounterProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  progress?: number; // local chapter progress 0 to 1
  decimals?: number;
  className?: string;
}

export function StatCounter({
  value,
  suffix = '',
  prefix = '',
  progress,
  decimals = 0,
  className = '',
}: StatCounterProps) {
  const isNumeric = typeof value === 'number';

  if (!isNumeric) {
    return (
      <span className={`font-mono tabular-nums tracking-tight font-bold ${className}`}>
        {prefix}
        {value}
        {suffix}
      </span>
    );
  }

  const numericTarget = value as number;

  // If progress is provided (0 to 1 in chapter scrub range), calculate current value smoothly
  let currentValue = numericTarget;
  if (typeof progress === 'number') {
    // Easing: reach 100% of value by 45% of chapter progress, smooth ease-out
    const ramp = Math.max(0, Math.min(1, progress / 0.45));
    const eased = 1 - Math.pow(1 - ramp, 3);
    currentValue = eased * numericTarget;
  }

  const formatted =
    decimals > 0
      ? currentValue.toFixed(decimals)
      : Math.round(currentValue).toString();

  return (
    <span className={`font-mono tabular-nums tracking-tight font-bold ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
