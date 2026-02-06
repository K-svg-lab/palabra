"use client";

/**
 * ScrollTrigger Component - Phase 16.4
 * 
 * Invisible trigger that detects when user scrolls near bottom
 * to load more content. Uses Intersection Observer API.
 * 
 * Features:
 * - Automatic load more detection
 * - Configurable threshold
 * - Loading state indicator
 * - Mobile-optimized
 * 
 * @module components/ui/scroll-trigger
 */

import { useEffect, useRef } from 'react';
import { VocabularyCardSkeleton } from './vocabulary-card-skeleton';

interface ScrollTriggerProps {
  /** Callback when trigger becomes visible */
  onLoadMore: () => void;
  /** Whether currently loading */
  isLoading?: boolean;
  /** Whether more items are available */
  hasMore?: boolean;
  /** Number of skeleton cards to show while loading (default: 3) */
  skeletonCount?: number;
  /** Intersection threshold (0-1, default: 0.5) */
  threshold?: number;
}

export function ScrollTrigger({
  onLoadMore,
  isLoading = false,
  hasMore = true,
  skeletonCount = 3,
  threshold = 0.5,
}: ScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  // Set up Intersection Observer
  useEffect(() => {
    const currentTrigger = triggerRef.current;
    if (!currentTrigger || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        // When trigger is visible and not already loading, load more
        if (entry.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px', // Start loading 100px before trigger is visible
      }
    );

    observer.observe(currentTrigger);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, isLoading, hasMore, threshold]);

  // Don't render if no more items
  if (!hasMore) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All words loaded
        </p>
      </div>
    );
  }

  return (
    <div ref={triggerRef} className="space-y-4 py-4">
      {/* Show skeleton cards while loading */}
      {isLoading && (
        <>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <VocabularyCardSkeleton key={`loading-skeleton-${index}`} />
          ))}
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              Loading more words...
            </p>
          </div>
        </>
      )}
    </div>
  );
}
