/**
 * Learning Journey Card Component
 * Apple-inspired visualization of vocabulary progress
 * Shows New → Learning → Mastered progression with beautiful visuals
 */

'use client';

import React, { useEffect, useState } from 'react';

interface LearningJourneyCardProps {
  newWords: number;
  learningWords: number;
  masteredWords: number;
  totalWords: number;
  accuracy: number;
  className?: string;
}

export function LearningJourneyCard({
  newWords,
  learningWords,
  masteredWords,
  totalWords,
  accuracy,
  className = '',
}: LearningJourneyCardProps) {
  const [animatedPercentages, setAnimatedPercentages] = useState({
    new: 0,
    learning: 0,
    mastered: 0,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentages({
        new: totalWords > 0 ? (newWords / totalWords) * 100 : 0,
        learning: totalWords > 0 ? (learningWords / totalWords) * 100 : 0,
        mastered: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0,
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [newWords, learningWords, masteredWords, totalWords]);

  return (
    <div
      className={`
        bg-gradient-to-br from-blue-50 to-purple-50 
        dark:from-gray-900 dark:to-gray-800 
        rounded-3xl p-8 
        border border-gray-200 dark:border-gray-700 
        shadow-xl
        ${className}
      `}
    >
      {/* Header */}
      <h2 className="text-2xl font-bold mb-6">Your Learning Journey</h2>

      {/* Status blocks */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatusBlock
          icon="🆕"
          count={newWords}
          label="New"
          color="blue"
          percentage={Math.round(animatedPercentages.new)}
        />
        <StatusBlock
          icon="📚"
          count={learningWords}
          label="Learning"
          color="purple"
          percentage={Math.round(animatedPercentages.learning)}
        />
        <StatusBlock
          icon="✅"
          count={masteredWords}
          label="Mastered"
          color="green"
          percentage={Math.round(animatedPercentages.mastered)}
        />
      </div>

      {/* Visual progress bar */}
      <div className="mb-4">
        <div className="flex h-4 rounded-full overflow-hidden shadow-inner bg-gray-200 dark:bg-gray-800">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
            style={{ width: `${animatedPercentages.new}%` }}
          />
          <div
            className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out"
            style={{ width: `${animatedPercentages.learning}%` }}
          />
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
            style={{ width: `${animatedPercentages.mastered}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">
          {totalWords} total words
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {accuracy}% overall accuracy
        </span>
      </div>

      {/* Progress indicators */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Starting out</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Practicing</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Mastered</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Status block component for each learning stage
 */
interface StatusBlockProps {
  icon: string;
  count: number;
  label: string;
  color: 'blue' | 'purple' | 'green';
  percentage: number;
}

function StatusBlock({ icon, count, label, color, percentage }: StatusBlockProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  };

  return (
    <div
      className={`
        ${colorClasses[color]}
        rounded-xl p-4 text-center
        transform hover:scale-105 transition-all duration-300
      `}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{count}</div>
      <div className="text-xs font-medium opacity-80 mb-2">{label}</div>
      <div className="text-xs opacity-70">{percentage}%</div>
    </div>
  );
}

/**
 * Compact learning progress bar for inline use
 */
interface LearningProgressBarProps {
  newWords: number;
  learningWords: number;
  masteredWords: number;
  totalWords: number;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function LearningProgressBar({
  newWords,
  learningWords,
  masteredWords,
  totalWords,
  height = 8,
  showLabels = false,
  className = '',
}: LearningProgressBarProps) {
  const newPercentage = totalWords > 0 ? (newWords / totalWords) * 100 : 0;
  const learningPercentage = totalWords > 0 ? (learningWords / totalWords) * 100 : 0;
  const masteredPercentage = totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;

  return (
    <div className={className}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>{newWords} new</span>
          <span>{learningWords} learning</span>
          <span>{masteredWords} mastered</span>
        </div>
      )}
      <div
        className="flex rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800"
        style={{ height: `${height}px` }}
      >
        <div
          className="bg-blue-500 transition-all duration-1000"
          style={{ width: `${newPercentage}%` }}
        />
        <div
          className="bg-purple-500 transition-all duration-1000"
          style={{ width: `${learningPercentage}%` }}
        />
        <div
          className="bg-green-500 transition-all duration-1000"
          style={{ width: `${masteredPercentage}%` }}
        />
      </div>
    </div>
  );
}
