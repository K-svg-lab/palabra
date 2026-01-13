/**
 * Enhanced streak tracking component
 * Phase 11: Streak tracking with milestones and heatmap
 */

'use client';

import type { StreakData } from '@/lib/types';
import { ActivityHeatmap, MilestoneProgress, ProgressRing } from './charts';

/**
 * Enhanced streak tracker component
 */
interface StreakTrackerProps {
  streakData: StreakData;
  heatmapData: {
    date: string;
    value: number;
    cardsReviewed: number;
  }[];
}

export function StreakTracker({ streakData, heatmapData }: StreakTrackerProps) {
  const streakPercentage = streakData.longestStreak > 0
    ? Math.round((streakData.currentStreak / streakData.longestStreak) * 100)
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Current streak overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current streak card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm opacity-90">Current Streak</div>
              <div className="text-5xl font-bold mt-2">{streakData.currentStreak}</div>
              <div className="text-sm opacity-75 mt-1">
                {streakData.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
          
          {streakData.lastActiveDate && (
            <div className="text-sm opacity-90">
              Last active: {new Date(streakData.lastActiveDate).toLocaleDateString()}
            </div>
          )}
          
          {streakData.currentStreak > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-sm opacity-90 mb-2">Keep it going!</div>
              <div className="text-xs opacity-75">
                Review today to maintain your streak
              </div>
            </div>
          )}
        </div>
        
        {/* Longest streak & stats */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Personal Best</div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {streakData.longestStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">days</div>
              <div className="text-2xl">🏆</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div>
              <div className="text-2xl font-bold">{streakData.totalActiveDays}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total active days</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{streakData.freezesAvailable}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Streak freezes</div>
            </div>
          </div>
          
          {streakData.freezesAvailable > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <span>❄️</span>
                <div>
                  <div className="font-medium">Streak Freezes Available</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Miss a day without breaking your streak (earned every 7 days)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress towards longest streak */}
      {streakData.currentStreak < streakData.longestStreak && streakData.longestStreak > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Progress to Personal Best</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {streakData.longestStreak - streakData.currentStreak} more days to match your record
              </div>
            </div>
            <div className="text-2xl">{streakPercentage}%</div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${streakPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Milestone progress */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Streak Milestones</h3>
        <MilestoneProgress 
          milestones={streakData.streakMilestones}
          currentStreak={streakData.currentStreak}
        />
      </div>
      
      {/* Activity heatmap */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Activity Overview</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your learning activity over the past 6 months
          </p>
        </div>
        <ActivityHeatmap data={heatmapData} weeks={26} />
      </div>
      
      {/* Achievements showcase */}
      {streakData.streakMilestones.some(m => m.achieved) && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold mb-4">Unlocked Achievements</h3>
          <div className="flex flex-wrap gap-3">
            {streakData.streakMilestones
              .filter(m => m.achieved)
              .map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800"
                >
                  <span className="text-xl">{milestone.emoji}</span>
                  <span className="text-sm font-medium">{milestone.label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Motivation section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
        <div className="text-3xl mb-2">💪</div>
        <div className="text-lg font-semibold mb-1">
          {getMotivationMessage(streakData.currentStreak)}
        </div>
        <div className="text-sm opacity-90">
          {getMotivationSubtext(streakData.currentStreak)}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact streak widget for dashboard
 */
interface StreakWidgetProps {
  streakData: StreakData;
  compact?: boolean;
}

export function StreakWidget({ streakData, compact = false }: StreakWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
        <div className="text-3xl">🔥</div>
        <div>
          <div className="text-2xl font-bold">{streakData.currentStreak}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">day streak</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {streakData.currentStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
        <div className="text-4xl">🔥</div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Personal Best:</span>
          <span className="font-medium">{streakData.longestStreak} days</span>
        </div>
      </div>
    </div>
  );
}

// Helper functions

function getMotivationMessage(streak: number): string {
  if (streak === 0) return "Start Your Journey!";
  if (streak < 3) return "Great Start!";
  if (streak < 7) return "Building Momentum!";
  if (streak < 14) return "You're On Fire!";
  if (streak < 30) return "Unstoppable!";
  if (streak < 100) return "Legend in the Making!";
  return "Absolute Legend!";
}

function getMotivationSubtext(streak: number): string {
  if (streak === 0) return "Review today to start your streak";
  if (streak < 3) return "Keep going to build your habit";
  if (streak < 7) return "You're doing amazing!";
  if (streak < 14) return "Consistency is key to mastery";
  if (streak < 30) return "You're building a lasting habit";
  if (streak < 100) return "Your dedication is inspiring";
  return "You are a true master of consistency";
}

