/**
 * Review Methods Constants - Phase 18.1.6
 * 
 * Centralized configuration for review methods, difficulty multipliers,
 * and quality calculations based on response time.
 * 
 * @module lib/constants/review-methods
 */

import type { ReviewMethodType } from '@/lib/types/review-methods';

/**
 * Method Difficulty Multipliers for SM-2 Algorithm
 * 
 * These multipliers adjust the interval growth rate based on review method difficulty:
 * - Higher multiplier (>1.0) = Harder method → Rewards success more
 * - Lower multiplier (<1.0) = Easier method → Rewards success less
 * 
 * Rationale (based on cognitive science):
 * - Harder methods (audio, fill-blank) create "desirable difficulties" that lead to
 *   stronger memory encoding. Success on these methods indicates deeper mastery.
 * - Easier methods (multiple-choice) rely more on recognition than recall, so
 *   success is less indicative of true mastery.
 * 
 * Research: Bjork (1994) - "Memory and Metamemory: A Survey of the State of the Art"
 */
export const METHOD_DIFFICULTY_MULTIPLIERS: Record<ReviewMethodType, number> = {
  'traditional': 1.0,          // Baseline difficulty (flip card recall)
  'multiple-choice': 0.8,      // Easier (recognition with options)
  'audio-recognition': 1.2,    // Harder (audio processing + recall)
  'fill-blank': 1.1,           // Medium-hard (context + spelling)
  'context-selection': 0.9,    // Medium (contextual recognition)
} as const;

/**
 * Response Time Thresholds (milliseconds)
 * 
 * Used to dynamically adjust quality ratings based on response speed.
 * Fast, confident responses indicate stronger memory traces.
 * 
 * Research: Koriat & Ma'ayan (2005) - "The effects of encoding fluency and
 * retrieval fluency on judgments of learning"
 */
export const RESPONSE_TIME_THRESHOLDS = {
  /** Very fast response (< 2 seconds) - Indicates strong memory */
  VERY_FAST: 2000,
  
  /** Fast response (2-5 seconds) - Normal recall speed */
  FAST: 5000,
  
  /** Moderate response (5-10 seconds) - Some hesitation */
  MODERATE: 10000,
  
  /** Slow response (10-20 seconds) - Struggling */
  SLOW: 20000,
  
  /** Very slow response (> 20 seconds) - Barely remembering */
  VERY_SLOW: 20000,
} as const;

/**
 * Quality Adjustment Factors
 * 
 * These factors modify the user's self-assessed quality rating based on
 * objective response time data. This helps correct for metacognitive bias
 * where users may over- or under-estimate their performance.
 * 
 * Adjustments are applied as: adjustedQuality = baseQuality + adjustment
 */
export const QUALITY_ADJUSTMENTS = {
  /** Very fast response bonus (+1 quality level) */
  VERY_FAST_BONUS: 1,
  
  /** Fast response bonus (+0.5 quality levels) */
  FAST_BONUS: 0.5,
  
  /** Moderate response - no adjustment */
  MODERATE_ADJUSTMENT: 0,
  
  /** Slow response penalty (-0.5 quality levels) */
  SLOW_PENALTY: -0.5,
  
  /** Very slow response penalty (-1 quality level) */
  VERY_SLOW_PENALTY: -1,
} as const;

/**
 * Method-Specific Response Time Multipliers
 * 
 * Different methods have different "normal" response times:
 * - Audio requires time to process hearing → recognition
 * - Fill-blank requires time to type
 * - Multiple-choice allows faster recognition
 * 
 * These multipliers adjust thresholds per method:
 * adjustedThreshold = baseThreshold * multiplier
 */
export const METHOD_TIME_MULTIPLIERS: Record<ReviewMethodType, number> = {
  'traditional': 1.0,          // Baseline
  'multiple-choice': 0.7,      // Faster (just click)
  'audio-recognition': 1.3,    // Slower (audio processing)
  'fill-blank': 1.2,           // Slower (typing required)
  'context-selection': 0.9,    // Slightly faster (click selection)
} as const;

/**
 * Quality Rating Map
 * 
 * Maps difficulty ratings to SM-2 quality scores (0-5)
 * Used for converting user ratings to numerical values.
 */
export const QUALITY_RATING_MAP = {
  'forgot': 0,     // Complete failure
  'hard': 2,       // Difficult recall
  'good': 3,       // Normal recall
  'easy': 4,       // Easy, confident recall
} as const;

/**
 * Minimum and Maximum Quality Bounds
 * 
 * Quality scores must stay within SM-2 algorithm bounds (0-5)
 * after any adjustments are applied.
 */
export const QUALITY_BOUNDS = {
  MIN: 0,
  MAX: 5,
} as const;

/**
 * Method Performance Tracking Configuration
 */
export const METHOD_PERFORMANCE_CONFIG = {
  /** Minimum attempts before performance weighting kicks in */
  MIN_ATTEMPTS_FOR_WEIGHTING: 5,
  
  /** Target accuracy threshold for method mastery */
  MASTERY_THRESHOLD: 0.85, // 85%
  
  /** Weakness threshold (below this = method is a weakness) */
  WEAKNESS_THRESHOLD: 0.70, // 70%
} as const;

/**
 * Method Selection Configuration Defaults
 */
