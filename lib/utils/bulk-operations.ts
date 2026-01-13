/**
 * Bulk operations for vocabulary management
 * Provides efficient batch editing, deletion, and export of vocabulary words
 */

import type { VocabularyWord, VocabularyStatus } from '@/lib/types';
import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';
import { deleteReviewByVocabId } from '@/lib/db/reviews';

/**
 * Bulk edit operations that can be applied to multiple words
 */
export interface BulkEditOperation {
  /** Add tags to words */
  addTags?: string[];
  
  /** Remove tags from words */
  removeTags?: string[];
  
  /** Replace all tags with new tags */
  replaceTags?: string[];
  
  /** Update status */
  setStatus?: VocabularyStatus;
  
  /** Add notes (append to existing) */
  appendNotes?: string;
  
  /** Replace notes */
  replaceNotes?: string;
  
  /** Clear notes */
  clearNotes?: boolean;
}

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  /** Number of words successfully processed */
  successCount: number;
  
  /** Number of words that failed */
  failureCount: number;
  
  /** IDs of words that failed */
  failedIds: string[];
  
  /** Error messages for failures */
  errors: Array<{ id: string; error: string }>;
}

/**
 * Applies bulk edit operations to multiple vocabulary words
 * Updates timestamp for all modified words
 * 
 * @param wordIds - Array of word IDs to edit
 * @param operations - Edit operations to apply
 * @returns Promise resolving to operation result
 */
