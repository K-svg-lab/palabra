/**
 * Vocabulary database operations
 * CRUD operations for managing vocabulary words in IndexedDB
 */

import { getDB } from './schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { VocabularyWord, VocabularyStatus } from '@/lib/types';
import { createInitialReviewRecord } from '@/lib/utils/spaced-repetition';
import { createReviewRecord } from './reviews';
import { incrementNewWordsAdded } from './stats';

/**
 * Creates a new vocabulary word in the database
 * Automatically initializes a review record for spaced repetition
 * 
 * @param word - The vocabulary word to create
 * @returns Promise resolving to the created word
 */
export async function createVocabularyWord(
  word: VocabularyWord
): Promise<VocabularyWord> {
  const db = await getDB();
  
  // Add vocabulary word to database
  await db.add(DB_CONFIG.STORES.VOCABULARY, word);
  
  // Initialize review record for spaced repetition
  // New words are immediately available for review
  try {
    const reviewRecord = createInitialReviewRecord(word.id, Date.now());
    await createReviewRecord(reviewRecord);
  } catch (error) {
    console.error('Failed to create initial review record:', error);
    // Don't fail vocabulary creation if review record fails
    // Review record will be created on first review if missing
  }
  
  // Update daily stats - increment new words added today
  try {
    console.log('📝 Word created, updating daily stats...');
    await incrementNewWordsAdded();
    console.log('✅ Daily stats updated successfully');
  } catch (error) {
    console.error('❌ Failed to update daily stats:', error);
    // Don't fail vocabulary creation if stats update fails
  }
  
  return word;
}

/**
 * Retrieves a vocabulary word by ID
 * 
 * @param id - The word ID
 * @returns Promise resolving to the word or undefined if not found
 */
export async function getVocabularyWord(
  id: string
): Promise<VocabularyWord | undefined> {
  const db = await getDB();
  return db.get(DB_CONFIG.STORES.VOCABULARY, id);
}

/**
 * Retrieves all vocabulary words
 * 
 * @returns Promise resolving to array of all words
 */
export async function getAllVocabularyWords(): Promise<VocabularyWord[]> {
  const db = await getDB();
  const words = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  // #region agent log H1
  fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:72',message:'getAllVocabularyWords called',data:{total:words.length,statuses:words.map(w=>({spanish:w.spanish||w.spanishWord,status:w.status}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'status-fix'})}).catch(()=>{});
  // #endregion
  return words;
}

/**
 * Retrieves vocabulary words by status
 * 
 * @param status - The vocabulary status to filter by
 * @returns Promise resolving to array of matching words
 */
export async function getVocabularyWordsByStatus(
  status: VocabularyStatus
): Promise<VocabularyWord[]> {
  const db = await getDB();
  return db.getAllFromIndex(
    DB_CONFIG.STORES.VOCABULARY,
    'by-status',
    status
  );
}

/**
 * Updates an existing vocabulary word
 * 
 * @param word - The updated word data
 * @returns Promise resolving to the updated word
 */
export async function updateVocabularyWord(
  word: VocabularyWord
): Promise<VocabularyWord> {
  const db = await getDB();
  await db.put(DB_CONFIG.STORES.VOCABULARY, word);
  return word;
}

/**
 * Deletes a vocabulary word and its associated review record
 * 
 * @param id - The word ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteVocabularyWord(id: string): Promise<void> {
  const db = await getDB();
  
  // Delete vocabulary word
  await db.delete(DB_CONFIG.STORES.VOCABULARY, id);
  
  // Delete associated review record
  // Import dynamically to avoid circular dependency
  const { deleteReviewByVocabId } = await import('./reviews');
  try {
    await deleteReviewByVocabId(id);
  } catch (error) {
    console.error('Failed to delete review record:', error);
    // Don't fail vocabulary deletion if review deletion fails
  }
}

/**
 * Searches vocabulary words by Spanish or English text
 * Case-insensitive partial matching
 * 
 * @param query - Search query string
 * @returns Promise resolving to array of matching words
 */
export async function searchVocabulary(
  query: string
): Promise<VocabularyWord[]> {
  const db = await getDB();
  const allWords = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  
  const lowerQuery = query.toLowerCase().trim();
  
  return allWords.filter(
    (word) =>
      word.spanishWord.toLowerCase().includes(lowerQuery) ||
      word.englishTranslation.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Counts total vocabulary words
 * 
 * @returns Promise resolving to the count
 */
export async function countVocabulary(): Promise<number> {
  const db = await getDB();
  return db.count(DB_CONFIG.STORES.VOCABULARY);
}

/**
 * Counts vocabulary words by status
 * 
 * @param status - The status to count
 * @returns Promise resolving to the count
 */
export async function countVocabularyByStatus(
  status: VocabularyStatus
): Promise<number> {
  const db = await getDB();
  return db.countFromIndex(
    DB_CONFIG.STORES.VOCABULARY,
    'by-status',
    status
  );
}

