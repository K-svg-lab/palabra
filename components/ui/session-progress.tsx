"use client";

import { motion } from "framer-motion";

/**
 * SessionProgress Component - Phase 16.4
 * 
 * Beautiful minimal progress indicator for review sessions.
 * 
 * Features:
 * - Thin gradient progress bar
 * - Dot indicators for each card
 * - Live stats (correct/wrong/accuracy)
 * - Smooth animations
 */

interface SessionProgressProps {
  /** Current card index (0-based) */
  currentIndex: number;
  /** Total number of cards */
  total: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of wrong answers */
  wrongCount: number;
  /** Optional className */
  className?: string;
}

export function SessionProgress({
  currentIndex,
  total,
  correctCount,
  wrongCount,
  className = "",
}: SessionProgressProps) {
  const progress = ((currentIndex + 1) / total) * 100;
  const accuracy = currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Card counter */}
        <div className="absolute -top-6 right-0 text-sm font-medium text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {total}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {Array.from({ length: total }).map((_, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`
                w-2 h-2 rounded-full
                transition-all duration-300
                ${isCurrent
                  ? "w-4 bg-blue-600"
                  : isCompleted
                  ? "bg-gray-400 dark:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-800"
                }
              `}
            />
          );
        })}
      </div>

      {/* Stats */}
      {currentIndex > 0 && (
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✓ {correctCount}</span>
            <span className="text-gray-400">Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">✗ {wrongCount}</span>
            <span className="text-gray-400">Wrong</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-medium">{accuracy}%</span>
            <span className="text-gray-400">Accuracy</span>
          </div>
        </div>
      )}
    </div>
  );
}
