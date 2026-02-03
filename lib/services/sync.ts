/**
 * Cloud synchronization service
 * Handles bidirectional sync between local IndexedDB and remote server
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { QueryClient } from '@tanstack/react-query';
import type {
  SyncService,
  SyncState,
  SyncResult,
  SyncType,
  SyncOperation,
  SyncConflict,
  ConflictResolution,
  DeviceInfo,
  SyncConfig,
  SyncQueueItem,
  SyncStatus,
} from '@/lib/types/sync';
import { getAllVocabularyWords, updateVocabularyWord } from '@/lib/db/vocabulary';
import { getAllReviews, updateReviewRecord, createReviewRecord } from '@/lib/db/reviews';
import { getAllStats, saveStats } from '@/lib/db/stats';
import { generateUUID } from '@/lib/utils/uuid';

const SYNC_DB_NAME = 'palabra-sync';
const SYNC_DB_VERSION = 1;

/**
 * Sync database stores
 */
interface SyncDB {
  queue: {
    key: string;
    value: SyncQueueItem;
  };
  state: {
    key: string;
    value: any;
  };
}

/**
 * Cloud sync service implementation
 */
export class CloudSyncService implements SyncService {
  private db: IDBPDatabase<SyncDB> | null = null;
  private deviceId: string;
  private queryClient: QueryClient | null = null;
  private config: SyncConfig = {
    enabled: true,
    autoSync: true,
    syncInterval: 5, // minutes
    conflictResolution: 'newest',
    syncOnStartup: true,
    syncOnNetworkChange: true,
    retryAttempts: 3,
    retryDelay: 5000,
  };
  
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initialize();
  }
  
  /**
   * Set the QueryClient instance for cache invalidation
   * This must be called from the app initialization to enable
   * automatic UI updates after sync
   */
  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
    console.log('[Sync] QueryClient registered for cache invalidation');
  }
  
  /**
   * Initialize sync database
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    this.db = await openDB<SyncDB>(SYNC_DB_NAME, SYNC_DB_VERSION, {
      upgrade(db) {
        // Queue store
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' });
        }
        
        // State store
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state');
        }
      },
    });
    
    // Load config
    const savedConfig = await this.db.get('state', 'config');
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
    
    // Setup auto-sync
    if (this.config.autoSync) {
      this.setupAutoSync();
    }
    
    // Sync on startup (only if authenticated)
    if (this.config.syncOnStartup) {
      setTimeout(async () => {
        const isAuth = await this.checkAuth();
        if (isAuth) {
          this.sync('incremental');
        }
      }, 2000);
    }
    
    // Setup network change listener
    if (this.config.syncOnNetworkChange) {
      window.addEventListener('online', () => {
        console.log('[Sync] Back online, syncing...');
        this.sync('incremental');
      });
    }
  }
  
  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('palabra-device-id');
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem('palabra-device-id', deviceId);
    }
    return deviceId;
  }
  
  /**
   * Setup automatic sync interval
   */
  private setupAutoSync(): void {
    if (typeof window === 'undefined') return;
    
    const intervalMs = this.config.syncInterval * 60 * 1000;
    setInterval(() => {
      if (navigator.onLine) {
        this.sync('incremental').catch(console.error);
      }
    }, intervalMs);
  }
  
  /**
   * Perform synchronization
   */
  async sync(type: SyncType = 'incremental'): Promise<SyncResult> {
    const startTime = new Date();
    let status: SyncStatus = 'idle';
    
    try {
      console.log(`🔄 Starting ${type} sync...`);
      
      // Check if online
      if (!navigator.onLine) {
        console.log('⏸️ Offline - sync skipped');
        return {
          status: 'skipped',
          syncType: type,
          direction: 'bidirectional',
          startTime,
          endTime: new Date(),
          duration: 0,
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          errors: 0,
          deviceId: this.deviceId,
          deviceName: this.getDeviceName(),
        };
      }
      
      // Check authentication
      const session = await this.checkAuth();
      if (!session) {
        console.log('⏸️ Not authenticated - sync skipped');
        return {
          status: 'skipped',
          syncType: type,
          direction: 'bidirectional',
          startTime,
          endTime: new Date(),
          duration: 0,
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          errors: 0,
          deviceId: this.deviceId,
          deviceName: this.getDeviceName(),
        };
      }
      
      console.log('✅ Authenticated, proceeding with sync');
      
      // Process offline queue first
      try {
        const { getOfflineQueueService } = await import('@/lib/services/offline-queue');
        const queueService = getOfflineQueueService();
        // #region agent log
        const queueStatus = await queueService.getQueueStatus();
        console.log('[DEBUG-H4] Pre-queue processing status', { queueStatus, isOnline: navigator.onLine });
        // #endregion
        await queueService.processQueue();
        // #region agent log
        const queueStatusAfter = await queueService.getQueueStatus();
        console.log('[DEBUG-H4] Post-queue processing status', { queueStatusBefore: queueStatus, queueStatusAfter });
        // #endregion
      } catch (error) {
        console.error('[Sync] Error processing offline queue:', error);
        // Continue with sync even if queue processing fails
      }
      
      // Update state
      await this.updateState({ isSyncing: true, syncStatus: 'syncing' });
      status = 'syncing';
      
      // Check if client has any local data (vocabulary AND reviews)
      // MUST check BEFORE any downloads to detect fresh client state
      const localVocabCount = (await getAllVocabularyWords()).length;
      const localReviewCount = (await getAllReviews()).length;
      const storedLastSyncTime = await this.getLastSyncTime();
      
      console.log(`🔍 Pre-sync state check: vocab=${localVocabCount}, reviews=${localReviewCount}, storedLastSyncTime=${storedLastSyncTime?.toISOString() || 'null'}`);
      
      // Force full sync if client has no data (fresh login after clearing browser data)
      const shouldForceFullSync = localVocabCount === 0 || localReviewCount === 0;
      
      // Get last sync time (null for full sync to download everything)
      let lastSyncTime: Date | null = null;
      if (type === 'full' || shouldForceFullSync) {
        lastSyncTime = null;
        console.log(`📅 Performing FULL sync (${shouldForceFullSync ? `no local data detected (vocab:${localVocabCount}, reviews:${localReviewCount})` : 'requested'})`);
      } else {
        lastSyncTime = storedLastSyncTime;
        console.log(`📅 Performing INCREMENTAL sync (last sync: ${lastSyncTime?.toISOString() || 'never'})`);
      }
      
      // Collect local changes
      const operations = await this.collectLocalChanges(lastSyncTime);
      console.log(`📤 Uploading: ${operations.vocabulary.length} vocab, ${operations.reviews.length} reviews, ${operations.stats.length} stats`);
      // #region agent log
      const statsSnapshot = await getAllStats();
      const todayStats = statsSnapshot.find(s => s.date === new Date().toISOString().split('T')[0]);
      console.log('[DEBUG-H2/H3] Collecting local changes', {
        vocabCount: operations.vocabulary.length,
        reviewsCount: operations.reviews.length,
        statsCount: operations.stats.length,
        todayStats: todayStats ? {
          date: todayStats.date,
          cardsReviewed: todayStats.cardsReviewed,
          accuracyRate: todayStats.accuracyRate,
          updatedAt: todayStats.updatedAt
        } : null,
        lastSyncTime: lastSyncTime?.toISOString()
      });
      // #endregion      
      // Sync vocabulary
      const vocabResult = await this.syncVocabulary(operations.vocabulary, lastSyncTime);
      
      // Apply remote vocabulary changes to local database
      if (vocabResult.operations && vocabResult.operations.length > 0) {
        console.log(`📥 Applying ${vocabResult.operations.length} remote vocabulary items...`);
        for (const operation of vocabResult.operations) {
          try {
            // Check if local version is newer before overwriting
            const { getVocabularyWord } = await import('@/lib/db/vocabulary');
            const localWord = await getVocabularyWord(operation.data.id);
            
            if (localWord) {
              // Compare timestamps - only overwrite if server version is newer
              if (operation.data.updatedAt > localWord.updatedAt) {
                await updateVocabularyWord(operation.data);
                const isDeleted = operation.data.isDeleted ? ' (DELETED)' : '';
                console.log(`✅ Applied newer remote version: ${operation.data.spanish || operation.data.spanishWord}${isDeleted}`);
              } else {
                console.log(`⏭️  Skipped ${operation.data.spanish || operation.data.spanishWord} - local version is newer`);
              }
            } else {
              // Word doesn't exist locally, create it (or apply deletion)
              await updateVocabularyWord(operation.data);
              const action = operation.data.isDeleted ? 'Applied deletion for' : 'Created from remote';
              console.log(`✅ ${action}: ${operation.data.spanish || operation.data.spanishWord}`);
            }
          } catch (error) {
            console.error('Failed to apply remote vocabulary:', error);
          }
        }
      } else {
        console.log('📥 No remote vocabulary changes to apply');
      }
      
      // Sync reviews
      const reviewsResult = await this.syncReviews(operations.reviews, lastSyncTime);
      console.log(`📥 Downloaded ${reviewsResult.reviews?.length || 0} reviews`);
      
      // Apply remote review changes to local database
      if (reviewsResult.reviews && reviewsResult.reviews.length > 0) {
        console.log(`📥 Applying ${reviewsResult.reviews.length} remote review records...`);
        for (const review of reviewsResult.reviews) {
          try {
            await updateReviewRecord(review);
            console.log(`✅ Applied review for vocab: ${review.vocabId}`);            
            // Update vocabulary item status based on review progress
            try {
              const { getVocabularyWord, updateVocabularyWord } = await import('@/lib/db/vocabulary');
              const { determineVocabularyStatus } = await import('@/lib/utils/spaced-repetition');
              const vocabularyWord = await getVocabularyWord(review.vocabId);
              if (vocabularyWord) {
                const newStatus = determineVocabularyStatus(review);
                if (vocabularyWord.status !== newStatus) {
                  await updateVocabularyWord({
                    ...vocabularyWord,
                    status: newStatus,
                    updatedAt: Date.now(),
                  });
                  console.log(`✅ Updated vocab "${vocabularyWord.spanishWord}" status from sync: ${vocabularyWord.status} → ${newStatus}`);
                }
              }
            } catch (statusError) {
              console.error('Failed to update vocabulary status from remote review:', statusError);
            }
          } catch (error) {
            // If update fails, try creating it
            try {
              await createReviewRecord(review);
              console.log(`✅ Created review for vocab: ${review.vocabId}`);              
              // Update vocabulary item status based on review progress
              try {
                const { getVocabularyWord, updateVocabularyWord } = await import('@/lib/db/vocabulary');
                const { determineVocabularyStatus } = await import('@/lib/utils/spaced-repetition');
                const vocabularyWord = await getVocabularyWord(review.vocabId);
                if (vocabularyWord) {
                  const newStatus = determineVocabularyStatus(review);
                  if (vocabularyWord.status !== newStatus) {
                    await updateVocabularyWord({
                      ...vocabularyWord,
                      status: newStatus,
                      updatedAt: Date.now(),
                    });
                    console.log(`✅ Updated vocab "${vocabularyWord.spanishWord}" status from sync: ${vocabularyWord.status} → ${newStatus}`);
                  }
                }
              } catch (statusError) {
                console.error('Failed to update vocabulary status from remote review:', statusError);
              }
            } catch (createError) {
              console.error('Failed to apply remote review:', createError);
            }
          }
        }
      } else {
        console.log('📥 No remote review changes to apply');
      }
      
      // Sync stats
      const statsResult = await this.syncStats(operations.stats, lastSyncTime);
      console.log(`📥 Downloaded ${statsResult.stats?.length || 0} stats`);
      // #region agent log
      console.log('[DEBUG-H2/H3] Stats sync result', {
        uploadedStatsCount: operations.stats.length,
        downloadedStatsCount: statsResult.stats?.length || 0,
        downloadedStats: statsResult.stats?.map((s: any) => ({
          date: s.date,
          cardsReviewed: s.cardsReviewed,
          accuracyRate: s.accuracyRate,
          updatedAt: s.updatedAt
        }))
      });
      // #endregion
      
      // Apply remote stats changes to local database
      if (statsResult.stats && statsResult.stats.length > 0) {
        console.log(`📥 Applying ${statsResult.stats.length} remote stats records...`);
        for (const stat of statsResult.stats) {
          try {
            // CRITICAL: Preserve updatedAt timestamp from server to maintain sync tracking
            await saveStats(stat, true);
            console.log(`✅ Applied stats for date: ${stat.date} (updatedAt: ${stat.updatedAt})`)
          } catch (error) {
            console.error('Failed to apply remote stats:', error);
          }
        }
      } else {
        console.log('📥 No remote stats changes to apply');
      }

      
      // Clean up successfully synced deleted items
      // Remove items marked as deleted from local IndexedDB after successful sync
      // Re-query to get items in scope (vocabItems is from collectLocalChanges)
      const allItems = await getAllVocabularyWords(true);
      const deletedItems = allItems.filter(v => v.isDeleted);
      
      if (deletedItems.length > 0) {
        console.log(`🗑️ Cleaning up ${deletedItems.length} synced deleted items from local storage...`);
        const { getDB } = await import('@/lib/db/schema');
        const db = await getDB();
        for (const item of deletedItems) {
          try {
            await db.delete('vocabulary', item.id);
            console.log(`🗑️ Removed deleted item: ${item.spanishWord || item.id}`);
          } catch (error) {
            console.error(`Failed to clean up deleted item ${item.id}:`, error);
          }
        }
      }
      
      // Calculate the latest timestamp from all synced data
      // This prevents freshly synced data from immediately appearing "stale" on next sync
      // Use a simple max variable instead of collecting all timestamps for better performance
      let maxSyncedTimestamp = 0;
      let timestampCount = 0;
      
      // Find max vocabulary timestamp
      if (vocabResult.operations) {
        for (const op of vocabResult.operations) {
          if (op.data?.updatedAt && op.data.updatedAt > maxSyncedTimestamp) {
            maxSyncedTimestamp = op.data.updatedAt;
          }
          if (op.data?.updatedAt) timestampCount++;
        }
      }
      
      // Find max review timestamp
      if (reviewsResult.reviews) {
        for (const review of reviewsResult.reviews) {
          if (review.updatedAt && review.updatedAt > maxSyncedTimestamp) {
            maxSyncedTimestamp = review.updatedAt;
          }
          if (review.updatedAt) timestampCount++;
        }
      }
      
      // Find max stats timestamp
      if (statsResult.stats) {
        for (const stat of statsResult.stats) {
          if (stat.updatedAt && stat.updatedAt > maxSyncedTimestamp) {
            maxSyncedTimestamp = stat.updatedAt;
          }
          if (stat.updatedAt) timestampCount++;
        }
      }
      
      // Use the latest timestamp from synced data, or current time if no data was synced
      if (maxSyncedTimestamp === 0) maxSyncedTimestamp = Date.now();
      const newLastSyncTime = new Date(maxSyncedTimestamp);
      
      // Update last sync time to the latest timestamp from synced data
      await this.setLastSyncTime(newLastSyncTime);
      console.log('✅ Sync completed successfully!');
      
      // CRITICAL FIX: Invalidate React Query cache to refresh UI with synced data
      if (this.queryClient) {
        const deletedVocabCount = vocabResult.operations?.filter((op: any) => op.data?.isDeleted).length || 0;
        console.log(`[Sync] Invalidating React Query cache (${deletedVocabCount} deletions applied)...`);
        
        // Invalidate all vocabulary-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
        // Invalidate stats queries (both vocab stats and daily stats)
        await this.queryClient.invalidateQueries({ queryKey: ['vocabulary', 'stats'] });
        await this.queryClient.invalidateQueries({ queryKey: ['stats'] });
        console.log('[Sync] Cache invalidated - UI will refetch fresh data')
      } else {
        console.warn('[Sync] QueryClient not available - UI may show stale data');
      }
      
      // Clear processed queue items
      await this.clearQueue();
      
      const endTime = new Date();
      const result: SyncResult = {
        status: 'success',
        syncType: type,
        direction: 'bidirectional',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        uploaded: operations.vocabulary.length + operations.reviews.length + operations.stats.length,
        downloaded: vocabResult.operations.length + reviewsResult.reviews.length + statsResult.stats.length,
        conflicts: vocabResult.conflicts.length,
        errors: 0,
        conflictDetails: vocabResult.conflicts,
        deviceId: this.deviceId,
        deviceName: this.getDeviceName(),
      };
      
      // Update state
      await this.updateState({
        isSyncing: false,
        syncStatus: 'success',
        lastSyncTime: endTime,
      });
      
      return result;
    } catch (error: any) {
      console.error('[Sync] Error:', error);
      
      const endTime = new Date();
      
      await this.updateState({
        isSyncing: false,
        syncStatus: 'error',
        errors: [{
          id: generateUUID(),
          entityType: 'vocabulary',
          entityId: '',
          operation: 'create',
          error: error.message,
          timestamp: new Date(),
        }],
      });
      
      return {
        status: 'error',
        syncType: type,
        direction: 'bidirectional',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: 1,
        errorDetails: [{
          id: generateUUID(),
          entityType: 'vocabulary',
          entityId: '',
          operation: 'create',
          error: error.message,
          timestamp: new Date(),
        }],
        deviceId: this.deviceId,
        deviceName: this.getDeviceName(),
      };
    }
  }
  
  /**
   * Sync vocabulary with server
   */
  private async syncVocabulary(
    operations: SyncOperation[],
    lastSyncTime: Date | null
  ): Promise<any> {
    const response = await fetch('/api/sync/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        lastSyncTime: lastSyncTime?.toISOString(),
        operations,
        deviceId: this.deviceId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync vocabulary');
    }
    
    return response.json();
  }
  
  /**
   * Sync reviews with server
   */
  private async syncReviews(
    operations: SyncOperation[],
    lastSyncTime: Date | null
  ): Promise<any> {
    const response = await fetch('/api/sync/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        lastSyncTime: lastSyncTime?.toISOString(),
        operations,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync reviews');
    }
    
    return response.json();
  }
  
  /**
   * Sync stats with server
   */
  private async syncStats(
    operations: SyncOperation[],
    lastSyncTime: Date | null
  ): Promise<any> {
    const response = await fetch('/api/sync/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        lastSyncTime: lastSyncTime?.toISOString(),
        operations,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync stats');
    }
    
    const result = await response.json();
    
    return result;
  }
  
  /**
   * Collect local changes for sync
   */
  private async collectLocalChanges(lastSyncTime: Date | null): Promise<{
    vocabulary: SyncOperation[];
    reviews: SyncOperation[];
    stats: SyncOperation[];
  }> {
    const vocabulary: SyncOperation[] = [];
    const reviews: SyncOperation[] = [];
    const stats: SyncOperation[] = [];
    
    // Get vocabulary items that changed since last sync
    // IMPORTANT: includeDeleted=true to sync deleted items to server
    const vocabItems = await getAllVocabularyWords(true);
    console.log(`[Sync] Found ${vocabItems.length} local vocabulary items (including ${vocabItems.filter(v => v.isDeleted).length} deleted)`);    
    for (const item of vocabItems) {
      // Check both createdAt and updatedAt to catch all changes
      const itemTime = Math.max(item.createdAt, item.updatedAt);
      const itemDate = new Date(itemTime);
      
      // Include items updated within last 60 seconds of lastSyncTime to handle race conditions
      // where vocabulary updates happen during/right after a sync
      const syncBuffer = 60000; // 60 seconds in milliseconds
      const effectiveSyncTime = lastSyncTime ? new Date(lastSyncTime.getTime() - syncBuffer) : null;
      const shouldSync = !effectiveSyncTime || itemDate > effectiveSyncTime;
      
      console.log(`[Sync] Item "${item.spanishWord || (item as any).spanish || item.id}" - created: ${new Date(item.createdAt).toISOString()}, updated: ${new Date(item.updatedAt).toISOString()}, lastSync: ${lastSyncTime?.toISOString() || 'never'}, shouldSync: ${shouldSync}`);      
      if (shouldSync) {        vocabulary.push({
          id: item.id,
          entityType: 'vocabulary',
          operation: 'update',
          data: item,
          localVersion: item.version || 0,
          timestamp: itemDate.toISOString(),
        });
      }
    }
    
    console.log(`[Sync] Collected ${vocabulary.length} vocabulary changes to upload`);
    
    // Get reviews since last sync
    const reviewItems = await getAllReviews();    for (const review of reviewItems) {
      // Use lastReviewDate if available, otherwise include the review (it's new)
      const reviewDate = review.lastReviewDate;
      const shouldInclude = !reviewDate || !lastSyncTime || new Date(reviewDate) > lastSyncTime;      if (shouldInclude) {
        reviews.push({
          id: review.id,
          entityType: 'review',
          operation: 'create',
          data: review,
          timestamp: reviewDate ? new Date(reviewDate).toISOString() : new Date().toISOString(),
        });
      }
    }
    
    // Get stats since last sync
    const statsItems = await getAllStats();
    
    for (const stat of statsItems) {
      // CRITICAL FIX: Only sync stats that were actually modified on this device
      // Check updatedAt timestamp instead of just checking if date is today
      // This prevents stale stats from overwriting fresh stats from other devices
      let shouldInclude = false;
      
      // CRITICAL: Never upload "empty" stats (fresh stats with no activity)
      // These are created automatically when getTodayStats() runs on a fresh database
      // Uploading them would overwrite real stats from other devices
      const isEmpty = (stat.cardsReviewed || 0) === 0 && 
                      (stat.sessionsCompleted || 0) === 0 && 
                      (stat.timeSpent || 0) === 0;
      
      if (isEmpty && !lastSyncTime) {
        // Fresh database with empty stats - don't upload, only download from server
        shouldInclude = false;
      } else if (!lastSyncTime) {
        // First sync with actual data - include stats that have activity
        shouldInclude = true;
      } else if (stat.updatedAt) {
        // Has updatedAt timestamp - check if modified since last sync
        shouldInclude = stat.updatedAt > lastSyncTime.getTime();
      } else {
        // Legacy stat without updatedAt - include only today's stats for backward compatibility
        const today = new Date();
        const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isToday = stat.date === todayDateStr;
        shouldInclude = isToday;
      }
      
      if (shouldInclude) {
        stats.push({
          id: stat.date,
          entityType: 'stats',
          operation: 'update',
          data: stat,
          timestamp: stat.updatedAt ? new Date(stat.updatedAt).toISOString() : new Date().toISOString(),
        });
      }
    }
    
    console.log(`[Sync] Collected ${stats.length} stats to upload (${statsItems.length} total evaluated)`);
    
    return { vocabulary, reviews, stats };
  }
  
  /**
   * Check authentication
   */
  private async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies for authentication
      });
      return response.ok;
    } catch (error) {
      console.log('[Sync] Not authenticated, skipping sync');
      return false;
    }
  }
  
  /**
   * Get device name
   */
  private getDeviceName(): string {
    if (typeof navigator === 'undefined') return 'Unknown';
    return `${navigator.platform} - ${navigator.userAgent.substring(0, 50)}`;
  }
  
  /**
   * Update sync state
   */
  private async updateState(update: Partial<SyncState>): Promise<void> {
    if (!this.db) return;
    
    const currentState = await this.getState();
    const newState = { ...currentState, ...update };
    await this.db.put('state', newState, 'syncState');
  }
  
  // Implement SyncService interface methods
  
  async syncEntity(entityType: any, entityId: string): Promise<void> {
    // Single entity sync not implemented in MVP
    throw new Error('Not implemented');
  }
  
  async resolveConflict(conflict: SyncConflict, resolution: ConflictResolution): Promise<void> {
    // Manual conflict resolution not implemented in MVP
    throw new Error('Not implemented');
  }
  
  async resolveAllConflicts(resolution: ConflictResolution): Promise<void> {
    // Auto-resolve all conflicts not implemented in MVP
    throw new Error('Not implemented');
  }
  
  async getPendingOperations(): Promise<SyncQueueItem[]> {
    if (!this.db) return [];
    return this.db.getAll('queue');
  }
  
  async clearPendingOperations(): Promise<void> {
    await this.clearQueue();
  }
  
  async getState(): Promise<SyncState> {
    if (!this.db) {
      return {
        isOnline: navigator.onLine,
        isSyncing: false,
        lastSyncTime: null,
        syncStatus: 'idle',
        pendingOperations: 0,
        errors: [],
        conflicts: [],
      };
    }
    
    const state = await this.db.get('state', 'syncState');
    return state || {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      syncStatus: 'idle',
      pendingOperations: 0,
      errors: [],
      conflicts: [],
    };
  }
  
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.db) return null;
    const time = await this.db.get('state', 'lastSyncTime');
    return time ? new Date(time) : null;
  }
  
  async setLastSyncTime(time: Date): Promise<void> {
    if (!this.db) return;
    await this.db.put('state', time.toISOString(), 'lastSyncTime');
  }
  
  async getDevices(): Promise<DeviceInfo[]> {
    // Not implemented in MVP
    return [];
  }
  
  async removeDevice(deviceId: string): Promise<void> {
    // Not implemented in MVP
    throw new Error('Not implemented');
  }
  
  async getConfig(): Promise<SyncConfig> {
    return this.config;
  }
  
  async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    if (this.db) {
      await this.db.put('state', this.config, 'config');
    }
  }
  
  private async clearQueue(): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction('queue', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
}

/**
 * Global sync service instance
 */
let syncServiceInstance: CloudSyncService | null = null;

/**
 * Get sync service instance
 */
export function getSyncService(): CloudSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new CloudSyncService();
  }
  return syncServiceInstance;
}

