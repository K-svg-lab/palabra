/**
 * Offline Mode Types
 * Defines types for offline queue and caching functionality
 */

/**
 * Types of operations that can be queued for offline sync
 */
export type OfflineOperationType = 'add_vocabulary' | 'submit_review' | 'update_vocabulary' | 'delete_vocabulary';

/**
 * Status of a queued operation
 */
export type OfflineOperationStatus = 'pending' | 'syncing' | 'failed' | 'completed';

/**
 * Item in the offline queue
 */
export interface OfflineQueueItem {
  /** Unique identifier for the queue item */
  id: string;
  
  /** Type of operation to perform */
  type: OfflineOperationType;
  
  /** Current status of the operation */
  status: OfflineOperationStatus;
  
  /** The data to sync (vocabulary word, review result, etc.) */
  data: any;
  
  /** Timestamp when the operation was queued */
  timestamp: number;
  
  /** Number of retry attempts */
  retryCount: number;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Last attempt timestamp */
  lastAttempt?: number;
}

/**
 * Status of the offline queue
 */
export interface OfflineQueueStatus {
  /** Total number of items in queue */
  total: number;
  
  /** Number of pending items */
  pending: number;
  
  /** Number of syncing items */
  syncing: number;
  
  /** Number of failed items */
  failed: number;
  
  /** Number of completed items */
  completed: number;
}

/**
 * Configuration for offline caching
 */
export interface OfflineCacheConfig {
  /** Enable offline caching */
  enabled: boolean;
  
  /** Maximum number of vocabulary items to cache */
  maxVocabularyItems: number;
  
  /** Number of days of recent vocabulary to cache */
  recentDays: number;
  
  /** Number of days of reviewed vocabulary to cache */
  reviewedDays: number;
  
  /** Cache words due for review */
  cacheDueWords: boolean;
  
  /** Last cache update timestamp */
  lastUpdate?: number;
}

/**
 * Default offline cache configuration
 */
export const DEFAULT_OFFLINE_CACHE_CONFIG: OfflineCacheConfig = {
  enabled: true,
  maxVocabularyItems: 500,
  recentDays: 30,
  reviewedDays: 7,
  cacheDueWords: true,
};

/**
 * Offline cache metadata
 */
export interface OfflineCacheMetadata {
  /** Number of cached vocabulary items */
  vocabularyCount: number;
  
  /** Number of cached review records */
  reviewCount: number;
  
  /** Last update timestamp */
  lastUpdate: number;
  
  /** Cache version */
  version: number;
  
  /** Is cache stale (needs refresh) */
  isStale: boolean;
}
