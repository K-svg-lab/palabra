/**
 * Method Selector Service - Phase 18.1 Task 4
 * 
 * Intelligently selects review methods based on:
 * - User performance per method
 * - Recent method history (prevents boring repetition)
 * - Word characteristics (has audio, examples, etc.)
 * - User proficiency level
 * 
 * Algorithm prioritizes methods where user is weaker to provide
 * targeted practice and improve retention.
 * 
 * @module lib/services/method-selector
 */

import type {
  ReviewMethodType,
  MethodSelectionContext,
  MethodSelectionResult,
  MethodSelectorConfig,
  MethodPerformance,
} from '@/lib/types/review-methods';
import { DEFAULT_METHOD_SELECTOR_CONFIG } from '@/lib/types/review-methods';
import type { VocabularyWord } from '@/lib/types/vocabulary';

/**
 * Select the best review method for a given word
 * 
 * @param context - Selection context including word, history, performance
 * @param config - Selector configuration
 * @returns Selected method with reasoning
 */
export function selectReviewMethod(
  context: MethodSelectionContext,
  config: MethodSelectorConfig = DEFAULT_METHOD_SELECTOR_CONFIG
): MethodSelectionResult {
  const { word, recentHistory, performance, userLevel } = context;

  // If variation is disabled, always use traditional
  if (!config.enableVariation) {
    return {
      method: 'traditional',
      reason: 'Method variation disabled',
      confidence: 1.0,
      alternatives: [],
    };
  }

  // Get available methods (exclude disabled)
  const availableMethods = getAllMethods().filter(
    (method) => !config.disabledMethods.includes(method)
  );

  if (availableMethods.length === 0) {
    return {
      method: 'traditional',
      reason: 'All methods disabled, fallback to traditional',
      confidence: 1.0,
      alternatives: [],
    };
  }

  // Calculate scores for each method
  const scores = availableMethods.map((method) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Base availability score (can this method be used for this word?)
    const availabilityScore = calculateAvailabilityScore(word, method);
    if (availabilityScore === 0) {
      return { method, score: 0, reasons: ['Method not available for this word'] };
    }
    score += availabilityScore * 10; // Base score: 0-10
    reasons.push(`Available (${availabilityScore.toFixed(2)})`);

    // 2. Performance weighting (prioritize weaker methods)
    if (performance && performance.length >= config.minHistorySize) {
      const performanceScore = calculatePerformanceScore(method, performance, config.weaknessWeight);
      score += performanceScore * 50; // Performance: 0-50
      reasons.push(`Performance weight: ${performanceScore.toFixed(2)}`);
    } else {
      // Not enough history - use random selection
      score += Math.random() * 25; // Random: 0-25
      reasons.push('Insufficient history (random)');
    }

    // 3. History penalty (prevent repetition)
    const historyPenalty = calculateHistoryPenalty(method, recentHistory, config.repetitionWindow);
    score -= historyPenalty; // Penalty: 0-100
    if (historyPenalty > 0) {
      reasons.push(`Recent use penalty: -${historyPenalty.toFixed(2)}`);
    }

    // 4. User level bonus (easier methods for beginners)
    if (userLevel) {
      const levelBonus = calculateLevelBonus(method, userLevel);
      score += levelBonus * 5; // Level: 0-5
      if (levelBonus > 0) {
        reasons.push(`Level ${userLevel} bonus: ${levelBonus.toFixed(2)}`);
      }
    }

    // 5. Variety bonus (encourage trying different methods)
    const varietyBonus = calculateVarietyBonus(method, performance);
    score += varietyBonus * 10; // Variety: 0-10
    if (varietyBonus > 0) {
      reasons.push(`Variety bonus: ${varietyBonus.toFixed(2)}`);
    }

    return { method, score, reasons };
  });

  // Filter out unavailable methods
  const viableScores = scores.filter((s) => s.score > 0);

  if (viableScores.length === 0) {
    return {
      method: 'traditional',
      reason: 'No methods available, fallback to traditional',
      confidence: 1.0,
      alternatives: [],
    };
  }

  // Sort by score (highest first)
  viableScores.sort((a, b) => b.score - a.score);

  // Select top method
  const selected = viableScores[0];
  const totalScore = viableScores.reduce((sum, s) => sum + s.score, 0);
  const confidence = selected.score / totalScore;

  // Get alternatives (top 3)
  const alternatives = viableScores.slice(1, 4).map((s) => ({
    method: s.method,
    score: s.score,
  }));

  return {
    method: selected.method,
    reason: selected.reasons.join(', '),
    confidence,
    alternatives,
  };
}

/**
 * Get all available review methods
 */
function getAllMethods(): ReviewMethodType[] {
  return [
    'traditional',
    'fill-blank',
    'multiple-choice',
    'audio-recognition',
    'context-selection',
  ];
}

/**
 * Calculate availability score for a method (0 = not available, 1 = fully available)
 */
function calculateAvailabilityScore(word: VocabularyWord, method: ReviewMethodType): number {
  switch (method) {
    case 'traditional':
      // Always available
      return 1.0;

    case 'fill-blank':
      // Requires at least one example sentence
      return word.examples && word.examples.length > 0 ? 1.0 : 0.0;

    case 'multiple-choice':
      // Always available (we can generate distractors)
      return 1.0;

    case 'audio-recognition':
      // Available if TTS is working or audio file exists
      // For now, assume TTS is always available
      return 1.0;

    case 'context-selection':
      // Requires at least one example sentence
      return word.examples && word.examples.length > 0 ? 1.0 : 0.0;

    default:
      return 0.0;
  }
}

