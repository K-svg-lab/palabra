/**
 * Activity Timeline Component
 * Apple Screen Time-style visualization of recent activity
 * 
 * Shows daily review activity as horizontal bars with gradients
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentStats } from '@/lib/db/stats';
import type { DailyStats } from '@/lib/types';

interface ActivityTimelineProps {
  days?: number;
  className?: string;
}

export function ActivityTimeline({ days = 7, className = '' }: ActivityTimelineProps) {
  const [recentActivity, setRecentActivity] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const stats = await getRecentStats(days);
        setRecentActivity(stats);
      } catch (error) {
        console.error('Failed to load activity:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [days]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="animate-pulse space-y-3">
          {[...Array(days)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const maxReviews = Math.max(...recentActivity.map((d) => d.cardsReviewed), 1);

  return (
    <div
      className={`
        bg-white dark:bg-gray-900 rounded-2xl p-6 
        border border-gray-200 dark:border-gray-800 shadow-sm
        ${className}
      `}
    >
      <h3 className="font-semibold mb-6">Last {days} Days</h3>

      <div className="space-y-3">
        {recentActivity.map((day, index) => {
          const percentage = (day.cardsReviewed / maxReviews) * 100;
          const isToday = index === 0;

          return (
            <div key={day.date} className="group">
              <div className="flex items-center gap-4">
                {/* Date label */}
                <div className="w-24 text-sm font-medium flex-shrink-0">
                  {isToday ? (
                    <span className="text-blue-600 dark:text-blue-400">Today</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDateLabel(day.date)}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative group-hover:shadow-md transition-shadow">
                  {day.cardsReviewed > 0 ? (
                    <>
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center px-4 transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 15)}%` }}
                      >
                        <span className="text-sm font-semibold text-white drop-shadow">
                          {day.cardsReviewed}
                        </span>
                      </div>
                      {/* Hover tooltip */}
                      <div className="absolute inset-0 flex items-center justify-end px-4 pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(day.accuracyRate * 100)}% accuracy
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center px-4 text-xs text-gray-400">
                      No activity
                    </div>
                  )}
                </div>

                {/* Accuracy badge */}
                {day.cardsReviewed > 0 && (
                  <div className="w-16 text-xs text-right text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {Math.round(day.accuracyRate * 100)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View more link */}
      <Link
        href="/dashboard/analytics"
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-6"
      >
        <span>View detailed analytics</span>
        <span>›</span>
      </Link>
    </div>
  );
}

/**
 * Format date label for timeline
 */
function formatDateLabel(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
  }
}

/**
 * Compact activity heatmap for inline use
 */
interface ActivityHeatmapProps {
  days?: number;
  size?: number;
  gap?: number;
  className?: string;
}

export function ActivityHeatmap({
  days = 30,
  size = 12,
  gap = 2,
  className = '',
}: ActivityHeatmapProps) {
  const [activity, setActivity] = useState<DailyStats[]>([]);

  useEffect(() => {
    async function loadActivity() {
      try {
        const stats = await getRecentStats(days);
        setActivity(stats);
      } catch (error) {
        console.error('Failed to load activity:', error);
      }
    }

    loadActivity();
  }, [days]);

  const maxReviews = Math.max(...activity.map((d) => d.cardsReviewed), 1);

  return (
    <div className={`flex flex-wrap ${className}`} style={{ gap: `${gap}px` }}>
      {activity.map((day, index) => {
        const intensity = day.cardsReviewed / maxReviews;
        const opacity = day.cardsReviewed > 0 ? Math.max(intensity, 0.2) : 0.1;

        return (
          <div
            key={day.date}
            className="rounded transition-all hover:scale-110"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor:
                day.cardsReviewed > 0
                  ? `rgba(59, 130, 246, ${opacity})`
                  : 'rgba(156, 163, 175, 0.2)',
            }}
            title={`${formatDateLabel(day.date)}: ${day.cardsReviewed} cards`}
          />
        );
      })}
    </div>
  );
}
