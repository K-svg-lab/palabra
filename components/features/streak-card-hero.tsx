/**
 * Streak Card Hero Component
 * Fire emoji with animated glow for active streaks
 * Inspired by Duolingo but more sophisticated
 * 
 * Features:
 * - Glowing fire animation
 * - Gradient background
 * - Progress to next milestone
 * - Celebration states
 */

'use client';

import React from 'react';

interface StreakCardHeroProps {
  currentStreak: number;
  nextMilestone?: number;
  className?: string;
}

export function StreakCardHero({
  currentStreak,
  nextMilestone = 30,
  className = '',
}: StreakCardHeroProps) {
  const progressToMilestone =
    currentStreak < nextMilestone ? (currentStreak / nextMilestone) * 100 : 100;
  const daysRemaining = Math.max(0, nextMilestone - currentStreak);
  const hasReachedMilestone = currentStreak >= nextMilestone;

  return (
    <div
      className={`
        relative rounded-3xl p-8 text-white overflow-hidden shadow-xl
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF4500 100%)',
      }}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 animate-pulse-slow">
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 200, 0, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Fire emoji with glow effect */}
        <div
          className="text-8xl mb-4 animate-bounce-subtle drop-shadow-glow"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(255, 200, 0, 0.6))',
          }}
        >
          🔥
        </div>

        {/* Streak number */}
        <div className="text-7xl font-bold mb-2 tracking-tight">
          {currentStreak}
        </div>

        {/* Label */}
        <div className="text-xl font-semibold opacity-90 mb-6">
          {currentStreak === 1 ? 'Day Streak' : 'Day Streak'}
        </div>

        {/* Progress to next milestone */}
        {!hasReachedMilestone ? (
          <div className="max-w-xs mx-auto">
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressToMilestone}%` }}
              />
            </div>
            <div className="text-sm opacity-80">
              {daysRemaining === 1
                ? '1 more day'
                : `${daysRemaining} more days`}{' '}
              to {nextMilestone}-day milestone
            </div>
          </div>
        ) : (
          <div className="max-w-xs mx-auto">
            <div className="text-lg font-semibold mb-2">
              🏆 {nextMilestone}-Day Achievement Unlocked!
            </div>
            <div className="text-sm opacity-80">
              You're on fire! Keep the streak alive!
            </div>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-4 text-4xl opacity-20 animate-pulse">
        ✨
      </div>
      <div className="absolute top-4 right-4 text-4xl opacity-20 animate-pulse delay-150">
        ✨
      </div>
      <div className="absolute bottom-4 left-1/4 text-3xl opacity-20 animate-pulse delay-300">
        💫
      </div>
      <div className="absolute bottom-4 right-1/4 text-3xl opacity-20 animate-pulse delay-450">
        💫
      </div>
    </div>
  );
}

/**
 * Compact streak indicator for navigation/header
 */
interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakBadge({
  streak,
  size = 'md',
  className = '',
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  if (streak === 0) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-gradient-to-r from-orange-500 to-red-600
        text-white font-semibold
        shadow-md
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span>🔥</span>
      <span>{streak}</span>
    </div>
  );
}

/**
 * Streak warning card - show when streak is at risk
 */
interface StreakWarningProps {
  hoursRemaining: number;
  currentStreak: number;
  onReviewClick: () => void;
  className?: string;
}

export function StreakWarning({
  hoursRemaining,
  currentStreak,
  onReviewClick,
  className = '',
}: StreakWarningProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-orange-50 to-red-50
        dark:from-orange-950/20 dark:to-red-950/20
        border-2 border-orange-300 dark:border-orange-800
        rounded-xl p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
            Don't lose your {currentStreak}-day streak!
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
            Review at least one card in the next {hoursRemaining}{' '}
            {hoursRemaining === 1 ? 'hour' : 'hours'} to keep your streak alive.
          </p>
          <button
            onClick={onReviewClick}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Quick Review
          </button>
        </div>
      </div>
    </div>
  );
}