export const METHOD_SELECTION_DEFAULTS = {
  /** Enable varied review methods (vs always traditional) */
  ENABLE_VARIATION: true,
  
  /** Minimum history size before performance-based selection */
  MIN_HISTORY_SIZE: 5,
  
  /** Weight toward weaker methods (0 = random, 1 = always weakest) */
  WEAKNESS_WEIGHT: 0.7,
  
  /** Number of recent cards to check for repetition prevention */
  REPETITION_WINDOW: 3,
  
  /** Methods disabled by default */
  DISABLED_METHODS: [] as ReviewMethodType[],
} as const;

/**
 * Calculate adjusted quality score based on response time
 * 
 * @param baseQuality - User's self-assessed quality (0-5)
 * @param responseTime - Time to answer in milliseconds
 * @param method - Review method used
 * @returns Adjusted quality score (clamped to 0-5)
 * 
 * @example
 * // User rated "good" (3) but answered very quickly
 * calculateAdjustedQuality(3, 1500, 'traditional')
 * // Returns 4 (bonus for fast response)
 * 
 * // User rated "good" (3) but took a long time
 * calculateAdjustedQuality(3, 15000, 'traditional')
 * // Returns 2.5 (penalty for slow response)
 */
export function calculateAdjustedQuality(
  baseQuality: number,
  responseTime: number,
  method: ReviewMethodType
): number {
  // Adjust thresholds based on method
  const multiplier = METHOD_TIME_MULTIPLIERS[method];
  const adjustedThresholds = {
    veryFast: RESPONSE_TIME_THRESHOLDS.VERY_FAST * multiplier,
    fast: RESPONSE_TIME_THRESHOLDS.FAST * multiplier,
    moderate: RESPONSE_TIME_THRESHOLDS.MODERATE * multiplier,
    slow: RESPONSE_TIME_THRESHOLDS.SLOW * multiplier,
  };

  // Determine adjustment based on response time
  let adjustment = 0;
  
  if (responseTime < adjustedThresholds.veryFast) {
    adjustment = QUALITY_ADJUSTMENTS.VERY_FAST_BONUS;
  } else if (responseTime < adjustedThresholds.fast) {
    adjustment = QUALITY_ADJUSTMENTS.FAST_BONUS;
  } else if (responseTime < adjustedThresholds.moderate) {
    adjustment = QUALITY_ADJUSTMENTS.MODERATE_ADJUSTMENT;
  } else if (responseTime < adjustedThresholds.slow) {
    adjustment = QUALITY_ADJUSTMENTS.SLOW_PENALTY;
  } else {
    adjustment = QUALITY_ADJUSTMENTS.VERY_SLOW_PENALTY;
  }

  // Apply adjustment and clamp to valid range
  const adjustedQuality = baseQuality + adjustment;
  return Math.max(
    QUALITY_BOUNDS.MIN,
    Math.min(QUALITY_BOUNDS.MAX, adjustedQuality)
  );
}

/**
 * Convert difficulty rating to quality score
 * 
 * @param rating - User's difficulty rating
 * @returns SM-2 quality score (0-5)
 */
export function ratingToQuality(rating: 'forgot' | 'hard' | 'good' | 'easy'): number {
  return QUALITY_RATING_MAP[rating];
}

/**
 * Get method difficulty multiplier
 * 
 * @param method - Review method type
 * @returns Difficulty multiplier for SM-2 algorithm
 */
export function getMethodDifficultyMultiplier(method: ReviewMethodType): number {
  return METHOD_DIFFICULTY_MULTIPLIERS[method];
}

/**
 * Check if method performance indicates weakness
 * 
 * @param accuracy - Method accuracy (0-1)
 * @param attempts - Number of attempts with this method
 * @returns True if method is a weakness
 */
export function isMethodWeakness(accuracy: number, attempts: number): boolean {
  if (attempts < METHOD_PERFORMANCE_CONFIG.MIN_ATTEMPTS_FOR_WEIGHTING) {
    return false; // Not enough data
  }
  return accuracy < METHOD_PERFORMANCE_CONFIG.WEAKNESS_THRESHOLD;
}

/**
 * Check if method performance indicates mastery
 * 
 * @param accuracy - Method accuracy (0-1)
 * @param attempts - Number of attempts with this method
 * @returns True if method is mastered
 */
export function isMethodMastered(accuracy: number, attempts: number): boolean {
  if (attempts < METHOD_PERFORMANCE_CONFIG.MIN_ATTEMPTS_FOR_WEIGHTING) {
    return false; // Not enough data
  }
  return accuracy >= METHOD_PERFORMANCE_CONFIG.MASTERY_THRESHOLD;
}

/**
 * Get response time category
 * 
 * @param responseTime - Time to answer in milliseconds
 * @param method - Review method used
 * @returns Category string
 */
export function getResponseTimeCategory(
  responseTime: number,
  method: ReviewMethodType
): 'very-fast' | 'fast' | 'moderate' | 'slow' | 'very-slow' {
  const multiplier = METHOD_TIME_MULTIPLIERS[method];
  const adjustedThresholds = {
    veryFast: RESPONSE_TIME_THRESHOLDS.VERY_FAST * multiplier,
    fast: RESPONSE_TIME_THRESHOLDS.FAST * multiplier,
    moderate: RESPONSE_TIME_THRESHOLDS.MODERATE * multiplier,
    slow: RESPONSE_TIME_THRESHOLDS.SLOW * multiplier,
  };

  if (responseTime < adjustedThresholds.veryFast) return 'very-fast';
  if (responseTime < adjustedThresholds.fast) return 'fast';
  if (responseTime < adjustedThresholds.moderate) return 'moderate';
  if (responseTime < adjustedThresholds.slow) return 'slow';
  return 'very-slow';
}
