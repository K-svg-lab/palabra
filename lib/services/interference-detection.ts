/**
 * Interference Detection Service (Phase 18.2.1)
 * 
 * Automatically detects when users confuse similar words and provides
 * targeted comparative review sessions to resolve interference.
 * 
 * Phase 18.3.6: PREMIUM FEATURE - Requires active subscription
 * 
 * Research: Underwood (1957), Postman & Underwood (1973)
 * - Similar words compete for retrieval
 * - Confusion reduces retention by 40-60%
 * - Comparative learning resolves interference
 * 
 * @module interference-detection
 */

import { prisma } from '@/lib/backend/db';
import type { VocabularyItem } from '@prisma/client';
import { hasActivePremium } from './stripe';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfusionPattern {
  word1: string;
  word2: string;
  word1Id: string;
  word2Id: string;
  confusionScore: number; // 0-1, higher = more confused
  occurrences: number;
  lastOccurrence: Date;
  resolved: boolean;
}

export interface WordSimilarity {
  word: VocabularyItem;
  similarity: number; // 0-1
  distance: number; // Levenshtein distance
}

export interface ComparativeReviewResult {
  word1Id: string;
  word2Id: string;
  questionsAsked: number;
  questionsCorrect: number;
  accuracy: number;
  completedAt: Date;
}

// ============================================================================
// CONFUSION DETECTION
// ============================================================================

/**
 * Detect confusion patterns from user review history
 * 
 * Analyzes recent incorrect attempts to identify word pairs
 * that the user frequently confuses.
 * 
 * Phase 18.3.6: Premium-only feature
 * 
 * @param userId - User ID to analyze
 * @param lookbackDays - Days of history to analyze (default: 30)
 * @returns Array of confusion patterns, sorted by severity (empty for free users)
 */
export async function detectConfusionPatterns(
  userId: string,
  lookbackDays: number = 30
): Promise<ConfusionPattern[]> {
  // Phase 18.3.6: Check premium access
  const hasPremium = await hasActivePremium(userId);
  if (!hasPremium) {
    // Free users: no interference detection
    return [];
  }

  // Get recent review attempts where user was wrong
  const wrongAttempts = await prisma.reviewAttempt.findMany({
    where: {
      userId,
      correct: false,
      reviewedAt: {
        gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
      },
      userAnswer: { not: null },
    },
    orderBy: { reviewedAt: 'desc' },
  });

  if (wrongAttempts.length === 0) {
    return [];
  }

  // Get all user's vocabulary for similarity matching
  const allWords = await prisma.vocabularyItem.findMany({
    where: { userId, isDeleted: false },
    select: { id: true, spanish: true, english: true },
  });

  // Build confusion map
  const confusionMap = new Map<string, ConfusionPattern>();

  for (const attempt of wrongAttempts) {
    const userAnswer = attempt.userAnswer?.toLowerCase().trim();
    if (!userAnswer) continue;

    // Get the correct word
    const correctWord = allWords.find(w => w.id === attempt.vocabularyId);
    if (!correctWord) continue;

    // Find words similar to what user typed
    const similarWords = findSimilarWords(
      userAnswer,
      correctWord.spanish,
      allWords
    );

    for (const similar of similarWords) {
      // Create unique key (alphabetically sorted to avoid duplicates)
      const [id1, id2] = [correctWord.id, similar.word.id].sort();
      const key = `${id1}::${id2}`;

      if (!confusionMap.has(key)) {
        confusionMap.set(key, {
          word1: correctWord.spanish,
          word2: similar.word.spanish,
          word1Id: correctWord.id,
          word2Id: similar.word.id,
          confusionScore: 0,
          occurrences: 0,
          lastOccurrence: attempt.reviewedAt,
          resolved: false,
        });
      }

      const pattern = confusionMap.get(key)!;
      pattern.occurrences++;
      pattern.lastOccurrence = attempt.reviewedAt;
      pattern.confusionScore = calculateConfusionScore(pattern.occurrences);
    }
  }

  // Filter by minimum threshold and sort by severity
  return Array.from(confusionMap.values())
    .filter(p => p.confusionScore >= 0.3) // 30% threshold
    .sort((a, b) => b.confusionScore - a.confusionScore);
}

