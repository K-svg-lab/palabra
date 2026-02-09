/**
 * Data Preload Hook
 * Automatically pre-hydrates IndexedDB with vocabulary data after user login
 * 
 * Phase 18 UX Enhancement: Ensures offline functionality works immediately
 * even if user hasn't visited vocabulary page yet
 * 
 * @module lib/hooks/use-data-preload
 */

import { useEffect, useRef } from 'react';
import { getSyncService } from '@/lib/services/sync';

interface UseDataPreloadOptions {
  /**
   * Whether to enable automatic preloading
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Delay before starting preload (ms)
   * @default 1000 (1 second after login)
   */
  delay?: number;
}

/**
 * Hook to preload vocabulary data after user authentication
 * 
 * This ensures that vocabulary data is available in IndexedDB for offline use
 * immediately after login, without requiring the user to visit the vocabulary page first.
 * 
 * The hook:
 * 1. Waits for user authentication
 * 2. Checks if vocabulary data is already cached
 * 3. If not, triggers a background sync to pull data from cloud
 * 4. Only runs once per session (uses ref to track)
 * 
 * @param userId - User ID from authentication (null if not authenticated)
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * const { user } = useAuth();
 * useDataPreload(user?.id);
 * ```
 */
export function useDataPreload(
  userId: string | null | undefined,
  options: UseDataPreloadOptions = {}
): void {
  const {
    enabled = true,
    delay = 1000,
  } = options;
  
  // Track if we've already preloaded in this session
  const hasPreloadedRef = useRef(false);
  const preloadingRef = useRef(false);
  
  useEffect(() => {
    // Skip if disabled or no user
    if (!enabled || !userId) {
      return;
    }
    
    // Skip if already preloaded or currently preloading
    if (hasPreloadedRef.current || preloadingRef.current) {
      return;
    }
    
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }
    
    // Mark as preloading
    preloadingRef.current = true;
    
    /**
     * Preload vocabulary data in the background
     */
    async function preloadData() {
      try {
        // Wait a bit to let the UI settle after login
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check if we already have vocabulary data in IndexedDB
        const { getAllVocabularyWords } = await import('@/lib/db/vocabulary');
        const existingWords = await getAllVocabularyWords();
        
        // If we already have data, no need to preload
        if (existingWords.length > 0) {
          console.log('[Preload] Vocabulary already cached:', existingWords.length, 'words');
          hasPreloadedRef.current = true;
          preloadingRef.current = false;
          return;
        }
        
        // Trigger a background sync to pull data from cloud
        console.log('[Preload] Starting background vocabulary sync...');
        const syncService = getSyncService();
        const result = await syncService.sync('incremental');
        
        if (result.status === 'success') {
          console.log('[Preload] ✅ Vocabulary data preloaded successfully');
          console.log('[Preload] Downloaded:', result.downloaded, 'items');
          hasPreloadedRef.current = true;
        } else {
          console.warn('[Preload] ⚠️ Sync failed:', result.status);
          if (result.errorDetails && result.errorDetails.length > 0) {
            console.warn('[Preload] Error details:', result.errorDetails[0].error);
          }
          // Don't set hasPreloaded to true so it can retry on next mount
        }
      } catch (error) {
        console.error('[Preload] Error preloading vocabulary data:', error);
        // Don't set hasPreloaded to true so it can retry on next mount
      } finally {
        preloadingRef.current = false;
      }
    }
    
    // Start preloading
    preloadData();
  }, [userId, enabled, delay]);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      // Reset on unmount if user logs out
      if (!userId) {
        hasPreloadedRef.current = false;
      }
    };
  }, [userId]);
}

/**
 * Manually trigger data preload
 * Useful for testing or forcing a refresh
 * 
 * @returns Promise that resolves when preload is complete
 */
export async function preloadVocabularyData(): Promise<{
  success: boolean;
  wordsLoaded: number;
  error?: string;
}> {
  try {
    console.log('[Manual Preload] Starting...');
    
    // Check current data
    const { getAllVocabularyWords } = await import('@/lib/db/vocabulary');
    const beforeCount = (await getAllVocabularyWords()).length;
    
    // Trigger sync
    const syncService = getSyncService();
    const result = await syncService.sync('incremental');
    
    if (result.status !== 'success') {
      const errorMsg = result.errorDetails && result.errorDetails.length > 0 
        ? result.errorDetails[0].error 
        : `Sync failed with status: ${result.status}`;
      return {
        success: false,
        wordsLoaded: 0,
        error: errorMsg,
      };
    }
    
    // Check final count
    const afterCount = (await getAllVocabularyWords()).length;
    
    console.log('[Manual Preload] ✅ Complete:', afterCount, 'words loaded');
    
    return {
      success: true,
      wordsLoaded: afterCount,
    };
  } catch (error) {
    console.error('[Manual Preload] Error:', error);
    return {
      success: false,
      wordsLoaded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
