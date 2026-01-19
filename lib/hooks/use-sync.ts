/**
 * Hook for using sync functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { getSyncService } from '@/lib/services/sync';
import type { SyncState, SyncResult, SyncType } from '@/lib/types/sync';

/**
 * Hook for sync operations
 */
export function useSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    syncStatus: 'idle',
    pendingOperations: 0,
    errors: [],
    conflicts: [],
  });
  
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  
  /**
   * Update state from sync service
   */
  const updateState = useCallback(async () => {
    try {
      const syncService = getSyncService();
      const currentState = await syncService.getState();
      setState(currentState);
    } catch (error) {
      console.error('Failed to update sync state:', error);
    }
  }, []);
  
  /**
   * Perform sync
   */
  const sync = useCallback(async (type: SyncType = 'incremental') => {
    try {
      const syncService = getSyncService();
      const result = await syncService.sync(type);
      setLastResult(result);
      await updateState();
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, [updateState]);
  
  /**
   * Get pending operations
   */
  const getPendingOperations = useCallback(async () => {
    try {
      const syncService = getSyncService();
      return await syncService.getPendingOperations();
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }, []);
  
  /**
   * Clear pending operations
   */
  const clearPendingOperations = useCallback(async () => {
    try {
      const syncService = getSyncService();
      await syncService.clearPendingOperations();
      await updateState();
    } catch (error) {
      console.error('Failed to clear pending operations:', error);
    }
  }, [updateState]);
  
  // Update state on mount and periodically
  useEffect(() => {
    updateState();
    
    const interval = setInterval(updateState, 5000);
    
    return () => clearInterval(interval);
  }, [updateState]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      sync('incremental');
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync]);
  
  return {
    state,
    lastResult,
    sync,
    getPendingOperations,
    clearPendingOperations,
    updateState,
  };
}

