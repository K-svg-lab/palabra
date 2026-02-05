/**
 * Activity Ring Component
 * Inspired by Apple Watch activity rings
 * 
 * Shows circular progress for daily goals with smooth animations
 * and gradient colors
 */

'use client';

import { useEffect, useState } from 'react';

interface ActivityRingProps {
  current: number;
  target: number;
  label: string;
  gradient: { start: string; end: string };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const SIZES = {
  sm: { svg: 120, radius: 45, stroke: 10, text: '2xl' },
  md: { svg: 180, radius: 70, stroke: 12, text: '4xl' },
  lg: { svg: 240, radius: 95, stroke: 14, text: '6xl' },
};

export function ActivityRing({
  current,
  target,
  label,
  gradient,
  size = 'md',
  showDetails = true,
}: ActivityRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const actualPercentage = Math.min((current / Math.max(target, 1)) * 100, 100);
  
  const config = SIZES[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  // Animate the ring on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentage(actualPercentage);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [actualPercentage]);

  return (
    <div className="flex flex-col items-center">
      {/* SVG Ring */}
      <div className="relative" style={{ width: config.svg, height: config.svg }}>
        <svg
          width={config.svg}
          height={config.svg}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={config.svg / 2}
            cy={config.svg / 2}
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            className="text-gray-200 dark:text-gray-800"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient
              id={`gradient-${label.replace(/\s+/g, '-')}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          </defs>
          
          {/* Progress ring with gradient */}
          <circle
            cx={config.svg / 2}
            cy={config.svg / 2}
            r={config.radius}
            stroke={`url(#gradient-${label.replace(/\s+/g, '-')})`}
            strokeWidth={config.stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(0, 122, 255, 0.3))',
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold tracking-tight text-${config.text}`}>
            {current}
          </div>
          {showDetails && target > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              of {target}
            </div>
          )}
        </div>
      </div>
      
      {/* Label */}
      <div className="mt-4 text-center">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </div>
        {showDetails && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {Math.round(actualPercentage)}% complete
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact stat pill for secondary metrics
 */
interface StatPillProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export function StatPill({ icon, value, label, color = 'gray' }: StatPillProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
      <span className="text-xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-sm font-bold">{value}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
}
