/**
 * Online Status Hook
 * Tracks network connectivity and triggers sync when back online
 */

'use client';

import { useState, useEffect } from 'react';
import { getSyncService } from '@/lib/services/sync';
import { getOfflineQueueService } from '@/lib/services/offline-queue';

/**
 * Hook to track online/offline status
 * Automatically triggers sync when coming back online
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      console.log('[OnlineStatus] Connection restored');
      setIsOnline(true);
      
      // Small delay to ensure network is stable
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process offline queue first
      try {
        const queueService = getOfflineQueueService();
        await queueService.processQueue();
      } catch (error) {
        console.error('[OnlineStatus] Error processing queue:', error);
      }
      
      // Then trigger sync
      try {
        const syncService = getSyncService();
        await syncService.sync('incremental');
      } catch (error) {
        console.error('[OnlineStatus] Error syncing:', error);
      }
    };

    const handleOffline = () => {
      console.log('[OnlineStatus] Connection lost');
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to track online status without auto-sync
 * Useful for components that need status but don't want to trigger sync
 */
export function useOnlineStatusOnly() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
