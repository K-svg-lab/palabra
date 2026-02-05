/**
 * Achievement Badge Component
 * iOS Game Center-style achievement system
 * 
 * Features:
 * - Unlocked vs locked states
 * - Progress tracking
 * - Celebration animations
 * - Beautiful gradients
 */

'use client';

import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import type { ProgressStats } from '@/lib/utils/progress';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number; // 0-100
  requirement?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  className?: string;
}

export function AchievementBadge({ achievement, className = '' }: AchievementBadgeProps) {
  const rarityGradients = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-600',
  };

  const gradient = rarityGradients[achievement.rarity || 'common'];

  return (
    <div
      className={`
        relative rounded-2xl p-6 border-2
        transition-all duration-300 hover:scale-105 cursor-pointer
        ${
          achievement.unlocked
            ? `bg-gradient-to-br ${gradient} border-transparent text-white shadow-xl`
            : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-60'
        }
        ${className}
      `}
    >
      {/* Icon */}
      <div
        className={`text-6xl mb-4 text-center ${
          achievement.unlocked ? 'drop-shadow-lg' : 'grayscale'
        }`}
      >
        {achievement.icon}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-center mb-2 ${
          achievement.unlocked
            ? 'text-white'
            : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {achievement.title}
      </h3>

      {/* Description */}
      <p
        className={`text-sm text-center mb-3 ${
          achievement.unlocked
            ? 'text-white/90'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {achievement.description}
      </p>

      {/* Status */}
      {achievement.unlocked ? (
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <CheckCircle className="h-4 w-4" />
          <span>Unlocked</span>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <Lock className="h-4 w-4" />
            <span>Locked</span>
          </div>
          {achievement.progress !== undefined && achievement.requirement && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all duration-500"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
              <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                {achievement.requirement}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shine effect for unlocked achievements */}
      {achievement.unlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient rounded-2xl pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Get all achievements for a user
 */
export function getUserAchievements(stats: ProgressStats): Achievement[] {
  return [
    {
      id: 'first-word',
      icon: '🏅',
      title: 'First Word',
      description: 'Added your first word',
      unlocked: stats.totalWords >= 1,
      requirement: 'Add 1 word',
      rarity: 'common',
    },
    {
      id: 'streak-7',
      icon: '🔥',
      title: '7-Day Streak',
      description: 'Reviewed for 7 days in a row',
      unlocked: stats.currentStreak >= 7,
      progress: Math.min((stats.currentStreak / 7) * 100, 100),
      requirement: `${stats.currentStreak}/7 days`,
      rarity: 'rare',
    },
    {
      id: 'streak-30',
      icon: '🔥🔥',
      title: '30-Day Streak',
      description: 'A full month of dedication',
      unlocked: stats.currentStreak >= 30,
      progress: Math.min((stats.currentStreak / 30) * 100, 100),
      requirement: `${stats.currentStreak}/30 days`,
      rarity: 'epic',
    },
    {
      id: 'accuracy-90',
      icon: '🎯',
      title: '90% Accuracy',
      description: 'Achieved 90% accuracy',
      unlocked: stats.overallAccuracy >= 90,
      progress: Math.min((stats.overallAccuracy / 90) * 100, 100),
      requirement: `${stats.overallAccuracy}/90%`,
      rarity: 'rare',
    },
    {
      id: 'words-100',
      icon: '📚',
      title: '100 Words',
      description: 'Built vocabulary of 100 words',
      unlocked: stats.totalWords >= 100,
      progress: Math.min((stats.totalWords / 100) * 100, 100),
      requirement: `${stats.totalWords}/100 words`,
      rarity: 'rare',
    },
    {
      id: 'words-500',
      icon: '📚📚',
      title: '500 Words',
      description: 'Impressive vocabulary collection',
      unlocked: stats.totalWords >= 500,
      progress: Math.min((stats.totalWords / 500) * 100, 100),
      requirement: `${stats.totalWords}/500 words`,
      rarity: 'epic',
    },
    {
      id: 'words-1000',
      icon: '🌟',
      title: '1000 Words',
      description: 'Legendary vocabulary master',
      unlocked: stats.totalWords >= 1000,
      progress: Math.min((stats.totalWords / 1000) * 100, 100),
      requirement: `${stats.totalWords}/1000 words`,
      rarity: 'legendary',
    },
    {
      id: 'mastery-10',
      icon: '✨',
      title: 'Master Scholar',
      description: 'Mastered 10 words',
      unlocked: stats.masteredWords >= 10,
      progress: Math.min((stats.masteredWords / 10) * 100, 100),
      requirement: `${stats.masteredWords}/10 mastered`,
      rarity: 'common',
    },
    {
      id: 'mastery-50',
      icon: '✨✨',
      title: 'Master Expert',
      description: 'Mastered 50 words',
      unlocked: stats.masteredWords >= 50,
      progress: Math.min((stats.masteredWords / 50) * 100, 100),
      requirement: `${stats.masteredWords}/50 mastered`,
      rarity: 'rare',
    },
    {
      id: 'reviews-100',
      icon: '🎴',
      title: '100 Reviews',
      description: 'Completed 100 reviews',
      unlocked: stats.totalReviews >= 100,
      progress: Math.min((stats.totalReviews / 100) * 100, 100),
      requirement: `${stats.totalReviews}/100 reviews`,
      rarity: 'common',
    },
    {
      id: 'reviews-1000',
      icon: '💎',
      title: '1000 Reviews',
      description: 'Dedication personified',
      unlocked: stats.totalReviews >= 1000,
      progress: Math.min((stats.totalReviews / 1000) * 100, 100),
      requirement: `${stats.totalReviews}/1000 reviews`,
      rarity: 'epic',
    },
    {
      id: 'study-time-10h',
      icon: '⏱️',
      title: '10 Hours',
      description: 'Spent 10 hours studying',
      unlocked: stats.totalStudyTime >= 36000000, // 10 hours in ms
      progress: Math.min((stats.totalStudyTime / 36000000) * 100, 100),
      requirement: `${Math.floor(stats.totalStudyTime / 3600000)}/10 hours`,
      rarity: 'rare',
    },
  ];
}

/**
 * Achievement Grid - displays multiple achievements
 */
interface AchievementGridProps {
  achievements: Achievement[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AchievementGrid({
  achievements,
  columns = 3,
  className = '',
}: AchievementGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  // Show unlocked first, then locked by progress
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (!a.unlocked && !b.unlocked) {
      return (b.progress || 0) - (a.progress || 0);
    }
    return 0;
  });

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {sortedAchievements.map((achievement) => (
        <AchievementBadge key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

/**
 * Achievement summary - shows quick stats
 */
interface AchievementSummaryProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementSummary({
  achievements,
  className = '',
}: AchievementSummaryProps) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const percentage = Math.round((unlocked / total) * 100);

  return (
    <div
      className={`
        bg-gradient-to-r from-purple-500 to-pink-600 
        rounded-2xl p-6 text-white shadow-xl
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-90 mb-1">Achievements</div>
          <div className="text-4xl font-bold">
            {unlocked}/{total}
          </div>
        </div>
        <div className="text-6xl">🏆</div>
      </div>
      <div className="mt-4">
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-sm opacity-90 mt-2">
          {percentage}% complete
        </div>
      </div>
    </div>
  );
}
