/**
 * Advanced filtering and search utilities for vocabulary management
 * Provides flexible filtering with multiple criteria and sorting options
 */

import type { VocabularyWord, VocabularyStatus } from '@/lib/types';
import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';
import { getReviewByVocabId } from '@/lib/db/reviews';

/**
 * Filter criteria for vocabulary search
 */
export interface VocabularyFilterCriteria {
  /** Search query for Spanish or English text */
  searchQuery?: string;
  
  /** Filter by vocabulary status */
  statuses?: VocabularyStatus[];
  
  /** Filter by tags (OR logic - any tag matches) */
  tags?: string[];
  
  /** Require all tags (AND logic) */
  requireAllTags?: boolean;
  
  /** Filter by part of speech */
  partsOfSpeech?: string[];
  
  /** Filter by gender */
  genders?: ('masculine' | 'feminine' | 'neutral')[];
  
  /** Filter by date added (range) */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  
  /** Filter by last updated (range) */
  updatedRange?: {
    start?: Date;
    end?: Date;
  };
  
  /** Filter words with/without notes */
  hasNotes?: boolean;
  
  /** Filter words with/without examples */
  hasExamples?: boolean;
  
  /** Filter words with/without images */
  hasImages?: boolean;
  
  /** Filter words with/without audio */
  hasAudio?: boolean;
  
  /** Filter by review accuracy (weak words) */
  accuracyThreshold?: {
    min?: number; // 0-1
    max?: number; // 0-1
  };
  
