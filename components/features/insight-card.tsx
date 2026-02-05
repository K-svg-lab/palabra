/**
 * Insight Card Component
 * Apple Health-style insight cards with gradients and personality
 * 
 * Displays contextual learning insights and motivational messages
 */

'use client';

import React from 'react';
import type { Insight } from '@/lib/utils/insights';

interface InsightCardProps {
  insight: Insight;
  className?: string;
}

export function InsightCard({ insight, className = '' }: InsightCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-5
        text-white shadow-lg
        transform hover:scale-[1.02] transition-all duration-300
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${insight.gradient.from}, ${insight.gradient.to})`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="text-4xl mb-3 drop-shadow-md">{insight.icon}</div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 leading-tight">
          {insight.title}
        </h3>

        {/* Description */}
        <p className="text-sm opacity-90 leading-relaxed">
          {insight.description}
        </p>

        {/* Type badge (optional, for debugging) */}
        {/* <div className="mt-3 text-xs opacity-70 uppercase tracking-wide">
          {insight.type}
        </div> */}
      </div>
    </div>
  );
}

/**
 * Insights grid - displays multiple insights
 */
interface InsightsGridProps {
  insights: Insight[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export function InsightsGrid({
  insights,
  columns = 1,
  className = '',
}: InsightsGridProps) {
  if (insights.length === 0) return null;

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

/**
 * Compact insight pill for inline display
 */
interface InsightPillProps {
  icon: string;
  text: string;
  color?: string;
  className?: string;
}

export function InsightPill({
  icon,
  text,
  color = 'blue',
  className = '',
}: InsightPillProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        text-sm font-medium
        ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
        ${className}
      `}
    >
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
