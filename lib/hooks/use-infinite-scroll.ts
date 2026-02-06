/**
 * useInfiniteScroll Hook
 * 
 * Simple hook to manage infinite scroll state for large lists.
 * 
 * Features:
 * - Initial page size (default: 50)
 * - Incremental loading (50 items per load)
 * - Reset on data changes
 * - Loading state management
 * 
 * @module lib/hooks/use-infinite-scroll
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  /** Total number of items available */
  totalItems: number;
  /** Number of items to show per page (default: 50) */
  pageSize?: number;
  /** Initial number of items to show (defaults to pageSize) */
  initialCount?: number;
}

interface UseInfiniteScrollReturn {
  /** Current number of items to display */
  displayCount: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading more items */
  isLoadingMore: boolean;
  /** Function to load more items */
  loadMore: () => void;
  /** Function to reset to initial count */
  reset: () => void;
}

/**
 * Hook to manage infinite scroll state
 */
export function useInfiniteScroll({
  totalItems,
  pageSize = 50,
  initialCount,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const initial = initialCount || pageSize;
  const [displayCount, setDisplayCount] = useState(initial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate if more items are available
  const hasMore = displayCount < totalItems;

  // Load more items
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Small delay for smooth UX (shows loading state briefly)
    setTimeout(() => {
      setDisplayCount(prev => {
        const next = prev + pageSize;
        return Math.min(next, totalItems);
      });
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, pageSize, totalItems]);

  // Reset to initial count
  const reset = useCallback(() => {
    setDisplayCount(initial);
    setIsLoadingMore(false);
  }, [initial]);

  // Reset when total items changes (e.g., after filter/search)
  useEffect(() => {
    if (displayCount > totalItems) {
      setDisplayCount(Math.min(initial, totalItems));
    }
  }, [totalItems, displayCount, initial]);

  return {
    displayCount,
    hasMore,
    isLoadingMore,
    loadMore,
    reset,
  };
}
