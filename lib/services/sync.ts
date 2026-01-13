/**
 * Cloud synchronization service
 * Handles bidirectional sync between local IndexedDB and remote server
 */

import { openDB, type IDBPDatabase } from 'idb';
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
import { getAllReviews } from '@/lib/db/reviews';
import { getAllStats } from '@/lib/db/stats';

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
      deviceId = crypto.randomUUID();
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
      
      // Update state
      await this.updateState({ isSyncing: true, syncStatus: 'syncing' });
      status = 'syncing';
      
      // Get last sync time (null for full sync to upload everything)
      const lastSyncTime = type === 'full' ? null : await this.getLastSyncTime();
      console.log(`📅 Last sync time: ${lastSyncTime || 'never (full sync)'}`);
      
      // Collect local changes
      const operations = await this.collectLocalChanges(lastSyncTime);
      console.log(`📤 Uploading: ${operations.vocabulary.length} vocab, ${operations.reviews.length} reviews, ${operations.stats.length} stats`);
      
      // Sync vocabulary
      const vocabResult = await this.syncVocabulary(operations.vocabulary, lastSyncTime);
      
      // Apply remote vocabulary changes to local database
      if (vocabResult.operations && vocabResult.operations.length > 0) {
        console.log(`📥 Applying ${vocabResult.operations.length} remote vocabulary items...`);
        for (const operation of vocabResult.operations) {
          try {
            await updateVocabularyWord(operation.data);
            console.log(`✅ Applied: ${operation.data.spanish}`);
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
      
      // Sync stats
      const statsResult = await this.syncStats(operations.stats, lastSyncTime);
      console.log(`📥 Downloaded ${statsResult.stats?.length || 0} stats`);
      
      // Update last sync time
      await this.setLastSyncTime(new Date());
      console.log('✅ Sync completed successfully!');
      
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
          id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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
      body: JSON.stringify({
        lastSyncTime: lastSyncTime?.toISOString(),
        operations,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync stats');
    }
    
    return response.json();
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
    const vocabItems = await getAllVocabularyWords();
    console.log(`[Sync] Found ${vocabItems.length} local vocabulary items`);
    
    for (const item of vocabItems) {
      // Check both createdAt and updatedAt to catch all changes
      const itemTime = Math.max(item.createdAt, item.updatedAt);
      const itemDate = new Date(itemTime);
      const shouldSync = !lastSyncTime || itemDate > lastSyncTime;
      
      console.log(`[Sync] Item "${item.spanishWord || (item as any).spanish || item.id}" - created: ${new Date(item.createdAt).toISOString()}, updated: ${new Date(item.updatedAt).toISOString()}, lastSync: ${lastSyncTime?.toISOString() || 'never'}, shouldSync: ${shouldSync}`);
      
      if (shouldSync) {
        vocabulary.push({
          id: item.id,
          entityType: 'vocabulary',
          operation: 'update',
          data: item,
          timestamp: itemDate.toISOString(),
        });
      }
    }
    
    console.log(`[Sync] Collected ${vocabulary.length} vocabulary changes to upload`);
    
    // Get reviews since last sync
    const reviewItems = await getAllReviews();
    for (const review of reviewItems) {
      const reviewDate = review.lastReviewDate || Date.now();
      if (!lastSyncTime || new Date(reviewDate) > lastSyncTime) {
        reviews.push({
          id: review.id,
          entityType: 'review',
          operation: 'create',
          data: review,
          timestamp: new Date(reviewDate).toISOString(),
        });
      }
    }
    
    // Get stats since last sync
    const statsItems = await getAllStats();
    for (const stat of statsItems) {
      if (!lastSyncTime || new Date(stat.date) > lastSyncTime) {
        stats.push({
          id: stat.date,
          entityType: 'stats',
          operation: 'update',
          data: stat,
          timestamp: new Date(stat.date).toISOString(),
        });
      }
    }
    
    return { vocabulary, reviews, stats };
  }
  
  /**
   * Check authentication
   */
  private async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me');
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

