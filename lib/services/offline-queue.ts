/**
 * Offline Queue Service
 * Manages queuing and processing of operations when offline
 */

import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type {
  OfflineQueueItem,
  OfflineQueueStatus,
  OfflineOperationType,
} from '@/lib/types/offline';
import { generateUUID } from '@/lib/utils/uuid';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 1000;

/**
 * Offline Queue Service class
 */
export class OfflineQueueService {
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  /**
   * Add an operation to the offline queue
   */
  async enqueue(type: OfflineOperationType, data: any): Promise<string> {
    const db = await getDB();
    
    // Check queue size limit
    const currentSize = await db.count(DB_CONFIG.STORES.OFFLINE_QUEUE);
    if (currentSize >= MAX_QUEUE_SIZE) {
      throw new Error('Offline queue is full. Please sync your changes.');
    }

    const queueItem: OfflineQueueItem = {
      id: generateUUID(),
      type,
      status: 'pending',
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.add(DB_CONFIG.STORES.OFFLINE_QUEUE, queueItem);
    console.log(`[OfflineQueue] Enqueued ${type} operation:`, queueItem.id);
    
    return queueItem.id;
  }

  /**
   * Process all pending operations in the queue
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing, waiting...');
      return this.processingPromise || Promise.resolve();
    }

    this.isProcessing = true;
    this.processingPromise = this._processQueueInternal();
    
    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  /**
   * Internal queue processing logic
   */
  private async _processQueueInternal(): Promise<void> {
    if (!navigator.onLine) {
      console.log('[OfflineQueue] Offline, skipping queue processing');
      return;
    }

    const db = await getDB();
    const index = db.transaction(DB_CONFIG.STORES.OFFLINE_QUEUE).store.index('by-status');
    const pendingItems = await index.getAll('pending');

    if (pendingItems.length === 0) {
      console.log('[OfflineQueue] No pending items to process');
      return;
    }

    console.log(`[OfflineQueue] Processing ${pendingItems.length} pending items`);

    // Process items in batches of 10
    const batchSize = 10;
    for (let i = 0; i < pendingItems.length; i += batchSize) {
      const batch = pendingItems.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this._processItem(item)));
    }

