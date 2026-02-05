"use client";

import { motion } from "framer-motion";

/**
 * AnswerFeedback Component - Phase 16.4
 * 
 * Immediate feedback for recall/listening modes showing answer correctness.
 * 
 * Features:
 * - Slide up animation
 * - Color-coded backgrounds (green/orange/red)
 * - Clear comparison of user answer vs correct
 * - Large continue button
 * - Haptic-style visual feedback
 */

interface AnswerFeedbackProps {
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** User's answer */
  userAnswer: string;
  /** Correct answer */
  correctAnswer: string;
  /** Similarity percentage (0-100) */
  similarity: number;
  /** Callback to continue */
  onContinue: () => void;
}

export function AnswerFeedback({
  isCorrect,
  userAnswer,
  correctAnswer,
  similarity,
  onContinue,
}: AnswerFeedbackProps) {
  // Determine feedback type based on correctness and similarity
  const getFeedbackType = () => {
    if (isCorrect && similarity >= 95) return "perfect";
    if (isCorrect) return "correct";
    if (similarity >= 70) return "partial";
    return "incorrect";
  };

  const feedbackType = getFeedbackType();

  const config = {
    perfect: {
      bg: "from-green-500 to-green-600",
      icon: "✨",
      title: "Perfect!",
      subtitle: "100% match",
    },
    correct: {
      bg: "from-green-500 to-green-600",
      icon: "✅",
      title: "Correct!",
      subtitle: `${similarity}% match`,
    },
    partial: {
      bg: "from-orange-500 to-orange-600",
      icon: "⚠️",
      title: "Almost!",
      subtitle: `${similarity}% match`,
    },
    incorrect: {
      bg: "from-red-500 to-red-600",
      icon: "❌",
      title: "Not quite",
      subtitle: "Try again next time",
    },
  };

  const currentConfig = config[feedbackType];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50"
    >
      <div
        className={`
          bg-gradient-to-r ${currentConfig.bg}
          text-white
          px-6 py-8
          shadow-2xl
          rounded-t-3xl
        `}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-6xl mb-2">{currentConfig.icon}</div>
            <h2 className="text-3xl font-bold mb-1">{currentConfig.title}</h2>
            <p className="text-white/80 text-sm">{currentConfig.subtitle}</p>
          </div>

          {/* Answer comparison */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div>
              <div className="text-sm text-white/60 mb-1">Your answer</div>
              <div className="text-xl font-semibold">{userAnswer}</div>
            </div>

            {!isCorrect && (
              <div>
                <div className="text-sm text-white/60 mb-1">
                  Correct answer
                </div>
                <div className="text-xl font-semibold">{correctAnswer}</div>
              </div>
            )}
          </div>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="
              w-full
              px-6 py-4
              bg-white
              text-gray-900
              text-lg font-bold
              rounded-xl
              hover:bg-gray-100
              active:scale-[0.98]
              transition-all
              shadow-lg
            "
          >
            Continue →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
