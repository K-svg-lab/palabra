/**
 * Pull-to-refresh hook
 * Implements pull-to-refresh gesture for mobile devices
 * Triggers data sync and cache refresh when user pulls down
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSyncService } from '@/lib/services/sync';

interface UsePullToRefreshOptions {
  enabled?: boolean;
  threshold?: number; // Pixels to pull before triggering refresh
  onRefresh?: () => Promise<void>;
}

/**
 * Hook to enable pull-to-refresh functionality
 * @param options - Configuration options
 */
export function usePullToRefresh(options: UsePullToRefreshOptions = {}) {
  const {
    enabled = true,
    threshold = 100,
    onRefresh,
  } = options;

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (window.scrollY === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const touchCurrentY = e.touches[0].clientY;
      const pullDistance = touchCurrentY - touchStartY.current;

      // Prevent default pull-to-refresh if pulling down
      if (pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) {
        isPulling.current = false;
        return;
      }

      const touchEndY = e.changedTouches[0].clientY;
      const pullDistance = touchEndY - touchStartY.current;

      isPulling.current = false;

      // Trigger refresh if pulled far enough
      if (pullDistance >= threshold && window.scrollY === 0) {
        console.log('🔄 Pull-to-refresh triggered');
        setIsRefreshing(true);

        try {
          // Execute custom refresh callback if provided
          if (onRefresh) {
            await onRefresh();
          }

          // 1. Trigger sync to get latest data from server
          const syncService = getSyncService();
          console.log('[Pull-to-refresh] Syncing data...');
          await syncService.sync('incremental');

          // 2. Invalidate all queries to refetch from updated IndexedDB
          console.log('[Pull-to-refresh] Invalidating query cache...');
          await queryClient.invalidateQueries();

          // 3. Clear service worker caches for fresh assets
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            console.log('[Pull-to-refresh] Clearing service worker caches...');
            navigator.serviceWorker.controller.postMessage({ type: 'FORCE_REFRESH' });
          }

          console.log('✅ Pull-to-refresh complete');
        } catch (error) {
          console.error('Pull-to-refresh failed:', error);
        } finally {
          // Add small delay for better UX
          setTimeout(() => {
            setIsRefreshing(false);
          }, 500);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, isRefreshing, onRefresh, queryClient]);

  return { isRefreshing };
}