    console.log('[OfflineQueue] Queue processing complete');
  }

  /**
   * Process a single queue item
   */
  private async _processItem(item: OfflineQueueItem): Promise<void> {
    const db = await getDB();
    
    try {
      // Update status to syncing
      item.status = 'syncing';
      item.lastAttempt = Date.now();
      await db.put(DB_CONFIG.STORES.OFFLINE_QUEUE, item);

      // Process based on operation type
      switch (item.type) {
        case 'add_vocabulary':
          await this._processAddVocabulary(item);
          break;
        case 'update_vocabulary':
          await this._processUpdateVocabulary(item);
          break;
        case 'delete_vocabulary':
          await this._processDeleteVocabulary(item);
          break;
        case 'submit_review':
          await this._processSubmitReview(item);
          break;
        default:
          throw new Error(`Unknown operation type: ${item.type}`);
      }

      // Mark as completed
      item.status = 'completed';
      await db.put(DB_CONFIG.STORES.OFFLINE_QUEUE, item);
      console.log(`[OfflineQueue] Completed ${item.type}:`, item.id);

      // Clean up completed items immediately
      await db.delete(DB_CONFIG.STORES.OFFLINE_QUEUE, item.id);
    } catch (error: any) {
      console.error(`[OfflineQueue] Failed to process ${item.type}:`, error);
      
      // Update retry count
      item.retryCount++;
      item.error = error.message;

      if (item.retryCount >= MAX_RETRY_ATTEMPTS) {
        item.status = 'failed';
        console.error(`[OfflineQueue] Max retries reached for ${item.type}:`, item.id);
      } else {
        item.status = 'pending';
        console.log(`[OfflineQueue] Will retry ${item.type} (attempt ${item.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      }

      await db.put(DB_CONFIG.STORES.OFFLINE_QUEUE, item);
    }
  }

  /**
   * Process add vocabulary operation
   */
  private async _processAddVocabulary(item: OfflineQueueItem): Promise<void> {
    const response = await fetch('/api/sync/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        operations: [{
          id: item.data.id,
          entityType: 'vocabulary',
          operation: 'create',
          data: item.data,
          timestamp: new Date(item.timestamp).toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync vocabulary: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local vocabulary with any enhancements from server
    if (result.operations && result.operations.length > 0) {
      const { updateVocabularyWord } = await import('@/lib/db/vocabulary');
      for (const op of result.operations) {
        if (op.data.id === item.data.id) {
          await updateVocabularyWord(op.data);
        }
      }
    }
  }

  /**
   * Process update vocabulary operation
   */
  private async _processUpdateVocabulary(item: OfflineQueueItem): Promise<void> {
    const response = await fetch('/api/sync/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        operations: [{
          id: item.data.id,
          entityType: 'vocabulary',
          operation: 'update',
          data: item.data,
          timestamp: new Date(item.timestamp).toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync vocabulary update: ${response.statusText}`);
    }
  }

  /**
   * Process delete vocabulary operation
   */
  private async _processDeleteVocabulary(item: OfflineQueueItem): Promise<void> {
    const response = await fetch('/api/sync/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        operations: [{
          id: item.data.id,
          entityType: 'vocabulary',
          operation: 'delete',
          data: item.data,
          timestamp: new Date(item.timestamp).toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync vocabulary deletion: ${response.statusText}`);
    }
  }

  /**
   * Process submit review operation
   */
  private async _processSubmitReview(item: OfflineQueueItem): Promise<void> {
    const response = await fetch('/api/sync/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        operations: Array.isArray(item.data) ? item.data.map((review: any) => ({
          id: review.id || generateUUID(),
          entityType: 'review',
          operation: 'create',
          data: review,
          timestamp: new Date(item.timestamp).toISOString(),
        })) : [{
          id: item.data.id || generateUUID(),
          entityType: 'review',
          operation: 'create',
          data: item.data,
          timestamp: new Date(item.timestamp).toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync reviews: ${response.statusText}`);
    }
  }

  /**
   * Get the current status of the queue
   */
  async getQueueStatus(): Promise<OfflineQueueStatus> {
    const db = await getDB();
    const allItems = await db.getAll(DB_CONFIG.STORES.OFFLINE_QUEUE);

    const status: OfflineQueueStatus = {
      total: allItems.length,
      pending: 0,
      syncing: 0,
      failed: 0,
      completed: 0,
    };

    for (const item of allItems) {
      switch (item.status) {
        case 'pending':
          status.pending++;
          break;
        case 'syncing':
          status.syncing++;
          break;
        case 'failed':
          status.failed++;
          break;
        case 'completed':
          status.completed++;
          break;
      }
    }

    return status;
  }

  /**
   * Get all items in the queue
   */
  async getAllItems(): Promise<OfflineQueueItem[]> {
    const db = await getDB();
    return db.getAll(DB_CONFIG.STORES.OFFLINE_QUEUE);
  }

  /**
   * Get failed items
   */
  async getFailedItems(): Promise<OfflineQueueItem[]> {
    const db = await getDB();
    const index = db.transaction(DB_CONFIG.STORES.OFFLINE_QUEUE).store.index('by-status');
    return index.getAll('failed');
  }

  /**
   * Retry a failed item
   */
  async retryFailedItem(itemId: string): Promise<void> {
    const db = await getDB();
    const item = await db.get(DB_CONFIG.STORES.OFFLINE_QUEUE, itemId);
    
    if (!item || item.status !== 'failed') {
      throw new Error('Item not found or not in failed state');
    }

    item.status = 'pending';
    item.retryCount = 0;
    item.error = undefined;
    await db.put(DB_CONFIG.STORES.OFFLINE_QUEUE, item);

    // Try to process immediately if online
    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  /**
   * Retry all failed items
   */
  async retryAllFailed(): Promise<void> {
    const failedItems = await this.getFailedItems();
    
    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount = 0;
      item.error = undefined;
    }

    const db = await getDB();
    const tx = db.transaction(DB_CONFIG.STORES.OFFLINE_QUEUE, 'readwrite');
    await Promise.all(failedItems.map(item => tx.store.put(item)));
    await tx.done;

    // Try to process immediately if online
    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  /**
   * Clear completed items from the queue
   */
  async clearCompleted(): Promise<void> {
    const db = await getDB();
    const index = db.transaction(DB_CONFIG.STORES.OFFLINE_QUEUE, 'readwrite').store.index('by-status');
    const completedItems = await index.getAll('completed');

    const tx = db.transaction(DB_CONFIG.STORES.OFFLINE_QUEUE, 'readwrite');
    await Promise.all(completedItems.map(item => tx.store.delete(item.id)));
    await tx.done;

    console.log(`[OfflineQueue] Cleared ${completedItems.length} completed items`);
  }

  /**
   * Clear all items from the queue (use with caution)
   */
  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear(DB_CONFIG.STORES.OFFLINE_QUEUE);
    console.log('[OfflineQueue] Cleared all queue items');
  }

  /**
   * Delete a specific item from the queue
   */
  async deleteItem(itemId: string): Promise<void> {
    const db = await getDB();
    await db.delete(DB_CONFIG.STORES.OFFLINE_QUEUE, itemId);
    console.log(`[OfflineQueue] Deleted item:`, itemId);
  }
}

/**
 * Global offline queue service instance
 */
let offlineQueueInstance: OfflineQueueService | null = null;

/**
 * Get the offline queue service instance
 */
export function getOfflineQueueService(): OfflineQueueService {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueueService();
  }
  return offlineQueueInstance;
}
