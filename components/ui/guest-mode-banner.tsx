/**
 * Guest Mode Banner Component (Feb 8, 2026)
 * 
 * Friendly notification for unauthenticated users encouraging signup
 * for cross-device sync and cloud backup.
 * 
 * Design: Apple-inspired, non-intrusive, dismissible
 * 
 * @module components/ui/guest-mode-banner
 */

"use client";

import { useState, useEffect } from "react";
import { Cloud, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface GuestModeBannerProps {
  /** Number of words added (triggers after threshold) */
  wordCount?: number;
  /** Minimum words before showing banner */
  threshold?: number;
}

/**
 * Guest Mode Banner - Shows value proposition for signing up
 * 
 * Features:
 * - Only shows after user has added words (seen value)
 * - Dismissible (saves to localStorage)
 * - Respects user's choice (doesn't nag)
 * - Clear benefits listed
 * - Apple-inspired minimal design
 */
export function GuestModeBanner({ 
  wordCount = 0, 
  threshold = 5 
}: GuestModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Check if banner should be shown
  useEffect(() => {
    const dismissed = localStorage.getItem('palabra_guest_banner_dismissed');
    const hasSeenEnoughValue = wordCount >= threshold;
    
    if (!dismissed && hasSeenEnoughValue) {
      setIsDismissed(false);
      // Slight delay for smooth entrance
      setTimeout(() => setIsVisible(true), 300);
    }
  }, [wordCount, threshold]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      localStorage.setItem('palabra_guest_banner_dismissed', 'true');
    }, 300);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
    >
      <div
        className="
          bg-gradient-to-r from-blue-50 to-purple-50
          dark:from-blue-950/30 dark:to-purple-950/30
          rounded-2xl p-6
          shadow-lg hover:shadow-xl
          transition-shadow duration-300
          relative
          overflow-hidden
        "
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
        
        <div className="relative flex items-start gap-4">
          {/* Icon - Phase 17 style: larger, more prominent */}
          <div
            className="
              flex-shrink-0
              w-16 h-16
              rounded-2xl
              bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center
              shadow-lg shadow-blue-500/30
            "
          >
            <Cloud className="w-8 h-8 text-white drop-shadow-md" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                Save Your Progress Everywhere
              </h3>
              
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="
                  flex-shrink-0
                  p-1.5
                  rounded-lg
                  hover:bg-gray-900/5 dark:hover:bg-white/5
                  active:bg-gray-900/10 dark:active:bg-white/10
                  transition-colors
                "
                aria-label="Dismiss"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed opacity-90">
              You've added <strong className="font-semibold text-gray-900 dark:text-white">{wordCount} words</strong> locally. Sign up to sync across all your devices and never lose your progress!
            </p>

            {/* Benefits list - Phase 17 style: cleaner spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="font-medium">Cloud backup</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="font-medium">Multi-device sync</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                <span className="font-medium">Progress tracking</span>
              </div>
            </div>

            {/* CTA buttons - Phase 17 style: better hover states */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="
                  flex-1 sm:flex-none
                  px-6 py-3
                  bg-gradient-to-r from-blue-600 to-purple-600
                  hover:from-blue-700 hover:to-purple-700
                  hover:scale-[1.02] active:scale-[0.98]
                  text-white
                  rounded-xl
                  font-semibold text-sm
                  shadow-lg shadow-blue-500/30
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  min-h-[44px]
                "
              >
                Sign Up Free
                <ChevronRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/signin"
                className="
                  flex-1 sm:flex-none
                  px-6 py-3
                  bg-white dark:bg-gray-800
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  text-gray-700 dark:text-gray-300
                  rounded-xl
                  font-medium text-sm
                  transition-all duration-200
                  flex items-center justify-center
                  min-h-[44px]
                  shadow-sm
                "
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for header/nav areas
 */
export function GuestModeBadge() {
  return (
    <Link
      href="/signup"
      className="
        inline-flex items-center gap-2
        px-3 py-1.5
        bg-gradient-to-r from-blue-600 to-purple-600
        hover:from-blue-700 hover:to-purple-700
        text-white text-xs font-semibold
        rounded-full
        shadow-lg shadow-blue-500/30
        transition-all
        hover:scale-105
      "
    >
      <Cloud className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Sign up to sync</span>
      <span className="sm:hidden">Sign up</span>
    </Link>
  );
}
