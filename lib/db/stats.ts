/**
 * Daily statistics database operations
 * CRUD operations for managing daily stats in IndexedDB
 */

import { getDB } from './schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { DailyStats } from '@/lib/types';

/**
 * Formats a date as YYYY-MM-DD string
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates or updates daily stats for a specific date
 * 
 * @param stats - The daily stats to save
 * @returns Promise resolving to the saved stats
 */
export async function saveStats(stats: DailyStats): Promise<DailyStats> {
  const db = await getDB();
  await db.put(DB_CONFIG.STORES.STATS, stats);
  console.log('📊 Stats saved:', stats);
  return stats;
}

/**
 * Retrieves daily stats for a specific date
 * 
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Promise resolving to the stats or undefined if not found
 */
export async function getStats(date?: string): Promise<DailyStats | undefined> {
  const dateKey = date || formatDateKey();
  const db = await getDB();
  return db.get(DB_CONFIG.STORES.STATS, dateKey);
}

/**
 * Retrieves or creates daily stats for today
 * Creates an initial stats record if none exists
 * 
 * CRITICAL: This gets the stored stats, but the actual count of "newWordsAdded"
 * should be calculated from vocabulary items with createdAt = today
 * to account for synced words from other devices.
 * 
 * @returns Promise resolving to today's stats
 */
export async function getTodayStats(): Promise<DailyStats> {
  const dateKey = formatDateKey();
  let stats = await getStats(dateKey);
  
  if (!stats) {
    // Create initial stats for today
    stats = {
      date: dateKey,
      newWordsAdded: 0,
      cardsReviewed: 0,
      sessionsCompleted: 0,
      accuracyRate: 0,
      timeSpent: 0,
    };
    await saveStats(stats);
  }
  
  return stats;
}

/**
 * Retrieves all daily stats
 * 
 * @returns Promise resolving to array of all stats
 */
export async function getAllStats(): Promise<DailyStats[]> {
  const db = await getDB();
  return db.getAll(DB_CONFIG.STORES.STATS);
}

/**
 * Retrieves stats for a date range
 * 
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Promise resolving to array of stats in range
 */
export async function getStatsInRange(
  startDate: string,
  endDate: string
): Promise<DailyStats[]> {
  const db = await getDB();
  const allStats = await db.getAll(DB_CONFIG.STORES.STATS);
  
  return allStats.filter(
    (stat) => stat.date >= startDate && stat.date <= endDate
  ).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Gets stats for the last N days
 * 
 * @param days - Number of days to retrieve
 * @returns Promise resolving to array of stats
 */
export async function getRecentStats(days: number = 7): Promise<DailyStats[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  
  return getStatsInRange(
    formatDateKey(startDate),
    formatDateKey(endDate)
  );
}

/**
 * Increments new words added count for today
 * 
 * NOTE: This approach has a flaw - it only counts words added directly on this device,
 * not words created today on other devices that were synced in.
 * Better approach: Calculate from vocabulary.createdAt timestamps.
 * 
 * @param count - Number to increment by (defaults to 1)
 * @returns Promise resolving to updated stats
 */
export async function incrementNewWordsAdded(count: number = 1): Promise<DailyStats> {
  console.log('➕ Incrementing new words added by', count);
  const stats = await getTodayStats();
  console.log('📊 Current stats before increment:', stats);
  stats.newWordsAdded += count;
  console.log('📊 Stats after increment:', stats);
  return saveStats(stats);
}

/**
 * Calculates actual new words added today by checking vocabulary createdAt timestamps
 * This is more accurate than the incrementing approach because it accounts for
 * words created on other devices that were synced in.
 * 
 * @returns Promise resolving to count of words created today
 */
export async function getActualNewWordsAddedToday(): Promise<number> {
  const todayDateKey = formatDateKey();
  const { getAllVocabularyWords } = await import('./vocabulary');
  const allWords = await getAllVocabularyWords();
  
  // Count words where createdAt matches today's date
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  const wordsCreatedToday = allWords.filter(word => {
    const createdDate = new Date(word.createdAt);
    return createdDate >= todayStart && createdDate <= todayEnd;
  });
  
  return wordsCreatedToday.length;
}

/**
 * Updates stats after a review session
 * 
 * @param cardsReviewed - Number of cards reviewed
 * @param accuracyRate - Accuracy rate for this session (0-1)
 * @param timeSpent - Time spent in milliseconds
 * @returns Promise resolving to updated stats
 */
export async function updateStatsAfterSession(
  cardsReviewed: number,
  accuracyRate: number,
  timeSpent: number
): Promise<DailyStats> {
  console.log('📝 Updating stats after session:', { cardsReviewed, accuracyRate, timeSpent });
  const stats = await getTodayStats();
  console.log('📊 Current stats before session update:', stats);
  
  // Update session count
  stats.sessionsCompleted += 1;
  
  // Update cards reviewed
  stats.cardsReviewed += cardsReviewed;
  
  // Calculate weighted average accuracy
  const totalCards = stats.cardsReviewed;
  const previousAccuracyWeight = totalCards - cardsReviewed;
  const newAccuracyWeight = cardsReviewed;
  
  if (totalCards > 0) {
    stats.accuracyRate = (
      (stats.accuracyRate * previousAccuracyWeight) + 
      (accuracyRate * newAccuracyWeight)
    ) / totalCards;
  } else {
    stats.accuracyRate = accuracyRate;
  }
  
  // Update time spent
  stats.timeSpent += timeSpent;
  
  console.log('📊 Stats after session update:', stats);
  return saveStats(stats);
}

/**
 * Deletes stats for a specific date
 * 
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise resolving when deletion is complete
 */
export async function deleteStats(date: string): Promise<void> {
  const db = await getDB();
  await db.delete(DB_CONFIG.STORES.STATS, date);
}

/**
 * Counts total days with recorded stats
 * 
 * @returns Promise resolving to the count
 */
export async function countDaysWithStats(): Promise<number> {
  const db = await getDB();
  return db.count(DB_CONFIG.STORES.STATS);
}

/**
 * Calculates total cards reviewed across all time
 * 
 * @returns Promise resolving to the total count
 */
export async function getTotalCardsReviewed(): Promise<number> {
  const allStats = await getAllStats();
  return allStats.reduce((total, stat) => total + stat.cardsReviewed, 0);
}

/**
 * Calculates total study time across all time
 * 
 * @returns Promise resolving to the total time in milliseconds
 */
export async function getTotalStudyTime(): Promise<number> {
  const allStats = await getAllStats();
  return allStats.reduce((total, stat) => total + stat.timeSpent, 0);
}

/**
 * Calculates overall accuracy rate
 * 
 * @returns Promise resolving to the average accuracy (0-1)
 */
export async function getOverallAccuracy(): Promise<number> {
  const allStats = await getAllStats();
  
  if (allStats.length === 0) {
    return 0;
  }
  
  const totalCards = allStats.reduce((sum, stat) => sum + stat.cardsReviewed, 0);
  
  if (totalCards === 0) {
    return 0;
  }
  
  const weightedAccuracy = allStats.reduce(
    (sum, stat) => sum + (stat.accuracyRate * stat.cardsReviewed),
    0
  );
  
  return weightedAccuracy / totalCards;
}

