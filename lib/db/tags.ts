/**
 * Tag management operations for vocabulary organization
 * Provides CRUD operations and utilities for custom tags
 */

import { getDB } from './schema';
import { DB_CONFIG } from '@/lib/constants/app';
import type { VocabularyWord } from '@/lib/types';

/**
 * Tag statistics interface
 */
export interface TagStats {
  /** Tag name */
  tag: string;
  /** Number of words with this tag */
  count: number;
  /** Most recent word with this tag */
  lastUsed?: number;
}

/**
 * Retrieves all unique tags from the vocabulary
 * Returns tags sorted alphabetically
 * 
 * @returns Promise resolving to array of tag names
 */
export async function getAllTags(): Promise<string[]> {
  const db = await getDB();
  const allWords = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  
  // Collect all unique tags
  const tagSet = new Set<string>();
  allWords.forEach((word) => {
    word.tags?.forEach((tag: string) => tagSet.add(tag));
  });
  
  // Return sorted array
  return Array.from(tagSet).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}

/**
 * Retrieves tag statistics (tag name and count)
 * Returns tags sorted by count (descending) or alphabetically
 * 
 * @param sortBy - Sort by 'count' or 'alphabetical'
 * @returns Promise resolving to array of tag stats
 */
export async function getTagStats(
  sortBy: 'count' | 'alphabetical' = 'count'
): Promise<TagStats[]> {
  const db = await getDB();
  const allWords = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  
  // Build tag statistics
  const tagMap = new Map<string, TagStats>();
  
  allWords.forEach((word) => {
    word.tags?.forEach((tag: string) => {
      const existing = tagMap.get(tag);
      if (existing) {
        existing.count++;
        if (word.updatedAt > (existing.lastUsed || 0)) {
          existing.lastUsed = word.updatedAt;
        }
      } else {
        tagMap.set(tag, {
          tag,
          count: 1,
          lastUsed: word.updatedAt,
        });
      }
    });
  });
  
  // Convert to array and sort
  const stats = Array.from(tagMap.values());
  
  if (sortBy === 'count') {
    return stats.sort((a, b) => b.count - a.count);
  } else {
    return stats.sort((a, b) =>
      a.tag.toLowerCase().localeCompare(b.tag.toLowerCase())
    );
  }
}

/**
 * Retrieves vocabulary words by tag
 * Uses indexed query for efficient retrieval
 * 
 * @param tag - Tag name to filter by
 * @returns Promise resolving to array of words with this tag
 */
export async function getVocabularyByTag(
  tag: string
): Promise<VocabularyWord[]> {
  const db = await getDB();
  return db.getAllFromIndex(
    DB_CONFIG.STORES.VOCABULARY,
    'by-tags',
    tag
  );
}

/**
 * Retrieves vocabulary words by multiple tags (AND logic)
 * Returns words that have ALL specified tags
 * 
 * @param tags - Array of tag names
 * @returns Promise resolving to array of words with all tags
 */
export async function getVocabularyByAllTags(
  tags: string[]
): Promise<VocabularyWord[]> {
  if (tags.length === 0) {
    return [];
  }
  
  const db = await getDB();
  const allWords = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  
  return allWords.filter((word) =>
    tags.every((tag) => word.tags.includes(tag))
  );
}

/**
 * Retrieves vocabulary words by multiple tags (OR logic)
 * Returns words that have ANY of the specified tags
 * 
 * @param tags - Array of tag names
 * @returns Promise resolving to array of words with any tag
 */
export async function getVocabularyByAnyTag(
  tags: string[]
): Promise<VocabularyWord[]> {
  if (tags.length === 0) {
    return [];
  }
  
  const db = await getDB();
  
  // Use index to fetch words for each tag
  const wordSets = await Promise.all(
    tags.map((tag: string) =>
      db.getAllFromIndex(DB_CONFIG.STORES.VOCABULARY, 'by-tags', tag)
    )
  );
  
  // Combine and deduplicate
  const wordMap = new Map<string, VocabularyWord>();
  wordSets.forEach((words) => {
    words.forEach((word) => {
      if (!wordMap.has(word.id)) {
        wordMap.set(word.id, word);
      }
    });
  });
  
  return Array.from(wordMap.values());
}

