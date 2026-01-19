/**
 * Advanced Spaced Repetition - Phase 8
 * 
 * Extends the basic SM-2 algorithm with:
 * - Forgetting curve tracking
 * - Personalized difficulty adjustments
 * - Retention prediction
 * - Performance-based interval optimization
 */

import type { ReviewRecord } from '@/lib/types/vocabulary';
import type { AdvancedSRMetadata, ForgettingCurveDataPoint, ExtendedReviewResult } from '@/lib/types/review';

/**
 * Forgetting curve parameters
 * Based on Ebbinghaus forgetting curve: R(t) = e^(-t/S)
 * Where R is retention, t is time, and S is strength (memory stability)
 */
const FORGETTING_CURVE_CONFIG = {
  /** Initial memory strength (days) */
  INITIAL_STRENGTH: 2,
  
  /** Minimum retention threshold for scheduling (0-1) */
  MIN_RETENTION_THRESHOLD: 0.85,
  
  /** Optimal retention target (0-1) */
  OPTIMAL_RETENTION: 0.90,
  
  /** Maximum data points to store per word */
  MAX_DATA_POINTS: 50,
} as const;

/**
 * Calculate retention probability using forgetting curve
 * Formula: R(t) = e^(-t/S)
 * 
 * @param daysSinceReview - Days since last review
 * @param memoryStrength - Memory strength parameter (higher = stronger memory)
 * @returns Retention probability (0-1)
 */
export function calculateRetentionProbability(
  daysSinceReview: number,
  memoryStrength: number
): number {
  if (daysSinceReview <= 0) {
    return 1.0; // Perfect retention immediately after review
  }
  
  const retention = Math.exp(-daysSinceReview / memoryStrength);
  return Math.max(0, Math.min(1, retention)); // Clamp between 0 and 1
}

/**
 * Calculate memory strength from review history
 * Stronger memory = longer intervals between forgetting
 * 
 * @param review - Review record
 * @param recentPerformance - Recent difficulty ratings
 * @returns Memory strength in days
 */
export function calculateMemoryStrength(
  review: ReviewRecord,
  recentPerformance: string[] = []
): number {
  const baseStrength = FORGETTING_CURVE_CONFIG.INITIAL_STRENGTH;
  
  // Factor 1: Ease factor (SM-2)
  const easeFactor = review.easeFactor / 2.5; // Normalize around 1.0
  
  // Factor 2: Repetition count (more reps = stronger memory)
  const repetitionBonus = Math.log(review.repetition + 1) * 0.5;
  
  // Factor 3: Accuracy (higher accuracy = stronger memory)
  const accuracy = review.totalReviews > 0 
    ? review.correctCount / review.totalReviews 
    : 0.5;
  const accuracyFactor = accuracy * 2; // Scale to 0-2 range
  
  // Factor 4: Recent performance (last 5 reviews)
  let recentPerformanceBonus = 0;
  if (recentPerformance.length > 0) {
    const recentCorrect = recentPerformance.filter(r => r !== 'forgot').length;
    recentPerformanceBonus = (recentCorrect / recentPerformance.length) * 0.5;
  }
  
  // Calculate final memory strength
  const strength = baseStrength * easeFactor * (1 + repetitionBonus) * accuracyFactor + recentPerformanceBonus;
  
  return Math.max(1, strength); // Minimum 1 day
}

/**
 * Predict retention at a future date
 * 
 * @param review - Review record
 * @param metadata - Advanced SR metadata
 * @param targetDate - Future date timestamp
 * @returns Predicted retention probability (0-1)
 */
export function predictRetention(
  review: ReviewRecord,
  metadata: AdvancedSRMetadata,
  targetDate: number
): number {
  if (!review.lastReviewDate) {
    return 1.0; // New word, not yet reviewed
  }
  
  const daysSinceReview = (targetDate - review.lastReviewDate) / (24 * 60 * 60 * 1000);
  const memoryStrength = calculateMemoryStrength(review);
  
  return calculateRetentionProbability(daysSinceReview, memoryStrength);
}

