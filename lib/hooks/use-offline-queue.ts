/**
 * Offline Queue Hook
 * Provides access to offline queue status
 */

'use client';

import { useState, useEffect } from 'react';
import { getOfflineQueueService } from '@/lib/services/offline-queue';
import type { OfflineQueueStatus, OfflineQueueItem } from '@/lib/types/offline';

/**
 * Hook to get the count of pending items in offline queue
 */
export function useOfflineQueueCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCount = async () => {
      try {
        const queueService = getOfflineQueueService();
        const status = await queueService.getQueueStatus();
        setCount(status.pending + status.syncing);
      } catch (error) {
        console.error('[OfflineQueue] Error getting queue count:', error);
      }
    };

    // Initial update
    updateCount();

    // Poll every 5 seconds
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  return count;
}

/**
 * Hook to get full queue status
 */
export function useOfflineQueueStatus() {
  const [status, setStatus] = useState<OfflineQueueStatus>({
    total: 0,
    pending: 0,
    syncing: 0,
    failed: 0,
    completed: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = async () => {
      try {
        const queueService = getOfflineQueueService();
        const queueStatus = await queueService.getQueueStatus();
        setStatus(queueStatus);
      } catch (error) {
        console.error('[OfflineQueue] Error getting queue status:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * Hook to get all queue items
 */
export function useOfflineQueueItems() {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateItems = async () => {
      try {
        setLoading(true);
        const queueService = getOfflineQueueService();
        const allItems = await queueService.getAllItems();
        setItems(allItems);
      } catch (error) {
        console.error('[OfflineQueue] Error getting queue items:', error);
      } finally {
        setLoading(false);
      }
    };

    updateItems();
    const interval = setInterval(updateItems, 5000);

    return () => clearInterval(interval);
  }, []);

  return { items, loading };
}

/**
 * Hook to get failed queue items
 */
export function useFailedQueueItems() {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateItems = async () => {
      try {
        setLoading(true);
        const queueService = getOfflineQueueService();
        const failedItems = await queueService.getFailedItems();
        setItems(failedItems);
      } catch (error) {
        console.error('[OfflineQueue] Error getting failed items:', error);
      } finally {
        setLoading(false);
      }
    };

    updateItems();
    const interval = setInterval(updateItems, 10000);

    return () => clearInterval(interval);
  }, []);

  return { items, loading };
}
