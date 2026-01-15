/**
 * Review database operations
 * CRUD operations for managing review records in IndexedDB
 */

import { getDB } from './schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { ReviewRecord } from '@/lib/types';

/**
 * Creates a new review record in the database
 * 
 * @param review - The review record to create
 * @returns Promise resolving to the created review
 */
export async function createReviewRecord(
  review: ReviewRecord
): Promise<ReviewRecord> {
  const db = await getDB();
  await db.add(DB_CONFIG.STORES.REVIEWS, review);
  return review;
}

/**
 * Retrieves a review record by ID
 * 
 * @param id - The review ID
 * @returns Promise resolving to the review or undefined if not found
 */
export async function getReviewRecord(
  id: string
): Promise<ReviewRecord | undefined> {
  const db = await getDB();
  return db.get(DB_CONFIG.STORES.REVIEWS, id);
}

/**
 * Retrieves review record for a specific vocabulary word
 * 
 * @param vocabId - The vocabulary word ID
 * @returns Promise resolving to the review record or undefined
 */
export async function getReviewByVocabId(
  vocabId: string
): Promise<ReviewRecord | undefined> {
  const db = await getDB();
  const reviews = await db.getAllFromIndex(
    DB_CONFIG.STORES.REVIEWS,
    'by-vocab',
    vocabId
  );
  return reviews[0]; // Should only be one per vocab word
}

/**
 * Retrieves all review records
 * 
 * @returns Promise resolving to array of all reviews
 */
export async function getAllReviews(): Promise<ReviewRecord[]> {
  const db = await getDB();
  return db.getAll(DB_CONFIG.STORES.REVIEWS);
}

/**
 * Retrieves reviews that are due for review (nextReviewDate <= now)
 * 
 * @param currentTime - Current timestamp (defaults to now)
 * @returns Promise resolving to array of due reviews
 */
export async function getDueReviews(
  currentTime: number = Date.now()
): Promise<ReviewRecord[]> {
  const db = await getDB();
  const allReviews = await db.getAll(DB_CONFIG.STORES.REVIEWS);
  
  return allReviews.filter(
    (review) => review.nextReviewDate <= currentTime
  );
}

/**
 * Updates an existing review record
 * 
 * @param review - The updated review data
 * @returns Promise resolving to the updated review
 */
export async function updateReviewRecord(
  review: ReviewRecord
): Promise<ReviewRecord> {
  const db = await getDB();
  await db.put(DB_CONFIG.STORES.REVIEWS, review);
  return review;
}

/**
 * Deletes a review record
 * 
 * @param id - The review ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteReviewRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(DB_CONFIG.STORES.REVIEWS, id);
}

/**
 * Deletes review record by vocabulary ID
 * Used when deleting a vocabulary word
 * 
 * @param vocabId - The vocabulary word ID
 * @returns Promise resolving when deletion is complete
 */
export async function deleteReviewByVocabId(vocabId: string): Promise<void> {
  const review = await getReviewByVocabId(vocabId);
  if (review) {
    await deleteReviewRecord(review.id);
  }
}

/**
 * Counts total review records
 * 
 * @returns Promise resolving to the count
 */
export async function countReviews(): Promise<number> {
  const db = await getDB();
  return db.count(DB_CONFIG.STORES.REVIEWS);
}

/**
 * Counts reviews due for review
 * 
 * @param currentTime - Current timestamp (defaults to now)
 * @returns Promise resolving to the count
 */
export async function countDueReviews(
  currentTime: number = Date.now()
): Promise<number> {
  const dueReviews = await getDueReviews(currentTime);
  return dueReviews.length;
}

/**
 * Gets the count of vocabulary words due for review
 * Includes words that have never been reviewed (no review record)
 * and words that have a review record with nextReviewDate <= now
 * 
 * @returns Promise resolving to the count of words due for review
 */
export async function getDueForReviewCount(): Promise<number> {
  try {
    // Import vocabulary functions to avoid circular dependency
    const { getAllVocabularyWords } = await import('./vocabulary');
    
    const allWords = await getAllVocabularyWords();
    const allReviews = await getAllReviews();
    
    // Create a map of vocabId -> review record
    const reviewMap = new Map(allReviews.map(r => [r.vocabId, r]));
    
    // Count words that are either:
    // 1. Never reviewed (no review record)
    // 2. Due for review (nextReviewDate <= now)
    const now = Date.now();
    let dueCount = 0;
    
    for (const word of allWords) {
      const review = reviewMap.get(word.id);
      if (!review || review.nextReviewDate <= now) {
        dueCount++;
      }
    }
    
    return dueCount;
  } catch (error) {
    console.error('Error getting due for review count:', error);
    return 0;
  }
}