/**
 * Calculate optimal review date based on target retention
 * Schedules review when retention is expected to drop to optimal threshold
 * 
 * @param review - Review record
 * @param targetRetention - Target retention probability (default: 0.90)
 * @returns Optimal review date timestamp
 */
export function calculateOptimalReviewDate(
  review: ReviewRecord,
  targetRetention: number = FORGETTING_CURVE_CONFIG.OPTIMAL_RETENTION
): number {
  const lastReview = review.lastReviewDate || Date.now();
  const memoryStrength = calculateMemoryStrength(review);
  
  // Solve for t in: targetRetention = e^(-t/S)
  // t = -S * ln(targetRetention)
  const optimalDays = -memoryStrength * Math.log(targetRetention);
  const optimalDaysRounded = Math.max(1, Math.round(optimalDays));
  
  return lastReview + (optimalDaysRounded * 24 * 60 * 60 * 1000);
}

/**
 * Calculate personalized difficulty adjustment
 * Adjusts intervals based on individual learning patterns
 * 
 * @param review - Review record
 * @param metadata - Advanced SR metadata
 * @returns Difficulty adjustment factor (0.5 = easier, 2.0 = harder)
 */
export function calculateDifficultyAdjustment(
  review: ReviewRecord,
  metadata: AdvancedSRMetadata
): number {
  let adjustment = 1.0;
  
  // Factor 1: Response time (slower = harder)
  if (metadata.avgTimeToAnswer > 0) {
    const expectedTime = 5000; // 5 seconds baseline
    const timeRatio = metadata.avgTimeToAnswer / expectedTime;
    
    if (timeRatio > 1.5) {
      adjustment *= 0.8; // Make easier (shorter intervals)
    } else if (timeRatio < 0.7) {
      adjustment *= 1.2; // Make harder (longer intervals)
    }
  }
  
  // Factor 2: Consistency (high std dev = inconsistent = harder)
  if (metadata.stdDevTimeToAnswer > 0) {
    const cv = metadata.stdDevTimeToAnswer / metadata.avgTimeToAnswer; // Coefficient of variation
    
    if (cv > 0.5) {
      adjustment *= 0.9; // High variability = make slightly easier
    }
  }
  
  // Factor 3: Accuracy trend
  const accuracy = review.totalReviews > 0 
    ? review.correctCount / review.totalReviews 
    : 0.5;
    
  if (accuracy < 0.6) {
    adjustment *= 0.7; // Low accuracy = make easier
  } else if (accuracy > 0.9) {
    adjustment *= 1.3; // High accuracy = make harder
  }
  
  // Clamp adjustment to reasonable range
  return Math.max(0.5, Math.min(2.0, adjustment));
}

/**
 * Add a new data point to the forgetting curve
 * 
 * @param metadata - Advanced SR metadata
 * @param review - Review record
 * @param wasCorrect - Whether the review was correct
 * @returns Updated metadata
 */
export function addForgettingCurveDataPoint(
  metadata: AdvancedSRMetadata,
  review: ReviewRecord,
  wasCorrect: boolean
): AdvancedSRMetadata {
  if (!review.lastReviewDate) {
    return metadata;
  }
  
  const daysSinceReview = (Date.now() - review.lastReviewDate) / (24 * 60 * 60 * 1000);
  const retention = wasCorrect ? 1.0 : 0.0; // Binary for now (could be probabilistic)
  
  const newDataPoint: ForgettingCurveDataPoint = {
    daysSinceReview,
    retentionProbability: retention,
    timestamp: Date.now(),
  };
  
  // Add new data point
  const updatedCurve = [...metadata.forgettingCurve, newDataPoint];
  
  // Keep only most recent data points
  if (updatedCurve.length > FORGETTING_CURVE_CONFIG.MAX_DATA_POINTS) {
    updatedCurve.shift(); // Remove oldest
  }
  
  return {
    ...metadata,
    forgettingCurve: updatedCurve,
  };
}

