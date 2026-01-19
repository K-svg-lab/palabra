/**
 * Spaced Repetition Algorithm (SM-2)
 * 
 * Implementation of the SuperMemo SM-2 algorithm for optimal vocabulary review scheduling.
 * 
 * Resources:
 * - Original SM-2 algorithm: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 * - Anki's modified implementation for reference
 * 
 * @module lib/utils/spaced-repetition
 */

import { SPACED_REPETITION } from '@/lib/constants/app';
import type { DifficultyRating, ReviewRecord } from '@/lib/types/vocabulary';

/**
 * SM-2 Algorithm Parameters
 * These control how the spaced repetition intervals are calculated
 */
const SM2_CONFIG = {
  /** Initial interval for first review (days) */
  FIRST_INTERVAL: 1,
  
  /** Interval for second review (days) */
  SECOND_INTERVAL: 6,
  
  /** Minimum interval (days) */
  MIN_INTERVAL: 1,
  
  /** Maximum interval (days) - ~1 year */
  MAX_INTERVAL: 365,
} as const;

/**
 * Calculate the next review interval based on the SM-2 algorithm
 * 
 * Algorithm logic:
 * 1. If "forgot": Reset to day 1 (restart learning)
 * 2. If first review: 1 day
 * 3. If second review: 6 days
 * 4. If third+ review: previous interval * ease factor
 * 
 * @param currentInterval - Current interval in days
 * @param repetition - Number of consecutive correct reviews
 * @param easeFactor - Current ease factor (SM-2 parameter)
 * @param rating - User's difficulty rating for this review
 * @returns New interval in days
 */
export function calculateNextInterval(
  currentInterval: number,
  repetition: number,
  easeFactor: number,
  rating: DifficultyRating
): number {
  // "Forgot" resets the learning process
  if (rating === 'forgot') {
    return SM2_CONFIG.FIRST_INTERVAL;
  }

  // First successful review
  if (repetition === 0) {
    return SM2_CONFIG.FIRST_INTERVAL;
  }

  // Second successful review
  if (repetition === 1) {
    return SM2_CONFIG.SECOND_INTERVAL;
  }

  // Third+ successful review: apply ease factor
  // Formula: new_interval = old_interval * ease_factor
  let newInterval = Math.round(currentInterval * easeFactor);

  // Apply rating-based modifiers to fine-tune the interval
  switch (rating) {
    case 'hard':
      // Hard: Reduce interval by 20%
      newInterval = Math.round(newInterval * 0.8);
      break;
    case 'easy':
      // Easy: Increase interval by 30%
      newInterval = Math.round(newInterval * 1.3);
      break;
    case 'good':
    default:
      // Good: Use calculated interval as-is
      break;
  }

  // Clamp interval to reasonable bounds
  return Math.max(
    SM2_CONFIG.MIN_INTERVAL,
    Math.min(newInterval, SM2_CONFIG.MAX_INTERVAL)
  );
}

/**
 * Calculate the new ease factor based on performance rating
 * 
 * SM-2 Ease Factor Formula (modified for simplicity):
 * - Easy: +0.15
 * - Good: no change
 * - Hard: -0.15
 * - Forgot: -0.2
 * 
 * Minimum ease factor is 1.3 (prevents intervals from becoming too short)
 * 
 * @param currentEaseFactor - Current ease factor
 * @param rating - User's difficulty rating
 * @returns New ease factor
 */
export function calculateEaseFactor(
  currentEaseFactor: number,
  rating: DifficultyRating
): number {
  let newEaseFactor = currentEaseFactor;

  switch (rating) {
    case 'easy':
      newEaseFactor += SPACED_REPETITION.EASY_BONUS;
      break;
    case 'hard':
      newEaseFactor += SPACED_REPETITION.HARD_PENALTY;
      break;
    case 'forgot':
      newEaseFactor += SPACED_REPETITION.FORGOT_PENALTY;
      break;
    case 'good':
    default:
      // No change for 'good' rating
      break;
  }

  // Ensure ease factor stays within reasonable bounds
  return Math.max(SPACED_REPETITION.MIN_EASE_FACTOR, newEaseFactor);
}

/**
 * Calculate the new repetition count
 * 
 * Repetition tracks consecutive correct reviews:
 * - Increments on any rating except "forgot"
 * - Resets to 0 on "forgot"
 * 
 * @param currentRepetition - Current repetition count
 * @param rating - User's difficulty rating
 * @returns New repetition count
 */
export function calculateRepetition(
  currentRepetition: number,
  rating: DifficultyRating
): number {
  if (rating === 'forgot') {
    return 0; // Reset on failure
  }
  return currentRepetition + 1; // Increment on success
}

/**
 * Calculate the next review date timestamp
 * 
 * @param interval - Interval in days
 * @param fromDate - Starting date (defaults to now)
 * @returns Timestamp for next review
 */
export function calculateNextReviewDate(
  interval: number,
  fromDate: number = Date.now()
): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return fromDate + (interval * millisecondsPerDay);
}

