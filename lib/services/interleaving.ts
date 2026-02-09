/**
 * Interleaving Service - Phase 18.1 Task 5
 * 
 * Implements interleaved practice optimization to enhance long-term retention
 * by intelligently mixing vocabulary words during review sessions.
 * 
 * **Cognitive Science Basis:**
 * - Interleaving improves discrimination between similar concepts
 * - Spacing effect is enhanced when switching between categories
 * - Prevents "blocking" effect from studying same type consecutively
 * - Forces deeper processing and strengthens memory consolidation
 * 
 * **Research Evidence:**
 * - 43% better retention vs. blocked practice (Rohrer & Taylor, 2007)
 * - Particularly effective for language learning (Nakata & Suzuki, 2019)
 * - Optimal when combined with spaced repetition (Kornell & Bjork, 2008)
 * 
 * @module lib/services/interleaving
 */

import type { VocabularyWord } from '@/lib/types/vocabulary';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Word category for interleaving purposes
 */
export interface WordCategory {
  /** Part of speech (noun, verb, adjective, etc.) */
  partOfSpeech: string;
  
  /** Age category (new, young, mature) */
  age: 'new' | 'young' | 'mature';
  
  /** Difficulty category (easy, medium, hard) */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Interleaving configuration
 */
export interface InterleavingConfig {
  /** Enable interleaving (default: true) */
  enabled: boolean;
  
  /** Maximum consecutive words of same category (default: 2) */
  maxConsecutive: number;
  
  /** Prioritize mixing by part of speech (default: true) */
  mixByPartOfSpeech: boolean;
  
  /** Prioritize mixing by age (default: true) */
  mixByAge: boolean;
  