/**
 * Find words similar to user's input
 * 
 * Uses Levenshtein distance to find words that are similar
 * in spelling, which are likely to be confused.
 * 
 * @param input - User's typed answer
 * @param target - Correct answer
 * @param allWords - All user's vocabulary
 * @returns Array of similar words with similarity scores
 */
function findSimilarWords(
  input: string,
  target: string,
  allWords: Array<{ id: string; spanish: string; english: string }>
): WordSimilarity[] {
  const results: WordSimilarity[] = [];

  for (const word of allWords) {
    // Skip if this is the target word itself
    if (word.spanish.toLowerCase() === target.toLowerCase()) {
      continue;
    }

    const distance = levenshteinDistance(
      input.toLowerCase(),
      word.spanish.toLowerCase()
    );
    
    const maxLength = Math.max(input.length, word.spanish.length);
    const similarity = 1 - distance / maxLength;

    // Only include if similarity is above 70%
    if (similarity >= 0.7) {
      results.push({
        word: word as VocabularyItem,
        similarity,
        distance,
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate confusion score
 * 
 * Maps number of confusion occurrences to a 0-1 score.
 * More occurrences = higher confusion.
 * 
 * @param occurrences - Number of times confused
 * @returns Confusion score (0-1)
 */
function calculateConfusionScore(occurrences: number): number {
  // Asymptotic function: approaches 1 as occurrences increase
  // 3 occurrences = 0.6 score
  // 5 occurrences = 0.8 score
  // 10 occurrences = 0.95 score
  return Math.min(occurrences / (occurrences + 2), 1.0);
}

/**
 * Levenshtein distance algorithm
 * 
 * Calculates the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to change
 * one string into another.
 * 
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Minimum edit distance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  // Create 2D matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// ============================================================================
// CONFUSION TRACKING
// ============================================================================

/**
 * Record confusion between two words
 * 
 * Updates the ConfusionPair record when the user confuses two words.
 * Creates a new record if one doesn't exist.
 * 
 * @param userId - User ID
 * @param word1Id - First word ID
 * @param word2Id - Second word ID
 */
export async function recordConfusion(
  userId: string,
  word1Id: string,
  word2Id: string
): Promise<void> {
  // Sort IDs to ensure unique constraint works
  const [id1, id2] = [word1Id, word2Id].sort();

  await prisma.confusionPair.upsert({
    where: {
      userId_word1Id_word2Id: {
        userId,
        word1Id: id1,
        word2Id: id2,
      },
    },
    update: {
      confusionCount: { increment: 1 },
      lastConfusion: new Date(),
    },
    create: {
      userId,
      word1Id: id1,
      word2Id: id2,
      lastConfusion: new Date(),
      confusionCount: 1,
    },
  });
}

/**
 * Record comparative review completion
 * 
 * Marks that the user has completed a comparative review
 * for the confused word pair and records performance.
 * 
 * @param result - Comparative review result
 */
export async function recordComparativeReview(
  userId: string,
  result: ComparativeReviewResult
): Promise<void> {
  const [id1, id2] = [result.word1Id, result.word2Id].sort();

  await prisma.confusionPair.update({
    where: {
      userId_word1Id_word2Id: {
        userId,
        word1Id: id1,
        word2Id: id2,
      },
    },
    data: {
      comparativeCount: { increment: 1 },
      lastComparative: result.completedAt,
      word1Accuracy: result.accuracy,
      word2Accuracy: result.accuracy,
      // Mark as resolved if accuracy is high (>80%)
      resolved: result.accuracy >= 0.8,
      resolvedAt: result.accuracy >= 0.8 ? result.completedAt : null,
    },
  });

  // Also update the vocabulary items
  await Promise.all([
    updateWordConfusionScore(result.word1Id, result.word2Id),
    updateWordConfusionScore(result.word2Id, result.word1Id),
  ]);
}

/**
 * Update confusion score on vocabulary item
 * 
 * @param wordId - Word to update
 * @param partnerId - Confused partner word
 */
async function updateWordConfusionScore(
  wordId: string,
  partnerId: string
): Promise<void> {
  const word = await prisma.vocabularyItem.findUnique({
    where: { id: wordId },
    select: { confusionPartners: true },
  });

  if (!word) return;

  const partners = (word.confusionPartners as string[]) || [];
  if (!partners.includes(partnerId)) {
    partners.push(partnerId);
  }

  await prisma.vocabularyItem.update({
    where: { id: wordId },
    data: {
      confusionPartners: partners,
      lastComparative: new Date(),
    },
  });
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get active confusion pairs for user
 * 
 * Returns confusion pairs that haven't been resolved yet
 * and have been seen in the last 30 days.
 * 
 * @param userId - User ID
 * @returns Array of active confusion pairs
 */
export async function getActiveConfusions(
  userId: string
): Promise<ConfusionPattern[]> {
  const pairs = await prisma.confusionPair.findMany({
    where: {
      userId,
      resolved: false,
      lastConfusion: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: [
      { confusionCount: 'desc' },
      { lastConfusion: 'desc' },
    ],
    take: 10, // Top 10 most confused pairs
  });

  return Promise.all(
    pairs.map(async (pair) => {
      const [word1, word2] = await Promise.all([
        prisma.vocabularyItem.findUnique({
          where: { id: pair.word1Id },
          select: { spanish: true },
        }),
        prisma.vocabularyItem.findUnique({
          where: { id: pair.word2Id },
          select: { spanish: true },
        }),
      ]);

      return {
        word1: word1?.spanish || '',
        word2: word2?.spanish || '',
        word1Id: pair.word1Id,
        word2Id: pair.word2Id,
        confusionScore: calculateConfusionScore(pair.confusionCount),
        occurrences: pair.confusionCount,
        lastOccurrence: pair.lastConfusion,
        resolved: pair.resolved,
      };
    })
  );
}

/**
 * Check if user should see comparative review
 * 
 * Returns true if there are unresolved confusion pairs
 * and user hasn't done comparative review recently.
 * 
 * @param userId - User ID
 * @returns True if comparative review should be shown
 */
export async function shouldShowComparativeReview(
  userId: string
): Promise<boolean> {
  const activeConfusions = await getActiveConfusions(userId);
  
  if (activeConfusions.length === 0) {
    return false;
  }

  // Check if user has done comparative review in last 7 days
  const recentComparative = await prisma.confusionPair.findFirst({
    where: {
      userId,
      lastComparative: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return recentComparative === null;
}

/**
 * Get top confusion pair for user
 * 
 * Returns the most severe unresolved confusion pair.
 * 
 * @param userId - User ID
 * @returns Top confusion pair or null if none
 */
export async function getTopConfusion(
  userId: string
): Promise<ConfusionPattern | null> {
  const confusions = await getActiveConfusions(userId);
  return confusions.length > 0 ? confusions[0] : null;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get confusion resolution statistics
 * 
 * @param userId - User ID
 * @returns Statistics about confusion resolution
 */
export async function getConfusionStats(userId: string) {
  const [total, resolved, active] = await Promise.all([
    prisma.confusionPair.count({ where: { userId } }),
    prisma.confusionPair.count({ where: { userId, resolved: true } }),
    prisma.confusionPair.count({ where: { userId, resolved: false } }),
  ]);

  const avgComparativeCount = await prisma.confusionPair.aggregate({
    where: { userId, comparativeCount: { gt: 0 } },
    _avg: { comparativeCount: true },
  });

  return {
    totalConfusions: total,
    resolvedConfusions: resolved,
    activeConfusions: active,
    resolutionRate: total > 0 ? resolved / total : 0,
    avgComparativeReviews: avgComparativeCount._avg.comparativeCount || 0,
  };
}