  /** Filter by review count */
  reviewCountRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Sort options for vocabulary results
 */
export type VocabularySortBy =
  | 'word-asc'
  | 'word-desc'
  | 'translation-asc'
  | 'translation-desc'
  | 'created-newest'
  | 'created-oldest'
  | 'updated-newest'
  | 'updated-oldest'
  | 'status-asc'
  | 'status-desc'
  | 'accuracy-lowest'
  | 'accuracy-highest';

/**
 * Word with review metadata for filtering and sorting
 */
interface WordWithMetadata extends VocabularyWord {
  accuracy?: number;
  reviewCount?: number;
}

/**
 * Filters vocabulary words based on multiple criteria
 * Supports complex queries with combined filters
 * 
 * @param criteria - Filter criteria object
 * @param sortBy - Optional sort order
 * @returns Promise resolving to filtered words
 */
export async function filterVocabulary(
  criteria: VocabularyFilterCriteria,
  sortBy?: VocabularySortBy
): Promise<VocabularyWord[]> {
  const db = await getDB();
  let words: WordWithMetadata[] = [];
  
  // Start with most restrictive filter if available
  if (criteria.statuses && criteria.statuses.length > 0) {
    // Get words by status (indexed query)
    const wordsByStatus = await Promise.all(
      criteria.statuses.map((status) =>
        db.getAllFromIndex(DB_CONFIG.STORES.VOCABULARY, 'by-status', status)
      )
    );
    words = wordsByStatus.flat();
  } else if (criteria.tags && criteria.tags.length > 0) {
    // Get words by tags (indexed query)
    if (criteria.requireAllTags) {
      // AND logic - must have all tags
      const allWords = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
      words = allWords.filter((word) =>
        criteria.tags!.every((tag) => word.tags.includes(tag))
      );
    } else {
      // OR logic - any tag matches
      const wordsByTag = await Promise.all(
        criteria.tags.map((tag) =>
          db.getAllFromIndex(DB_CONFIG.STORES.VOCABULARY, 'by-tags', tag)
        )
      );
      // Deduplicate
      const wordMap = new Map<string, VocabularyWord>();
      wordsByTag.flat().forEach((word) => {
        if (!wordMap.has(word.id)) {
          wordMap.set(word.id, word);
        }
      });
      words = Array.from(wordMap.values());
    }
  } else {
    // Get all words
    words = await db.getAll(DB_CONFIG.STORES.VOCABULARY);
  }
  
  // Apply search query filter
  if (criteria.searchQuery && criteria.searchQuery.trim()) {
    const query = criteria.searchQuery.toLowerCase().trim();
    words = words.filter(
      (word) =>
        word.spanishWord.toLowerCase().includes(query) ||
        word.englishTranslation.toLowerCase().includes(query) ||
        word.notes?.toLowerCase().includes(query) ||
        word.examples.some(
          (ex) =>
            ex.spanish.toLowerCase().includes(query) ||
            ex.english.toLowerCase().includes(query)
        )
    );
  }
  
  // Apply part of speech filter
  if (criteria.partsOfSpeech && criteria.partsOfSpeech.length > 0) {
    words = words.filter(
      (word) =>
        word.partOfSpeech &&
        criteria.partsOfSpeech!.includes(word.partOfSpeech)
    );
  }
  
  // Apply gender filter
  if (criteria.genders && criteria.genders.length > 0) {
    words = words.filter(
      (word) => word.gender && criteria.genders!.includes(word.gender)
    );
  }
  
  // Apply date range filter
  if (criteria.dateRange) {
    if (criteria.dateRange.start) {
      const startTime = criteria.dateRange.start.getTime();
      words = words.filter((word) => word.createdAt >= startTime);
    }
    if (criteria.dateRange.end) {
      const endTime = criteria.dateRange.end.getTime();
      words = words.filter((word) => word.createdAt <= endTime);
    }
  }
  
  // Apply updated range filter
  if (criteria.updatedRange) {
    if (criteria.updatedRange.start) {
      const startTime = criteria.updatedRange.start.getTime();
      words = words.filter((word) => word.updatedAt >= startTime);
    }
    if (criteria.updatedRange.end) {
      const endTime = criteria.updatedRange.end.getTime();
      words = words.filter((word) => word.updatedAt <= endTime);
    }
  }
  
  // Apply content filters
  if (criteria.hasNotes !== undefined) {
    words = words.filter((word) =>
      criteria.hasNotes
        ? word.notes && word.notes.trim().length > 0
        : !word.notes || word.notes.trim().length === 0
    );
  }
  
  if (criteria.hasExamples !== undefined) {
    words = words.filter((word) =>
      criteria.hasExamples
        ? word.examples && word.examples.length > 0
        : !word.examples || word.examples.length === 0
    );
  }
  
  if (criteria.hasImages !== undefined) {
    words = words.filter((word) =>
      criteria.hasImages
        ? word.images && word.images.length > 0
        : !word.images || word.images.length === 0
    );
  }
  
  if (criteria.hasAudio !== undefined) {
    words = words.filter((word) =>
      criteria.hasAudio
        ? word.audioUrl ||
          (word.audioPronunciations && word.audioPronunciations.length > 0)
        : !word.audioUrl &&
          (!word.audioPronunciations || word.audioPronunciations.length === 0)
    );
  }
  
  // Apply review-based filters (requires fetching review records)
  if (
    criteria.accuracyThreshold ||
    criteria.reviewCountRange ||
    sortBy === 'accuracy-lowest' ||
    sortBy === 'accuracy-highest'
  ) {
    // Fetch review records for all words
    const wordsWithReviews = await Promise.all(
      words.map(async (word) => {
        const review = await getReviewByVocabId(word.id);
        if (review) {
          const accuracy =
            review.totalReviews > 0
              ? review.correctCount / review.totalReviews
              : 0;
          return { ...word, accuracy, reviewCount: review.totalReviews };
        }
        return { ...word, accuracy: 0, reviewCount: 0 };
      })
    );
    
    words = wordsWithReviews;
    
    // Apply accuracy threshold filter
    if (criteria.accuracyThreshold) {
      if (criteria.accuracyThreshold.min !== undefined) {
        words = words.filter(
          (word) => (word.accuracy || 0) >= criteria.accuracyThreshold!.min!
        );
      }
      if (criteria.accuracyThreshold.max !== undefined) {
        words = words.filter(
          (word) => (word.accuracy || 0) <= criteria.accuracyThreshold!.max!
        );
      }
    }
    
    // Apply review count range filter
    if (criteria.reviewCountRange) {
      if (criteria.reviewCountRange.min !== undefined) {
        words = words.filter(
          (word) => (word.reviewCount || 0) >= criteria.reviewCountRange!.min!
        );
      }
      if (criteria.reviewCountRange.max !== undefined) {
        words = words.filter(
          (word) => (word.reviewCount || 0) <= criteria.reviewCountRange!.max!
        );
      }
    }
  }
  
  // Apply sorting
  if (sortBy) {
    words = sortVocabulary(words, sortBy);
  }
  
  return words;
}

/**
 * Sorts vocabulary words by specified criteria
 * 
 * @param words - Array of words to sort
 * @param sortBy - Sort order
 * @returns Sorted array of words
 */
export function sortVocabulary(
  words: WordWithMetadata[],
  sortBy: VocabularySortBy
): WordWithMetadata[] {
  const sorted = [...words];
  
  switch (sortBy) {
    case 'word-asc':
      return sorted.sort((a, b) =>
        a.spanishWord.toLowerCase().localeCompare(b.spanishWord.toLowerCase())
      );
    
    case 'word-desc':
      return sorted.sort((a, b) =>
        b.spanishWord.toLowerCase().localeCompare(a.spanishWord.toLowerCase())
      );
    
    case 'translation-asc':
      return sorted.sort((a, b) =>
        a.englishTranslation
          .toLowerCase()
          .localeCompare(b.englishTranslation.toLowerCase())
      );
    
    case 'translation-desc':
      return sorted.sort((a, b) =>
        b.englishTranslation
          .toLowerCase()
          .localeCompare(a.englishTranslation.toLowerCase())
      );
    
    case 'created-newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    
    case 'created-oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    
    case 'updated-newest':
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    
    case 'updated-oldest':
      return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
    
    case 'status-asc':
      const statusOrder = { new: 0, learning: 1, mastered: 2 };
      return sorted.sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status]
      );
    
    case 'status-desc':
      const statusOrderDesc = { mastered: 0, learning: 1, new: 2 };
      return sorted.sort(
        (a, b) => statusOrderDesc[a.status] - statusOrderDesc[b.status]
      );
    
    case 'accuracy-lowest':
      return sorted.sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0));
    
    case 'accuracy-highest':
      return sorted.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
    
    default:
      return sorted;
  }
}

/**
 * Quick filter presets for common use cases
 */
export const FILTER_PRESETS = {
  /** Words needing review */
  needsReview: (): VocabularyFilterCriteria => ({
    statuses: ['new', 'learning'],
  }),
  
  /** Weak words (low accuracy) */
  weakWords: (threshold = 0.7): VocabularyFilterCriteria => ({
    accuracyThreshold: { max: threshold },
    reviewCountRange: { min: 3 }, // At least 3 reviews to be meaningful
  }),
  
  /** Recently added words */
  recentlyAdded: (days = 7): VocabularyFilterCriteria => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
      dateRange: { start },
    };
  },
  
  /** Words with no notes */
  needsNotes: (): VocabularyFilterCriteria => ({
    hasNotes: false,
  }),
  
  /** Incomplete words (missing examples or audio) */
  incomplete: (): VocabularyFilterCriteria => ({
    hasExamples: false,
  }),
  
  /** Mastered words */
  mastered: (): VocabularyFilterCriteria => ({
    statuses: ['mastered'],
  }),
};

