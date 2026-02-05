"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ActivityRing } from "./activity-ring";
import { StatCardEnhanced } from "@/components/ui/stat-card-enhanced";
import type { ExtendedReviewResult } from "@/lib/types/review";

/**
 * ReviewSummaryEnhanced Component - Phase 16.4
 * 
 * Celebration screen after completing a review session.
 * 
 * Features:
 * - Celebration animation
 * - Activity ring showing completion
 * - Performance breakdown
 * - Personalized insights
 * - Action buttons
 */

interface ReviewSummaryEnhancedProps {
  /** Review results */
  results: ExtendedReviewResult[];
  /** Time spent in milliseconds */
  timeSpent: number;
  /** Current streak */
  currentStreak: number;
  /** Callback to continue */
  onContinue: () => void;
  /** Callback to review mistakes */
  onReviewMistakes?: () => void;
}

export function ReviewSummaryEnhanced({
  results,
  timeSpent,
  currentStreak,
  onContinue,
  onReviewMistakes,
}: ReviewSummaryEnhancedProps) {
  const correctCount = results.filter((r) => r.rating !== "forgot").length;
  const accuracy = Math.round((correctCount / results.length) * 100);

  // Calculate rating breakdown
  const ratingCounts = {
    easy: results.filter((r) => r.rating === "easy").length,
    good: results.filter((r) => r.rating === "good").length,
    hard: results.filter((r) => r.rating === "hard").length,
    forgot: results.filter((r) => r.rating === "forgot").length,
  };

  // Format time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Get celebration emoji based on accuracy
  const getCelebrationEmoji = () => {
    if (accuracy >= 90) return "🎉";
    if (accuracy >= 75) return "✨";
    if (accuracy >= 50) return "👍";
    return "📚";
  };

  // Get encouragement message
  const getMessage = () => {
    if (accuracy >= 90) return "Amazing!";
    if (accuracy >= 75) return "Great Job!";
    if (accuracy >= 50) return "Good Work!";
    return "Keep Going!";
  };

  // Show celebration animation
  useEffect(() => {
    if (accuracy >= 90) {
      // Trigger confetti or celebration (optional)
      console.log("🎉 Perfect score!");
    }
  }, [accuracy]);

  const hasMistakes = ratingCounts.forgot > 0 || ratingCounts.hard > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Celebration icon */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-8xl mb-4"
          >
            {getCelebrationEmoji()}
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {getMessage()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You completed {results.length} cards
          </p>
        </div>

        {/* Activity Ring */}
        <div className="flex justify-center">
          <ActivityRing
            current={correctCount}
            target={results.length}
            label="Accuracy"
            gradient={{ start: "#10B981", end: "#34D399" }}
            size="lg"
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCardEnhanced
            icon="⏱️"
            value={formatTime(timeSpent)}
            label="Study Time"
            gradient={{ from: "#3B82F6", to: "#60A5FA" }}
          />
          <StatCardEnhanced
            icon="🔥"
            value={`${currentStreak}`}
            label="Day Streak"
            gradient={{ from: "#F59E0B", to: "#FBBF24" }}
          />
        </div>

        {/* Performance breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
            📊 Performance
          </h3>
          <div className="space-y-3">
            {[
              {
                emoji: "✨",
                label: "Easy",
                count: ratingCounts.easy,
                color: "text-blue-600",
              },
              {
                emoji: "👍",
                label: "Good",
                count: ratingCounts.good,
                color: "text-green-600",
              },
              {
                emoji: "😓",
                label: "Hard",
                count: ratingCounts.hard,
                color: "text-orange-600",
              },
              {
                emoji: "❌",
                label: "Forgot",
                count: ratingCounts.forgot,
                color: "text-red-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.emoji}</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {stat.label}
                  </span>
                </div>
                <span className={`font-bold text-lg ${stat.color}`}>
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        {accuracy >= 80 && (
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <h4 className="font-semibold text-lg mb-1">
                  You're improving!
                </h4>
                <p className="text-white/90 text-sm">
                  Keep up the great work. Consistent practice is key to mastery.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="
              w-full
              px-6 py-4
              bg-gradient-to-r from-blue-600 to-purple-600
              text-white text-lg font-semibold
              rounded-xl
              hover:opacity-90
              active:scale-[0.98]
              transition-all
              shadow-lg
            "
          >
            🏠 Continue Learning
          </button>

          {hasMistakes && onReviewMistakes && (
            <button
              onClick={onReviewMistakes}
              className="
                w-full
                px-6 py-4
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-white
                text-lg font-semibold
                rounded-xl
                border-2 border-gray-200 dark:border-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-800
                active:scale-[0.98]
                transition-all
              "
            >
              🔄 Review Mistakes
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
