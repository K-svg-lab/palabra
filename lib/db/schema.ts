/**
 * IndexedDB database schema and initialization
 * Provides structured local storage for vocabulary, reviews, sessions, and statistics
 */

import { openDB, type IDBPDatabase } from 'idb';
import { DB_CONFIG } from '@/lib/constants/app';
import type {
  VocabularyWord,
  ReviewRecord,
  ReviewSession,
  DailyStats,
} from '@/lib/types';
import type { NotificationPreferences } from '@/lib/types/notifications';

/**
 * Database type definition
 */
export interface PalabraDB {
  vocabulary: {
    key: string;
    value: VocabularyWord;
    indexes: { 
      'by-status': string; 
      'by-created': number;
      'by-word': string;
      'by-updated': number;
      'by-tags': string;
    };
  };
  reviews: {
    key: string;
    value: ReviewRecord;
    indexes: { 
      'by-vocab': string; 
      'by-next-review': number;
    };
  };
  sessions: {
    key: string;
    value: ReviewSession;
    indexes: { 
      'by-start-time': number;
    };
  };
  stats: {
    key: string;
    value: DailyStats;
    indexes: { 
      'by-date': string;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

/**
 * Opens and initializes the IndexedDB database
 * Creates object stores and indexes if they don't exist
 * 
 * @returns Promise resolving to the database instance
 */
export async function initDB(): Promise<IDBPDatabase<PalabraDB>> {
  return openDB<PalabraDB>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Vocabulary store
      let vocabStore;
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.VOCABULARY)) {
        vocabStore = db.createObjectStore(
          DB_CONFIG.STORES.VOCABULARY,
          { keyPath: 'id' }
        );
        
        vocabStore.createIndex('by-status', 'status');
        vocabStore.createIndex('by-created', 'createdAt');
        vocabStore.createIndex('by-word', 'spanishWord');
        vocabStore.createIndex('by-updated', 'updatedAt');
        vocabStore.createIndex('by-tags', 'tags', { multiEntry: true });
      } else {
        vocabStore = transaction.objectStore(DB_CONFIG.STORES.VOCABULARY);
        
        // Add new indexes if upgrading from older version
        if (!vocabStore.indexNames.contains('by-updated')) {
          vocabStore.createIndex('by-updated', 'updatedAt');
        }
        if (!vocabStore.indexNames.contains('by-tags')) {
          vocabStore.createIndex('by-tags', 'tags', { multiEntry: true });
        }
      }

      // Reviews store
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.REVIEWS)) {
        const reviewStore = db.createObjectStore(
          DB_CONFIG.STORES.REVIEWS,
          { keyPath: 'id' }
        );
        
        reviewStore.createIndex('by-vocab', 'vocabId');
        reviewStore.createIndex('by-next-review', 'nextReviewDate');
      } else if (oldVersion < 4 && transaction) {
        // Migration for version 4: Add directional accuracy fields
        // Note: This migration happens lazily when records are accessed
        // We can't use async/await in the upgrade callback, so we'll handle
        // migration at the application level when records are read
        console.log('📊 Database upgraded to v4 - directional accuracy tracking enabled');
        console.log('ℹ️  Existing review records will be migrated on first access');
      }

      // Sessions store
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(
          DB_CONFIG.STORES.SESSIONS,
          { keyPath: 'id' }
        );
        
        sessionStore.createIndex('by-start-time', 'startTime');
      }

      // Stats store
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.STATS)) {
        const statsStore = db.createObjectStore(
          DB_CONFIG.STORES.STATS,
          { keyPath: 'date' }
        );
        
        statsStore.createIndex('by-date', 'date');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

/**
 * Singleton database instance
 */
let dbInstance: IDBPDatabase<PalabraDB> | null = null;
let dbPromise: Promise<IDBPDatabase<PalabraDB>> | null = null;

/**
 * Gets the database instance, initializing if necessary
 * Uses singleton pattern to avoid multiple connections
 * Handles connection closing gracefully for HMR in development
 * 
 * @returns Promise resolving to the database instance
 */
export async function getDB(): Promise<IDBPDatabase<PalabraDB>> {
  // If we have a valid instance, return it
  if (dbInstance) {
    try {
      // Test if connection is still valid by checking object store names
      // This will throw if connection is closed/closing
      const storeNames = dbInstance.objectStoreNames;
      if (storeNames.length > 0) {
        return dbInstance;
      }
    } catch (error) {
      // Connection is closed or closing, clear instance
      console.log('[DB] Connection closed, reinitializing...');
      dbInstance = null;
      dbPromise = null;
    }
  }
  
  // If we're already initializing, wait for that promise
  if (dbPromise) {
    return dbPromise;
  }
  
  // Initialize new connection
  dbPromise = initDB().then(db => {
    dbInstance = db;
    dbPromise = null; // Clear promise once resolved
    return db;
  }).catch(error => {
    dbPromise = null; // Clear promise on error so we can retry
    dbInstance = null;
    throw error;
  });
  
  return dbPromise;
}

/**
 * Clears all user data from IndexedDB
 * Used when switching users to prevent data leakage
 * 
 * @returns Promise resolving when all data is cleared
 */
export async function clearAllUserData(): Promise<void> {
  const db = await getDB();
  
  // Clear all stores
  await db.clear(DB_CONFIG.STORES.VOCABULARY);
  await db.clear(DB_CONFIG.STORES.REVIEWS);
  await db.clear(DB_CONFIG.STORES.STATS);
  await db.clear(DB_CONFIG.STORES.SESSIONS);
  
  // Also clear sync state database
  try {
    const syncDB = await openDB('palabra-sync', 1);
    if (syncDB.objectStoreNames.contains('state')) {
      await syncDB.clear('state');
    }
    if (syncDB.objectStoreNames.contains('queue')) {
      await syncDB.clear('queue');
    }
    syncDB.close();
  } catch (error) {
    console.error('Failed to clear sync state:', error);
  }
  
  console.log('🗑️ All local user data cleared');
}

/**
 * Closes the database connection
 * Useful for cleanup and testing
 */
export function closeDB(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (error) {
      // Ignore errors on close
      console.log('[DB] Error closing connection (may already be closed)');
    }
    dbInstance = null;
  }
  dbPromise = null;
}