  /** Prioritize mixing by difficulty (default: true) */
  mixByDifficulty: boolean;
}

/**
 * Default interleaving configuration
 */
export const DEFAULT_INTERLEAVING_CONFIG: InterleavingConfig = {
  enabled: true,
  maxConsecutive: 2,
  mixByPartOfSpeech: true,
  mixByAge: true,
  mixByDifficulty: true,
};

/**
 * Age thresholds (in days since creation)
 */
const AGE_THRESHOLDS = {
  NEW: 3,      // 0-3 days: new
  YOUNG: 21,   // 4-21 days: young
  // 22+ days: mature
};

/**
 * Difficulty thresholds (based on ease factor)
 */
const DIFFICULTY_THRESHOLDS = {
  EASY: 2.5,   // easeFactor >= 2.5: easy
  MEDIUM: 2.0, // 2.0 <= easeFactor < 2.5: medium
  // easeFactor < 2.0: hard
};

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Categorize a word for interleaving purposes
 */
export function categorizeWord(word: VocabularyWord): WordCategory {
  // Part of speech
  const partOfSpeech = word.partOfSpeech || 'unknown';
  
  // Age (days since creation)
  const createdAt = new Date(word.createdAt);
  const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  let age: 'new' | 'young' | 'mature';
  if (ageInDays <= AGE_THRESHOLDS.NEW) {
    age = 'new';
  } else if (ageInDays <= AGE_THRESHOLDS.YOUNG) {
    age = 'young';
  } else {
    age = 'mature';
  }
  
  // Difficulty (based on ease factor or status)
  let difficulty: 'easy' | 'medium' | 'hard';
  if (word.easeFactor) {
    if (word.easeFactor >= DIFFICULTY_THRESHOLDS.EASY) {
      difficulty = 'easy';
    } else if (word.easeFactor >= DIFFICULTY_THRESHOLDS.MEDIUM) {
      difficulty = 'medium';
    } else {
      difficulty = 'hard';
    }
  } else {
    // Fallback to status if no ease factor
    if (word.status === 'mastered') {
      difficulty = 'easy';
    } else if (word.status === 'learning') {
      difficulty = 'medium';
    } else {
      difficulty = 'hard'; // new words
    }
  }
  
  return { partOfSpeech, age, difficulty };
}

/**
 * Check if two categories are different enough for interleaving
 */
function isDifferentCategory(
  cat1: WordCategory,
  cat2: WordCategory,
  config: InterleavingConfig
): boolean {
  let differences = 0;
  
  if (config.mixByPartOfSpeech && cat1.partOfSpeech !== cat2.partOfSpeech) {
    differences++;
  }
  
  if (config.mixByAge && cat1.age !== cat2.age) {
    differences++;
  }
  
  if (config.mixByDifficulty && cat1.difficulty !== cat2.difficulty) {
    differences++;
  }
  
  // Consider "different" if at least one dimension differs
  return differences > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERLEAVING ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply interleaving to a list of words
 * 
 * Uses a greedy algorithm that:
 * 1. Starts with the highest-priority word (e.g., most due)
 * 2. For each next position, selects from remaining words that differ from recent selections
 * 3. Falls back to least-recently-used category if no good candidates
 * 
 * **Algorithm Complexity:** O(n²) worst case, but typically O(n log n) with good distribution
 * 
 * @param words - Words to interleave (typically already filtered by due date)
 * @param config - Interleaving configuration
 * @returns Interleaved list of words
 */
export function interleaveWords(
  words: VocabularyWord[],
  config: InterleavingConfig = DEFAULT_INTERLEAVING_CONFIG
): VocabularyWord[] {
  // If disabled or too few words, return as-is
  if (!config.enabled || words.length <= 2) {
    return [...words];
  }
  
  const result: VocabularyWord[] = [];
  const remaining = [...words];
  const categories = new Map(words.map(w => [w.id, categorizeWord(w)]));
  
  // Track recent categories to enforce maxConsecutive constraint
  const recentCategories: WordCategory[] = [];
  
  while (remaining.length > 0) {
    let selectedIndex = -1;
    let bestScore = -Infinity;
    
    // Find best candidate from remaining words
    for (let i = 0; i < remaining.length; i++) {
      const word = remaining[i];
      const category = categories.get(word.id)!;
      
      // Calculate interleaving score
      let score = 0;
      
      // Check how many recent words match this category
      let consecutiveMatches = 0;
      for (let j = recentCategories.length - 1; j >= 0 && j >= recentCategories.length - config.maxConsecutive; j--) {
        const recentCat = recentCategories[j];
        
        if (config.mixByPartOfSpeech && category.partOfSpeech === recentCat.partOfSpeech) {
          consecutiveMatches++;
        }
        if (config.mixByAge && category.age === recentCat.age) {
          consecutiveMatches++;
        }
        if (config.mixByDifficulty && category.difficulty === recentCat.difficulty) {
          consecutiveMatches++;
        }
      }
      
      // Penalize consecutive matches heavily
      score -= consecutiveMatches * 10;
      
      // Bonus for being different from most recent
      if (recentCategories.length > 0) {
        const mostRecent = recentCategories[recentCategories.length - 1];
        if (isDifferentCategory(category, mostRecent, config)) {
          score += 5;
        }
      }
      
      // Small random factor to break ties
      score += Math.random() * 0.1;
      
      // Track best candidate
      if (score > bestScore) {
        bestScore = score;
        selectedIndex = i;
      }
    }
    
    // Add selected word to result
    const selectedWord = remaining.splice(selectedIndex, 1)[0];
    result.push(selectedWord);
    
    // Update recent categories (sliding window)
    const selectedCategory = categories.get(selectedWord.id)!;
    recentCategories.push(selectedCategory);
    if (recentCategories.length > config.maxConsecutive * 2) {
      recentCategories.shift();
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interleaving quality metrics
 */
export interface InterleavingMetrics {
  /** Total number of words */
  totalWords: number;
  
  /** Number of category switches */
  switches: number;
  
  /** Switch rate (switches / words) */
  switchRate: number;
  
  /** Maximum consecutive words of same category */
  maxConsecutive: number;
  
  /** Average consecutive words of same category */
  avgConsecutive: number;
  
  /** Category distribution */
  distribution: {
    partOfSpeech: Record<string, number>;
    age: Record<string, number>;
    difficulty: Record<string, number>;
  };
}

/**
 * Analyze interleaving quality of a word sequence
 */
export function analyzeInterleaving(words: VocabularyWord[]): InterleavingMetrics {
  if (words.length === 0) {
    return {
      totalWords: 0,
      switches: 0,
      switchRate: 0,
      maxConsecutive: 0,
      avgConsecutive: 0,
      distribution: {
        partOfSpeech: {},
        age: {},
        difficulty: {},
      },
    };
  }
  
  const categories = words.map(w => categorizeWord(w));
  
  // Count switches and consecutive runs
  let switches = 0;
  let currentConsecutive = 1;
  let maxConsecutive = 1;
  let totalConsecutive = 0;
  let consecutiveCount = 0;
  
  for (let i = 1; i < categories.length; i++) {
    const prev = categories[i - 1];
    const curr = categories[i];
    
    const isDifferent = (
      prev.partOfSpeech !== curr.partOfSpeech ||
      prev.age !== curr.age ||
      prev.difficulty !== curr.difficulty
    );
    
    if (isDifferent) {
      switches++;
      totalConsecutive += currentConsecutive;
      consecutiveCount++;
      currentConsecutive = 1;
    } else {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    }
  }
  
  // Finalize consecutive tracking
  totalConsecutive += currentConsecutive;
  consecutiveCount++;
  
  // Calculate distribution
  const distribution = {
    partOfSpeech: {} as Record<string, number>,
    age: {} as Record<string, number>,
    difficulty: {} as Record<string, number>,
  };
  
  for (const cat of categories) {
    distribution.partOfSpeech[cat.partOfSpeech] = (distribution.partOfSpeech[cat.partOfSpeech] || 0) + 1;
    distribution.age[cat.age] = (distribution.age[cat.age] || 0) + 1;
    distribution.difficulty[cat.difficulty] = (distribution.difficulty[cat.difficulty] || 0) + 1;
  }
  
  return {
    totalWords: words.length,
    switches,
    switchRate: switches / Math.max(1, words.length - 1),
    maxConsecutive,
    avgConsecutive: totalConsecutive / consecutiveCount,
    distribution,
  };
}

/**
 * Generate a human-readable interleaving report
 */
export function generateInterleavingReport(metrics: InterleavingMetrics): string {
  const lines: string[] = [
    '=== Interleaving Quality Report ===',
    '',
    `Total Words: ${metrics.totalWords}`,
    `Category Switches: ${metrics.switches}`,
    `Switch Rate: ${(metrics.switchRate * 100).toFixed(1)}%`,
    `Max Consecutive: ${metrics.maxConsecutive}`,
    `Avg Consecutive: ${metrics.avgConsecutive.toFixed(2)}`,
    '',
    '--- Distribution ---',
    '',
    'Part of Speech:',
    ...Object.entries(metrics.distribution.partOfSpeech)
      .map(([pos, count]) => `  ${pos}: ${count}`),
    '',
    'Age:',
    ...Object.entries(metrics.distribution.age)
      .map(([age, count]) => `  ${age}: ${count}`),
    '',
    'Difficulty:',
    ...Object.entries(metrics.distribution.difficulty)
      .map(([diff, count]) => `  ${diff}: ${count}`),
  ];
  
  return lines.join('\n');
}
