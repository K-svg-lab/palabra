/**
 * Guest Data Migration Utility (Feb 8, 2026)
 * 
 * Seamlessly migrates local IndexedDB data to cloud when guest users sign up.
 * 
 * Flow:
 * 1. User uses app as guest (data in IndexedDB)
 * 2. User signs up
 * 3. Automatically detect local data
 * 4. Batch upload to cloud via API
 * 5. Mark as synced (keep local copy)
 * 
 * @module lib/utils/guest-migration
 */

import { getAllVocabularyWords } from '@/lib/db/vocabulary';
import { getAllReviews } from '@/lib/db/reviews';
import { getTodayStats, getRecentStats } from '@/lib/db/stats';

/**
 * Check if user has local guest data that needs migration
 * 
 * @returns Promise<boolean> True if local data exists
 */
export async function hasGuestData(): Promise<boolean> {
  try {
    const vocabulary = await getAllVocabularyWords();
    return vocabulary.length > 0;
  } catch (error) {
    console.error('Failed to check for guest data:', error);
    return false;
  }
}

/**
 * Get count of guest data items
 * 
 * @returns Promise<object> Counts of each data type
 */
export async function getGuestDataCounts(): Promise<{
  vocabulary: number;
  reviews: number;
  hasStats: boolean;
}> {
  try {
    const [vocabulary, reviews, stats] = await Promise.all([
      getAllVocabularyWords(),
      getAllReviews(),
      getTodayStats(),
    ]);

    return {
      vocabulary: vocabulary.length,
      reviews: reviews.length,
      hasStats: stats.cardsReviewed > 0 || stats.newWordsAdded > 0,
    };
  } catch (error) {
    console.error('Failed to get guest data counts:', error);
    return { vocabulary: 0, reviews: 0, hasStats: false };
  }
}

/**
 * Migrate guest data to cloud after signup
 * 
 * This function:
 * 1. Reads all local IndexedDB data
 * 2. Uploads to server via sync API
 * 3. Marks data as synced
 * 4. Keeps local data (doesn't clear)
 * 
 * @param userId - The newly created user ID
 * @returns Promise<object> Migration result with counts
 */
export async function migrateGuestDataToCloud(userId: string): Promise<{
  success: boolean;
  migrated: {
    vocabulary: number;
    reviews: number;
    stats: boolean;
  };
  error?: string;
}> {
  try {
    console.log('🔄 Starting guest data migration for user:', userId);

    // 1. Collect all local data
    const [vocabulary, reviews, todayStats, recentStats] = await Promise.all([
      getAllVocabularyWords(),
      getAllReviews(),
      getTodayStats(),
      getRecentStats(30),
    ]);

    console.log('📦 Local data collected:', {
      vocabulary: vocabulary.length,
      reviews: reviews.length,
      stats: recentStats.length,
    });

    // 2. Nothing to migrate
    if (vocabulary.length === 0) {
      console.log('✅ No guest data to migrate');
      return {
        success: true,
        migrated: { vocabulary: 0, reviews: 0, stats: false },
      };
    }

    // 3. Upload to server via sync API
    // Note: The sync service will handle batch uploads
    try {
      const { getSyncService } = await import('@/lib/services/sync');
      const syncService = getSyncService();
      
      // Trigger full sync to upload all local data
      await syncService.sync('full');
      
      console.log('✅ Guest data migrated successfully');
      
      // Mark migration as complete in localStorage
      localStorage.setItem('palabra_guest_migration_completed', 'true');
      localStorage.setItem('palabra_guest_migration_date', new Date().toISOString());
      
      return {
        success: true,
        migrated: {
          vocabulary: vocabulary.length,
          reviews: reviews.length,
          stats: recentStats.length > 0,
        },
      };
    } catch (syncError) {
      console.error('❌ Failed to sync guest data:', syncError);
      throw new Error('Sync failed: ' + (syncError as Error).message);
    }
  } catch (error) {
    console.error('❌ Guest data migration failed:', error);
    return {
      success: false,
      migrated: { vocabulary: 0, reviews: 0, stats: false },
      error: (error as Error).message,
    };
  }
}

/**
 * Show migration prompt to user after signup
 * 
 * @returns Promise<boolean> True if user has data to migrate
 */
export async function shouldShowMigrationPrompt(): Promise<boolean> {
  try {
    // Don't show if already migrated
    const alreadyMigrated = localStorage.getItem('palabra_guest_migration_completed');
    if (alreadyMigrated) {
      return false;
    }

    // Check if has guest data
    return await hasGuestData();
  } catch {
    return false;
  }
}

/**
 * Clear guest data after successful migration and verification
 * 
 * WARNING: Only call this after confirming data is safely in cloud!
 * 
 * @returns Promise<void>
 */
export async function clearGuestDataAfterMigration(): Promise<void> {
  try {
    console.log('🗑️  Clearing guest data after migration...');
    
    // This would use the same logic as logout, but preserve auth
    // For now, we keep local data as backup
    console.log('💡 Keeping local data as backup (cloud sync active)');
    
  } catch (error) {
    console.error('Failed to clear guest data:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Check migration status
 * 
 * @returns object Migration status and metadata
 */
export function getMigrationStatus(): {
  completed: boolean;
  date: string | null;
} {
  const completed = localStorage.getItem('palabra_guest_migration_completed') === 'true';
  const date = localStorage.getItem('palabra_guest_migration_date');
  
  return { completed, date };
}