/**
 * Check if a review is due
 * 
 * @param nextReviewDate - Scheduled review date timestamp
 * @param currentDate - Current date timestamp (defaults to now)
 * @returns True if review is due
 */
export function isReviewDue(
  nextReviewDate: number,
  currentDate: number = Date.now()
): boolean {
  return nextReviewDate <= currentDate;
}

/**
 * Update a review record based on user performance
 * 
 * This is the main function that applies the SM-2 algorithm to update
 * all review tracking parameters after a review session.
 * 
 * @param currentReview - Current review record
 * @param rating - User's difficulty rating
 * @param reviewDate - Date of review (defaults to now)
 * @returns Updated review record
 */
export function updateReviewRecord(
  currentReview: ReviewRecord,
  rating: DifficultyRating,
  reviewDate: number = Date.now()
): ReviewRecord {
  // Calculate new parameters using SM-2 algorithm
  const newRepetition = calculateRepetition(currentReview.repetition, rating);
  const newEaseFactor = calculateEaseFactor(currentReview.easeFactor, rating);
  const newInterval = calculateNextInterval(
    currentReview.interval,
    currentReview.repetition,
    newEaseFactor,
    rating
  );
  const newNextReviewDate = calculateNextReviewDate(newInterval, reviewDate);

  // Update counts
  const newTotalReviews = currentReview.totalReviews + 1;
  const newCorrectCount = rating !== 'forgot' 
    ? currentReview.correctCount + 1 
    : currentReview.correctCount;
  const newIncorrectCount = rating === 'forgot' 
    ? currentReview.incorrectCount + 1 
    : currentReview.incorrectCount;

  return {
    ...currentReview,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetition: newRepetition,
    lastReviewDate: reviewDate,
    nextReviewDate: newNextReviewDate,
    totalReviews: newTotalReviews,
    correctCount: newCorrectCount,
    incorrectCount: newIncorrectCount,
  };
}

/**
 * Create an initial review record for a new vocabulary word
 * 
 * @param vocabId - Vocabulary word ID
 * @param initialReviewDate - Initial review date (defaults to now)
 * @returns New review record with SM-2 defaults
 */
export function createInitialReviewRecord(
  vocabId: string,
  initialReviewDate: number = Date.now()
): ReviewRecord {
  return {
    id: crypto.randomUUID(),
    vocabId,
    easeFactor: SPACED_REPETITION.INITIAL_EASE_FACTOR,
    interval: SPACED_REPETITION.INITIAL_INTERVAL,
    repetition: 0,
    lastReviewDate: null,
    nextReviewDate: initialReviewDate, // Available for review immediately
    totalReviews: 0,
    correctCount: 0,
    incorrectCount: 0,
  };
}

/**
 * Calculate accuracy percentage from review record
 * 
 * @param review - Review record
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(review: ReviewRecord): number {
  if (review.totalReviews === 0) {
    return 0;
  }
  return Math.round((review.correctCount / review.totalReviews) * 100);
}

/**
 * Determine vocabulary status based on review performance
 * 
 * Classification:
 * - new: Never reviewed or < 3 reviews
 * - learning: 3+ reviews but accuracy < 80% or repetition < 5
 * - mastered: 5+ consecutive correct reviews and accuracy >= 80%
 * 
 * @param review - Review record
 * @returns Vocabulary status
 */
export function determineVocabularyStatus(
  review: ReviewRecord
): 'new' | 'learning' | 'mastered' {
  const accuracy = calculateAccuracy(review);

  // Never reviewed or very few reviews
  if (review.totalReviews < 3) {
    return 'new';
  }

  // Mastered: 5+ consecutive correct reviews and high accuracy
  if (review.repetition >= 5 && accuracy >= 80) {
    return 'mastered';
  }

  // Still learning
  return 'learning';
}

/**
 * Format interval for human-readable display
 * 
 * Examples:
 * - 1 day
 * - 7 days
 * - 30 days (1 month)
 * - 365 days (1 year)
 * 
 * @param intervalDays - Interval in days
 * @returns Formatted string
 */
export function formatInterval(intervalDays: number): string {
  if (intervalDays === 1) {
    return '1 day';
  }
  
  if (intervalDays < 30) {
    return `${intervalDays} days`;
  }
  
  if (intervalDays < 365) {
    const months = Math.round(intervalDays / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  const years = Math.round(intervalDays / 365);
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Format next review date for display
 * 
 * @param nextReviewDate - Next review date timestamp
 * @param currentDate - Current date timestamp (defaults to now)
 * @returns Formatted string (e.g., "Today", "Tomorrow", "In 5 days")
 */
export function formatNextReviewDate(
  nextReviewDate: number,
  currentDate: number = Date.now()
): string {
  const diffMs = nextReviewDate - currentDate;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    return 'Overdue';
  }
  
  if (diffDays === 0) {
    return 'Today';
  }
  
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  
  if (diffDays < 7) {
    return `In ${diffDays} days`;
  }
  
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return weeks === 1 ? 'In 1 week' : `In ${weeks} weeks`;
  }
  
  const months = Math.round(diffDays / 30);
  return months === 1 ? 'In 1 month' : `In ${months} months`;
}