/**
 * Calculate performance-based score
 * Higher score for methods where user is weaker (needs more practice)
 */
function calculatePerformanceScore(
  method: ReviewMethodType,
  performance: MethodPerformance[],
  weaknessWeight: number
): number {
  const methodPerf = performance.find((p) => p.method === method);

  if (!methodPerf || methodPerf.attempts === 0) {
    // Not yet tried - give medium-high score to encourage trying
    return 0.7;
  }

  // Calculate weakness score (1 - accuracy)
  // Lower accuracy = higher weakness = higher score
  const weakness = 1 - methodPerf.accuracy;

  // Apply weakness weight
  // weaknessWeight = 1.0 means fully weight toward weaknesses
  // weaknessWeight = 0.0 means ignore weaknesses (random)
  const score = weakness * weaknessWeight + (1 - weaknessWeight) * 0.5;

  return score;
}

/**
 * Calculate history penalty for recently used methods
 * Returns 0-100 penalty (higher = more recently used)
 */
function calculateHistoryPenalty(
  method: ReviewMethodType,
  recentHistory: Array<{ method: ReviewMethodType; timestamp: number }>,
  repetitionWindow: number
): number {
  if (!recentHistory || recentHistory.length === 0) {
    return 0;
  }

  // Look at last N methods
  const relevantHistory = recentHistory.slice(-repetitionWindow);
  
  // Find most recent use of this method
  let penalty = 0;
  for (let i = relevantHistory.length - 1; i >= 0; i--) {
    if (relevantHistory[i].method === method) {
      // Calculate penalty based on recency
      // Most recent = highest penalty (100)
      // Least recent (within window) = lower penalty
      const recencyFactor = (relevantHistory.length - i) / relevantHistory.length;
      penalty = recencyFactor * 100;
      break;
    }
  }

  return penalty;
}

/**
 * Calculate level-based bonus
 * Beginners (A1-A2) get bonus for easier methods
 * Advanced (C1-C2) get bonus for harder methods
 */
function calculateLevelBonus(method: ReviewMethodType, userLevel: string): number {
  const level = userLevel.toUpperCase();
  
  // Map methods to difficulty
  const easyMethods: ReviewMethodType[] = ['multiple-choice', 'traditional'];
  const mediumMethods: ReviewMethodType[] = ['context-selection', 'fill-blank'];
  const hardMethods: ReviewMethodType[] = ['audio-recognition'];

  // Beginner levels (A1-A2)
  if (level === 'A1' || level === 'A2') {
    if (easyMethods.includes(method)) return 1.0;
    if (mediumMethods.includes(method)) return 0.5;
    if (hardMethods.includes(method)) return 0.0;
  }

  // Intermediate levels (B1-B2)
  if (level === 'B1' || level === 'B2') {
    if (mediumMethods.includes(method)) return 1.0;
    if (easyMethods.includes(method)) return 0.5;
    if (hardMethods.includes(method)) return 0.5;
  }

  // Advanced levels (C1-C2)
  if (level === 'C1' || level === 'C2') {
    if (hardMethods.includes(method)) return 1.0;
    if (mediumMethods.includes(method)) return 0.7;
    if (easyMethods.includes(method)) return 0.3;
  }

  // Default: no bonus
  return 0.5;
}

/**
 * Calculate variety bonus
 * Encourage trying methods that haven't been used much
 */
function calculateVarietyBonus(
  method: ReviewMethodType,
  performance?: MethodPerformance[]
): number {
  if (!performance || performance.length === 0) {
    return 1.0; // Maximum variety bonus if no history
  }

  const methodPerf = performance.find((p) => p.method === method);
  
  if (!methodPerf) {
    return 1.0; // Never tried - maximum variety bonus
  }

  // Calculate total attempts across all methods
  const totalAttempts = performance.reduce((sum, p) => sum + p.attempts, 0);
  
  if (totalAttempts === 0) {
    return 1.0;
  }

  // Calculate this method's usage ratio
  const usageRatio = methodPerf.attempts / totalAttempts;

  // Expected ratio if evenly distributed
  const expectedRatio = 1 / performance.length;

  // Variety bonus inversely proportional to overuse
  // If used less than expected = bonus
  // If used more than expected = penalty
  const varietyScore = Math.max(0, 1 - (usageRatio / expectedRatio));

  return varietyScore;
}

/**
 * Generate method selection report for debugging
 */
export function generateMethodSelectionReport(
  context: MethodSelectionContext,
  config: MethodSelectorConfig = DEFAULT_METHOD_SELECTOR_CONFIG as MethodSelectorConfig
): string {
  const result = selectReviewMethod(context, config);
  
  const lines: string[] = [
    '═══════════════════════════════════════════',
    '  Method Selection Report',
    '═══════════════════════════════════════════',
    `Word: ${context.word.spanishWord}`,
    `Selected Method: ${result.method} (confidence: ${(result.confidence * 100).toFixed(1)}%)`,
    `Reason: ${result.reason}`,
    '',
    'Alternatives:',
  ];

  result.alternatives.forEach((alt, i) => {
    lines.push(`  ${i + 1}. ${alt.method} (score: ${alt.score.toFixed(2)})`);
  });

  lines.push('═══════════════════════════════════════════');

  return lines.join('\n');
}
