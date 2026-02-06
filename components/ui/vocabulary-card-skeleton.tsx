"use client";

/**
 * VocabularyCardSkeleton Component - Phase 16.4
 * 
 * Skeleton placeholder for VocabularyCardEnhanced during loading.
 * Matches the exact structure and dimensions of the real card.
 * 
 * Features:
 * - Animated shimmer effect
 * - Matches card layout (header, content, footer)
 * - Dark mode support
 * - Responsive sizing
 */

export function VocabularyCardSkeleton() {
  return (
    <div 
      className="
        w-full max-w-full min-w-0
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        rounded-xl
        p-4
        space-y-3
        overflow-hidden
      "
    >
      {/* Header Row: Audio Button + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        {/* Audio Button Skeleton */}
        <div className="
          w-8 h-8 rounded-lg 
          bg-gray-200 dark:bg-gray-800 
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
            }}
          />
        </div>

        {/* Status Badge Skeleton */}
        <div className="
          w-20 h-6 rounded-full
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.1s",
            }}
          />
        </div>
      </div>

      {/* Spanish Word Skeleton */}
      <div className="
        h-8 w-3/4 rounded
        bg-gray-200 dark:bg-gray-800
        animate-pulse
        relative overflow-hidden
      ">
        <div
          className="
            absolute inset-0
            -translate-x-full
            animate-shimmer
            bg-gradient-to-r
            from-transparent
            via-white/20
            to-transparent
          "
          style={{
            animationDuration: "2s",
            animationIterationCount: "infinite",
            animationDelay: "0.2s",
          }}
        />
      </div>

      {/* English Translation Skeleton */}
      <div className="
        h-6 w-2/3 rounded
        bg-gray-200 dark:bg-gray-800
        animate-pulse
        relative overflow-hidden
      ">
        <div
          className="
            absolute inset-0
            -translate-x-full
            animate-shimmer
            bg-gradient-to-r
            from-transparent
            via-white/20
            to-transparent
          "
          style={{
            animationDuration: "2s",
            animationIterationCount: "infinite",
            animationDelay: "0.3s",
          }}
        />
      </div>

      {/* Part of Speech Tags Skeleton */}
      <div className="flex gap-2">
        <div className="
          h-5 w-16 rounded-full
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.4s",
            }}
          />
        </div>
        <div className="
          h-5 w-20 rounded-full
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.5s",
            }}
          />
        </div>
      </div>

      {/* Example Sentence Skeleton */}
      <div className="space-y-1">
        <div className="
          h-4 w-full rounded
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.6s",
            }}
          />
        </div>
        <div className="
          h-4 w-5/6 rounded
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.7s",
            }}
          />
        </div>
      </div>

      {/* Footer: Action Buttons Skeleton */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <div className="
          w-8 h-8 rounded-lg
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.8s",
            }}
          />
        </div>
        <div className="
          w-8 h-8 rounded-lg
          bg-gray-200 dark:bg-gray-800
          animate-pulse
          relative overflow-hidden
        ">
          <div
            className="
              absolute inset-0
              -translate-x-full
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
            "
            style={{
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "0.9s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