/**
 * Update advanced SR metadata after a review
 * 
 * @param metadata - Current metadata
 * @param review - Updated review record
 * @param result - Review result
 * @returns Updated metadata
 */
export function updateAdvancedSRMetadata(
  metadata: AdvancedSRMetadata,
  review: ReviewRecord,
  result: ExtendedReviewResult
): AdvancedSRMetadata {
  // Update forgetting curve data
  const wasCorrect = result.rating !== 'forgot';
  let updatedMetadata = addForgettingCurveDataPoint(metadata, review, wasCorrect);
  
  // Update average time to answer
  const totalTime = metadata.avgTimeToAnswer * review.totalReviews;
  const newAvgTime = (totalTime + result.timeSpent) / (review.totalReviews + 1);
  
  // Update standard deviation (simplified incremental calculation)
  const oldMean = metadata.avgTimeToAnswer;
  const newMean = newAvgTime;
  const oldVariance = Math.pow(metadata.stdDevTimeToAnswer, 2);
  const newVariance = review.totalReviews > 0
    ? ((review.totalReviews - 1) * oldVariance + Math.pow(result.timeSpent - oldMean, 2)) / review.totalReviews
    : 0;
  const newStdDev = Math.sqrt(newVariance);
  
  updatedMetadata = {
    ...updatedMetadata,
    avgTimeToAnswer: newAvgTime,
    stdDevTimeToAnswer: newStdDev,
  };
  
  // Recalculate difficulty adjustment
  updatedMetadata.difficultyAdjustment = calculateDifficultyAdjustment(review, updatedMetadata);
  
  // Update optimal review date
  updatedMetadata.optimalReviewDate = calculateOptimalReviewDate(review);
  
  // Update predicted retention
  updatedMetadata.predictedRetention = predictRetention(
    review,
    updatedMetadata,
    review.nextReviewDate
  );
  
  return updatedMetadata;
}

/**
 * Create initial advanced SR metadata for a new word
 * 
 * @returns Initial metadata
 */
export function createInitialAdvancedSRMetadata(): AdvancedSRMetadata {
  return {
    forgettingCurve: [],
    predictedRetention: 1.0,
    optimalReviewDate: Date.now(),
    difficultyAdjustment: 1.0,
    avgTimeToAnswer: 0,
    stdDevTimeToAnswer: 0,
  };
}

/**
 * Calculate adjusted interval with advanced SR
 * Applies difficulty adjustment to the base SM-2 interval
 * 
 * @param baseInterval - Base interval from SM-2 algorithm
 * @param metadata - Advanced SR metadata
 * @returns Adjusted interval in days
 */
export function calculateAdjustedInterval(
  baseInterval: number,
  metadata: AdvancedSRMetadata
): number {
  const adjustedInterval = baseInterval * metadata.difficultyAdjustment;
  return Math.max(1, Math.round(adjustedInterval));
}

/**
 * Get recommended review priority
 * Lower score = higher priority
 * 
 * @param review - Review record
 * @param metadata - Advanced SR metadata
 * @returns Priority score (0-1, lower is higher priority)
 */
export function getReviewPriority(
  review: ReviewRecord,
  metadata: AdvancedSRMetadata
): number {
  const now = Date.now();
  
  // Factor 1: How overdue is the review?
  const daysOverdue = Math.max(0, (now - review.nextReviewDate) / (24 * 60 * 60 * 1000));
  const overdueFactor = Math.min(1, daysOverdue / 7); // Cap at 1 week overdue
  
  // Factor 2: Predicted retention (lower retention = higher priority)
  const retentionFactor = 1 - metadata.predictedRetention;
  
  // Factor 3: Past performance (lower accuracy = higher priority)
  const accuracy = review.totalReviews > 0 
    ? review.correctCount / review.totalReviews 
    : 0.5;
  const accuracyFactor = 1 - accuracy;
  
  // Weighted combination
  const priority = (overdueFactor * 0.4) + (retentionFactor * 0.4) + (accuracyFactor * 0.2);
  
  return Math.max(0, Math.min(1, priority));
}

