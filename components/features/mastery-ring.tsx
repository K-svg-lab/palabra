/**
 * Mastery Ring Component
 * Apple Watch-style ring showing journey from New → Mastered
 * 
 * Circular visualization of vocabulary status distribution
 */

'use client';

import React, { useEffect, useState } from 'react';

interface MasteryRingProps {
  newWords: number;
  learningWords: number;
  masteredWords: number;
  totalWords: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { svg: 160, radius: 60, stroke: 12, center: 80 },
  md: { svg: 200, radius: 80, stroke: 14, center: 100 },
  lg: { svg: 260, radius: 105, stroke: 16, center: 130 },
};

export function MasteryRing({
  newWords,
  learningWords,
  masteredWords,
  totalWords,
  size = 'md',
  className = '',
}: MasteryRingProps) {
  const [animated, setAnimated] = useState(false);
  const config = SIZES[size];

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const radius = config.radius;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages
  const newPercentage = totalWords > 0 ? (newWords / totalWords) * 100 : 0;
  const learningPercentage = totalWords > 0 ? (learningWords / totalWords) * 100 : 0;
  const masteredPercentage = totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;

  // Calculate dash offsets for stacked rings (cumulative)
  const newDashOffset = animated
    ? circumference * (1 - newPercentage / 100)
    : circumference;
  const learningStart = newPercentage;
  const learningDashOffset = animated
    ? circumference * (1 - (learningStart + learningPercentage) / 100)
    : circumference;
  const masteredStart = newPercentage + learningPercentage;
  const masteredDashOffset = animated
    ? circumference * (1 - (masteredStart + masteredPercentage) / 100)
    : circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Ring */}
      <div className="relative" style={{ width: config.svg, height: config.svg }}>
        <svg
          width={config.svg}
          height={config.svg}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={config.center}
            cy={config.center}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            className="text-gray-200 dark:text-gray-800"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient-new" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient
              id="gradient-learning"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
            <linearGradient
              id="gradient-mastered"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* New words segment (blue) */}
          <circle
            cx={config.center}
            cy={config.center}
            r={radius}
            stroke="url(#gradient-new)"
            strokeWidth={config.stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={newDashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Learning words segment (purple) */}
          <circle
            cx={config.center}
            cy={config.center}
            r={radius}
            stroke="url(#gradient-learning)"
            strokeWidth={config.stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={learningDashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Mastered words segment (green) */}
          <circle
            cx={config.center}
            cy={config.center}
            r={radius}
            stroke="url(#gradient-mastered)"
            strokeWidth={config.stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={masteredDashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold">{totalWords}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Words</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6">
        <LegendItem icon="🆕" color="blue" label="New" value={newWords} />
        <LegendItem icon="📚" color="purple" label="Learning" value={learningWords} />
        <LegendItem icon="✅" color="green" label="Mastered" value={masteredWords} />
      </div>
    </div>
  );
}

/**
 * Legend item for the ring
 */
interface LegendItemProps {
  icon: string;
  color: 'blue' | 'purple' | 'green';
  label: string;
  value: number;
}

function LegendItem({ icon, color, label, value }: LegendItemProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-2xl">{icon}</div>
      <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
      <div className="text-sm font-medium">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

/**
 * Compact mastery ring for inline use
 */
export function MasteryRingCompact({
  newWords,
  learningWords,
  masteredWords,
  totalWords,
  size = 60,
  strokeWidth = 6,
}: {
  newWords: number;
  learningWords: number;
  masteredWords: number;
  totalWords: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const newPercentage = totalWords > 0 ? (newWords / totalWords) * 100 : 0;
  const learningPercentage = totalWords > 0 ? (learningWords / totalWords) * 100 : 0;
  const masteredPercentage = totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-gray-200 dark:text-gray-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#3B82F6"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - newPercentage / 100)}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#A855F7"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={
          circumference * (1 - (newPercentage + learningPercentage) / 100)
        }
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#10B981"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={
          circumference *
          (1 - (newPercentage + learningPercentage + masteredPercentage) / 100)
        }
        strokeLinecap="round"
      />
    </svg>
  );
}
