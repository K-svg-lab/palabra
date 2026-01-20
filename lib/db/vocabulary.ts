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
 * @param includeDeleted - Include soft-deleted items (for sync purposes)
 * @returns Promise resolving to array of all words
 */
export async function getAllVocabularyWords(includeDeleted: boolean = false): Promise<VocabularyWord[]> {
  const db = await getDB();
  const words = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  
  // #region agent log
  const deletedCount = words.filter(word => word.isDeleted).length;
  fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:76',message:'getAllVocabularyWords called',data:{totalCount:words.length,deletedCount,includeDeleted,willReturnCount:includeDeleted?words.length:words.length-deletedCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  // Filter out soft-deleted items unless explicitly requested
  if (!includeDeleted) {
    return words.filter(word => !word.isDeleted);
  }
  
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
 * Deletes a vocabulary word (soft delete for sync support)
 * Marks the word as deleted instead of removing it, so sync can detect and upload the deletion
 * 
 * @param id - The word ID to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteVocabularyWord(id: string): Promise<void> {
  const db = await getDB();
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:122',message:'deleteVocabularyWord called',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  // Get the existing word
  const existingWord = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
  if (!existingWord) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:130',message:'deleteVocabularyWord - word not found',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    // Word doesn't exist, nothing to delete
    return;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:138',message:'deleteVocabularyWord - word found, marking as deleted',data:{id,spanishWord:existingWord.spanishWord,wasAlreadyDeleted:existingWord.isDeleted},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  // Soft delete: mark as deleted and update timestamp
  // This allows sync to detect the deletion and upload it to the server
  const deletedWord: VocabularyWord = {
    ...existingWord,
    isDeleted: true,
    updatedAt: Date.now(),
  };
  
  await db.put(DB_CONFIG.STORES.VOCABULARY, deletedWord);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vocabulary.ts:154',message:'deleteVocabularyWord - marked as deleted in IndexedDB',data:{id,spanishWord:deletedWord.spanishWord,isDeleted:deletedWord.isDeleted,updatedAt:deletedWord.updatedAt},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  // Delete associated review record locally
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