/**
 * Adds tags to a vocabulary word
 * Deduplicates and sorts tags
 * 
 * @param wordId - Word ID
 * @param newTags - Tags to add
 * @returns Promise resolving to updated word
 */
export async function addTagsToWord(
  wordId: string,
  newTags: string[]
): Promise<VocabularyWord> {
  const db = await getDB();
  const word = await db.get(DB_CONFIG.STORES.VOCABULARY, wordId);
  
  if (!word) {
    throw new Error(`Word with ID ${wordId} not found`);
  }
  
  // Combine existing and new tags, deduplicate, and sort
  const tagSet = new Set([...word.tags, ...newTags]);
  word.tags = Array.from(tagSet).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  
  word.updatedAt = Date.now();
  
  await db.put(DB_CONFIG.STORES.VOCABULARY, word);
  
  return word;
}

/**
 * Removes tags from a vocabulary word
 * 
 * @param wordId - Word ID
 * @param tagsToRemove - Tags to remove
 * @returns Promise resolving to updated word
 */
export async function removeTagsFromWord(
  wordId: string,
  tagsToRemove: string[]
): Promise<VocabularyWord> {
  const db = await getDB();
  const word = await db.get(DB_CONFIG.STORES.VOCABULARY, wordId);
  
  if (!word) {
    throw new Error(`Word with ID ${wordId} not found`);
  }
  
  // Filter out removed tags
  word.tags = word.tags.filter((tag: string) => !tagsToRemove.includes(tag));
  word.updatedAt = Date.now();
  
  await db.put(DB_CONFIG.STORES.VOCABULARY, word);
  
  return word;
}

/**
 * Renames a tag across all vocabulary words
 * 
 * @param oldTag - Current tag name
 * @param newTag - New tag name
 * @returns Promise resolving to number of words updated
 */
export async function renameTag(
  oldTag: string,
  newTag: string
): Promise<number> {
  if (oldTag === newTag) {
    return 0;
  }
  
  const db = await getDB();
  const wordsWithTag = await getVocabularyByTag(oldTag);
  
  let updateCount = 0;
  
  for (const word of wordsWithTag) {
    // Replace old tag with new tag
    if (word.tags) {
      word.tags = word.tags.map((tag: string) => (tag === oldTag ? newTag : tag));
      // Deduplicate and sort
      word.tags = Array.from(new Set(word.tags)).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      word.updatedAt = Date.now();
      
      await db.put(DB_CONFIG.STORES.VOCABULARY, word);
      updateCount++;
    }
  }
  
  return updateCount;
}

/**
 * Deletes a tag from all vocabulary words
 * 
 * @param tag - Tag to delete
 * @returns Promise resolving to number of words updated
 */
export async function deleteTag(tag: string): Promise<number> {
  const db = await getDB();
  const wordsWithTag = await getVocabularyByTag(tag);
  
  let updateCount = 0;
  
  for (const word of wordsWithTag) {
    if (word.tags) {
      word.tags = word.tags.filter((t) => t !== tag);
      word.updatedAt = Date.now();
      
      await db.put(DB_CONFIG.STORES.VOCABULARY, word);
      updateCount++;
    }
  }
  
  return updateCount;
}

/**
 * Merges multiple tags into one
 * All words with any of the source tags will be tagged with the target tag
 * 
 * @param sourceTags - Tags to merge from
 * @param targetTag - Tag to merge into
 * @returns Promise resolving to number of words updated
 */
export async function mergeTags(
  sourceTags: string[],
  targetTag: string
): Promise<number> {
  const wordsToUpdate = await getVocabularyByAnyTag(sourceTags);
  
  const db = await getDB();
  let updateCount = 0;
  
  for (const word of wordsToUpdate) {
    // Remove source tags and add target tag
    if (word.tags) {
      word.tags = word.tags.filter((tag: string) => !sourceTags.includes(tag));
      if (!word.tags.includes(targetTag)) {
        word.tags.push(targetTag);
      }
      // Sort tags
      word.tags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      word.updatedAt = Date.now();
      
      await db.put(DB_CONFIG.STORES.VOCABULARY, word);
      updateCount++;
    }
  }
  
  return updateCount;
}

