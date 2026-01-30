/**
 * Offline Cache Service
 * Manages intelligent caching of vocabulary for offline access
 */

import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { VocabularyWord, ReviewRecord } from '@/lib/types';
import type { OfflineCacheConfig, OfflineCacheMetadata } from '@/lib/types/offline';
import { DEFAULT_OFFLINE_CACHE_CONFIG } from '@/lib/types/offline';

const CACHE_STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = 1;

/**
 * Offline Cache Service class
 */
export class OfflineCacheService {
  private config: OfflineCacheConfig;

  constructor(config?: Partial<OfflineCacheConfig>) {
    this.config = {
      ...DEFAULT_OFFLINE_CACHE_CONFIG,
      ...config,
    };
  }

  /**
   * Cache vocabulary for offline access based on strategy
   */
  async cacheVocabularyForOffline(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[OfflineCache] Caching disabled');
      return;
    }

    console.log('[OfflineCache] Starting vocabulary cache update...');
    const db = await getDB();

    try {
      // Get all vocabulary and reviews
      const allVocab = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
      const allReviews = await db.getAll(DB_CONFIG.STORES.REVIEWS);

      // Create review map for quick lookup
      const reviewMap = new Map<string, ReviewRecord>();
      for (const review of allReviews) {
        reviewMap.set(review.vocabId, review);
      }

      const now = Date.now();
      const recentThreshold = now - (this.config.recentDays * 24 * 60 * 60 * 1000);
      const reviewedThreshold = now - (this.config.reviewedDays * 24 * 60 * 60 * 1000);

      // Score and filter vocabulary
      const scoredVocab = allVocab
        .filter(word => !word.isDeleted)
        .map(word => {
          let score = 0;
          const review = reviewMap.get(word.id);

          // Words due for review get highest priority
          if (this.config.cacheDueWords && review) {
            const dueDate = review.nextReviewDate || 0;
            if (dueDate <= now) {
              score += 1000;
            } else if (dueDate <= now + (7 * 24 * 60 * 60 * 1000)) {
              // Due within a week
              score += 500;
            }
          }

          // Recently added words
          if (word.createdAt >= recentThreshold) {
            score += 300;
          }

          // Recently reviewed words
          if (review && review.lastReviewDate && review.lastReviewDate >= reviewedThreshold) {
            score += 200;
          }

          // Learning words (not mastered yet)
          if (word.status === 'learning' || word.status === 'new') {
            score += 100;
          }

          return { word, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, this.config.maxVocabularyItems)
        .map(item => item.word);

      console.log(`[OfflineCache] Cached ${scoredVocab.length} vocabulary items`);

      // Update cache metadata
      const metadata: OfflineCacheMetadata = {
        vocabularyCount: scoredVocab.length,
        reviewCount: allReviews.length,
        lastUpdate: now,
        version: CACHE_VERSION,
        isStale: false,
      };

      await this._saveCacheMetadata(metadata);
      this.config.lastUpdate = now;

      console.log('[OfflineCache] Cache updated successfully');
    } catch (error) {
      console.error('[OfflineCache] Error updating cache:', error);
      throw error;
    }
  }

  /**
   * Get cached vocabulary
   * Returns vocabulary that's been prioritized for offline access
   */
  async getCachedVocabulary(): Promise<VocabularyWord[]> {
    const db = await getDB();
    
    // For now, just return all non-deleted vocabulary
    // In the future, we could maintain a separate cache store
    const allVocab = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
    return allVocab.filter(word => !word.isDeleted);
  }

  /**
   * Get vocabulary due for review
   */
  async getVocabularyDueForReview(): Promise<VocabularyWord[]> {
    const db = await getDB();
    const now = Date.now();

    const allVocab = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
    const allReviews = await db.getAll(DB_CONFIG.STORES.REVIEWS);

    const reviewMap = new Map<string, ReviewRecord>();
    for (const review of allReviews) {
      reviewMap.set(review.vocabId, review);
    }

    return allVocab.filter(word => {
      if (word.isDeleted) return false;
      
      const review = reviewMap.get(word.id);
      if (!review) return true; // New words not yet reviewed
      
      const dueDate = review.nextReviewDate || 0;
      return dueDate <= now;
    });
  }

  /**
   * Check if cache is stale and needs refresh
   */
  async isCacheStale(): Promise<boolean> {
    const metadata = await this._getCacheMetadata();
    
    if (!metadata || !metadata.lastUpdate) {
      return true;
    }

    const age = Date.now() - metadata.lastUpdate;
    return age > CACHE_STALE_THRESHOLD;
  }

  /**
   * Get cache metadata
   */
  async getCacheMetadata(): Promise<OfflineCacheMetadata | null> {
    return this._getCacheMetadata();
  }

  /**
   * Update cache configuration
   */
  async updateConfig(config: Partial<OfflineCacheConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
    };

    const db = await getDB();
    await db.put(DB_CONFIG.STORES.SETTINGS, {
      key: 'offline-cache-config',
      value: this.config,
      updatedAt: Date.now(),
    });

    console.log('[OfflineCache] Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineCacheConfig {
    return { ...this.config };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    const db = await getDB();
    await db.delete(DB_CONFIG.STORES.SETTINGS, 'offline-cache-metadata');
    this.config.lastUpdate = undefined;
    console.log('[OfflineCache] Cache cleared');
  }

  /**
   * Force cache refresh
   */
  async refreshCache(): Promise<void> {
    await this.cacheVocabularyForOffline();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalVocabulary: number;
    cachedVocabulary: number;
    dueForReview: number;
    cacheSize: string;
    lastUpdate: Date | null;
    isStale: boolean;
  }> {
    const db = await getDB();
    const metadata = await this._getCacheMetadata();
    
    const allVocab = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
    const totalVocabulary = allVocab.filter(v => !v.isDeleted).length;
    
    const dueVocab = await this.getVocabularyDueForReview();
    const dueForReview = dueVocab.length;

    // Rough estimate of cache size (in KB)
    const avgWordSize = 5; // ~5KB per word (with all metadata)
    const cacheSizeKB = (metadata?.vocabularyCount || 0) * avgWordSize;
    const cacheSize = cacheSizeKB > 1024 
      ? `${(cacheSizeKB / 1024).toFixed(1)} MB`
      : `${cacheSizeKB} KB`;

    return {
      totalVocabulary,
      cachedVocabulary: metadata?.vocabularyCount || 0,
      dueForReview,
      cacheSize,
      lastUpdate: metadata?.lastUpdate ? new Date(metadata.lastUpdate) : null,
      isStale: await this.isCacheStale(),
    };
  }

  /**
   * Save cache metadata to settings store
   */
  private async _saveCacheMetadata(metadata: OfflineCacheMetadata): Promise<void> {
    const db = await getDB();
    await db.put(DB_CONFIG.STORES.SETTINGS, {
      key: 'offline-cache-metadata',
      value: metadata,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get cache metadata from settings store
   */
  private async _getCacheMetadata(): Promise<OfflineCacheMetadata | null> {
    const db = await getDB();
    const record = await db.get(DB_CONFIG.STORES.SETTINGS, 'offline-cache-metadata');
    return record?.value as OfflineCacheMetadata || null;
  }
}

/**
 * Global offline cache service instance
 */
let offlineCacheInstance: OfflineCacheService | null = null;

/**
 * Get the offline cache service instance
 */
export function getOfflineCacheService(config?: Partial<OfflineCacheConfig>): OfflineCacheService {
  if (!offlineCacheInstance) {
    offlineCacheInstance = new OfflineCacheService(config);
  }
  return offlineCacheInstance;
}

/**
 * Initialize cache on app startup
 */
export async function initializeOfflineCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const cacheService = getOfflineCacheService();
    const isStale = await cacheService.isCacheStale();

    if (isStale) {
      console.log('[OfflineCache] Cache is stale, updating...');
      await cacheService.cacheVocabularyForOffline();
    } else {
      console.log('[OfflineCache] Cache is fresh');
    }
  } catch (error) {
    console.error('[OfflineCache] Initialization error:', error);
  }
}