export async function bulkEditWords(
  wordIds: string[],
  operations: BulkEditOperation
): Promise<BulkOperationResult> {
  const db = await getDB();
  const result: BulkOperationResult = {
    successCount: 0,
    failureCount: 0,
    failedIds: [],
    errors: [],
  };
  
  for (const id of wordIds) {
    try {
      const word = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
      
      if (!word) {
        throw new Error('Word not found');
      }
      
      // Apply tag operations
      if (operations.addTags) {
        const tagSet = new Set([...word.tags, ...operations.addTags]);
        word.tags = Array.from(tagSet).sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
      }
      
      if (operations.removeTags) {
        word.tags = word.tags.filter(
          (tag: string) => !operations.removeTags!.includes(tag)
        );
      }
      
      if (operations.replaceTags) {
        word.tags = [...operations.replaceTags].sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
      }
      
      // Apply status update
      if (operations.setStatus) {
        word.status = operations.setStatus;
      }
      
      // Apply notes operations
      if (operations.clearNotes) {
        word.notes = undefined;
      } else if (operations.replaceNotes !== undefined) {
        word.notes = operations.replaceNotes;
      } else if (operations.appendNotes) {
        word.notes = word.notes
          ? `${word.notes}\n\n${operations.appendNotes}`
          : operations.appendNotes;
      }
      
      // Update timestamp
      word.updatedAt = Date.now();
      
      // Save updated word
      await db.put(DB_CONFIG.STORES.VOCABULARY, word);
      
      result.successCount++;
    } catch (error) {
      result.failureCount++;
      result.failedIds.push(id);
      result.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

/**
 * Deletes multiple vocabulary words and their review records
 * 
 * @param wordIds - Array of word IDs to delete
 * @returns Promise resolving to operation result
 */
export async function bulkDeleteWords(
  wordIds: string[]
): Promise<BulkOperationResult> {
  const db = await getDB();
  const result: BulkOperationResult = {
    successCount: 0,
    failureCount: 0,
    failedIds: [],
    errors: [],
  };
  
  for (const id of wordIds) {
    try {
      // Delete vocabulary word
      await db.delete(DB_CONFIG.STORES.VOCABULARY, id);
      
      // Delete associated review record
      try {
        await deleteReviewByVocabId(id);
      } catch (error) {
        // Review record might not exist, that's okay
        console.warn(`Failed to delete review record for ${id}:`, error);
      }
      
      result.successCount++;
    } catch (error) {
      result.failureCount++;
      result.failedIds.push(id);
      result.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

/**
 * Exports multiple vocabulary words to a structured format
 * Includes all word data for backup or transfer
 * 
 * @param wordIds - Array of word IDs to export
 * @returns Promise resolving to array of words
 */
export async function bulkExportWords(
  wordIds: string[]
): Promise<VocabularyWord[]> {
  const db = await getDB();
  const words: VocabularyWord[] = [];
  
  for (const id of wordIds) {
    const word = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
    if (word) {
      words.push(word);
    }
  }
  
  return words;
}

/**
 * Duplicates vocabulary words with new IDs
 * Useful for creating variations or templates
 * 
 * @param wordIds - Array of word IDs to duplicate
 * @returns Promise resolving to operation result and new word IDs
 */
export async function bulkDuplicateWords(
  wordIds: string[]
): Promise<BulkOperationResult & { newIds: string[] }> {
  const db = await getDB();
  const result: BulkOperationResult & { newIds: string[] } = {
    successCount: 0,
    failureCount: 0,
    failedIds: [],
    errors: [],
    newIds: [],
  };
  
  // Import dynamically to avoid circular dependency
  const { createVocabularyWord } = await import('@/lib/db/vocabulary');
  
  for (const id of wordIds) {
    try {
      const word = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
      
      if (!word) {
        throw new Error('Word not found');
      }
      
      // Create duplicate with new ID
      const newId = `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const duplicate: VocabularyWord = {
        ...word,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'new', // Reset status for duplicate
        tags: [...word.tags], // Clone tags array
      };
      
      await createVocabularyWord(duplicate);
      
      result.successCount++;
      result.newIds.push(newId);
    } catch (error) {
      result.failureCount++;
      result.failedIds.push(id);
      result.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

/**
 * Validates vocabulary words for completeness
 * Checks for missing required fields and returns validation results
 * 
 * @param wordIds - Array of word IDs to validate
 * @returns Promise resolving to validation results
 */
export async function bulkValidateWords(
  wordIds: string[]
): Promise<
  Array<{
    id: string;
    isValid: boolean;
    issues: string[];
  }>
> {
  const db = await getDB();
  const results: Array<{
    id: string;
    isValid: boolean;
    issues: string[];
  }> = [];
  
  for (const id of wordIds) {
    const word = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
    
    if (!word) {
      results.push({
        id,
        isValid: false,
        issues: ['Word not found'],
      });
      continue;
    }
    
    const issues: string[] = [];
    
    // Check required fields
    if (!word.spanishWord || word.spanishWord.trim().length === 0) {
      issues.push('Missing Spanish word');
    }
    
    if (
      !word.englishTranslation ||
      word.englishTranslation.trim().length === 0
    ) {
      issues.push('Missing English translation');
    }
    
    // Check recommended fields
    if (!word.examples || word.examples.length === 0) {
      issues.push('No example sentences');
    }
    
    if (
      !word.audioUrl &&
      (!word.audioPronunciations || word.audioPronunciations.length === 0)
    ) {
      issues.push('No audio pronunciation');
    }
    
    if (!word.partOfSpeech) {
      issues.push('Missing part of speech');
    }
    
    if (
      word.partOfSpeech === 'noun' &&
      word.gender !== 'masculine' &&
      word.gender !== 'feminine'
    ) {
      issues.push('Noun missing gender classification');
    }
    
    results.push({
      id,
      isValid: issues.length === 0,
      issues,
    });
  }
  
  return results;
}

/**
 * Progress callback for long-running bulk operations
 */
export type BulkProgressCallback = (
  current: number,
  total: number,
  currentId: string
) => void;

/**
 * Applies a custom transformation function to multiple words
 * Useful for complex bulk operations not covered by standard operations
 * 
 * @param wordIds - Array of word IDs to transform
 * @param transformer - Function to transform each word
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to operation result
 */
export async function bulkTransform(
  wordIds: string[],
  transformer: (word: VocabularyWord) => VocabularyWord | Promise<VocabularyWord>,
  onProgress?: BulkProgressCallback
): Promise<BulkOperationResult> {
  const db = await getDB();
  const result: BulkOperationResult = {
    successCount: 0,
    failureCount: 0,
    failedIds: [],
    errors: [],
  };
  
  for (let i = 0; i < wordIds.length; i++) {
    const id = wordIds[i];
    
    if (onProgress) {
      onProgress(i + 1, wordIds.length, id);
    }
    
    try {
      const word = await db.get(DB_CONFIG.STORES.VOCABULARY, id);
      
      if (!word) {
        throw new Error('Word not found');
      }
      
      // Apply transformation
      const transformed = await transformer(word);
      transformed.updatedAt = Date.now();
      
      // Save transformed word
      await db.put(DB_CONFIG.STORES.VOCABULARY, transformed);
      
      result.successCount++;
    } catch (error) {
      result.failureCount++;
      result.failedIds.push(id);
      result.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

