/**
 * Enhanced Stat Card Component
 * Apple-inspired stat cards with icons, progress bars, trends, and messages
 * 
 * Features:
 * - Large, bold numbers
 * - Icons with personality
 * - Progress bars with gradients
 * - Trend indicators (up/down/neutral)
 * - Motivational messages
 * - Smooth hover effects
 */

'use client';

import React, { useEffect, useState } from 'react';

interface StatCardEnhancedProps {
  icon: string | React.ReactNode;
  value: string | number;
  label: string;
  subtitle?: string;
  progress?: number; // 0-100
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  message?: string;
  gradient?: { from: string; to: string };
  color?: string;
  className?: string;
}

export function StatCardEnhanced({
  icon,
  value,
  label,
  subtitle,
  progress,
  trend,
  trendValue,
  message,
  gradient,
  color = 'blue-500',
  className = '',
}: StatCardEnhancedProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress bar on mount
  useEffect(() => {
    if (progress !== undefined) {
      const timeout = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500 dark:text-green-400';
      case 'down':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-gray-400 dark:text-gray-500';
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-900 
        rounded-2xl p-6 
        border border-gray-200 dark:border-gray-800 
        shadow-sm hover:shadow-md 
        transition-all duration-300
        ${className}
      `}
    >
      {/* Icon */}
      <div className="mb-3">
        {typeof icon === 'string' ? (
          <span className="text-4xl">{icon}</span>
        ) : (
          icon
        )}
      </div>

      {/* Value with trend */}
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-5xl font-bold tracking-tight">
          {value}
        </div>
        {trend && (
          <span className={`text-2xl font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {label}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            {gradient ? (
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${animatedProgress}%`,
                  background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
                }}
              />
            ) : (
              <div
                className={`bg-${color} h-full rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${animatedProgress}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Subtitle, trend value, or message */}
      {(subtitle || trendValue || message) && (
        <div className="space-y-1">
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </div>
          )}
          {trendValue && trend && (
            <div className={`text-xs font-medium ${getTrendColor()}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </div>
          )}
          {message && (
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact stat card for grids
 */
interface StatCardCompactProps {
  icon?: string | React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
  className?: string;
}

export function StatCardCompact({
  icon,
  value,
  label,
  color = 'blue-500',
  className = '',
}: StatCardCompactProps) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-900 
        rounded-xl p-4 
        border border-gray-200 dark:border-gray-800 
        shadow-sm
        ${className}
      `}
    >
      {icon && (
        <div className="mb-2">
          {typeof icon === 'string' ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

/**
 * Hero stat card with gradient background
 */
interface StatCardHeroProps {
  icon: string | React.ReactNode;
  value: string | number;
  label: string;
  description?: string;
  gradient: { from: string; to: string };
  className?: string;
}

export function StatCardHero({
  icon,
  value,
  label,
  description,
  gradient,
  className = '',
}: StatCardHeroProps) {
  return (
    <div
      className={`
        rounded-3xl p-8 text-white overflow-hidden relative
        shadow-xl hover:shadow-2xl transition-all duration-300
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4">
          {typeof icon === 'string' ? (
            <span className="text-6xl drop-shadow-lg">{icon}</span>
          ) : (
            icon
          )}
        </div>

        {/* Value */}
        <div className="text-7xl font-bold mb-2 tracking-tight">
          {value}
        </div>

        {/* Label */}
        <div className="text-xl font-semibold opacity-90 mb-2">{label}</div>

        {/* Description */}
        {description && (
          <div className="text-sm opacity-80">{description}</div>
        )}
      </div>
    </div>
  );
}
