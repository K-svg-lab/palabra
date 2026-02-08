/**
 * Hybrid SM-2 Integration Tests - Phase 18.1.6
 * 
 * Tests for SM-2 algorithm with:
 * - Method difficulty multipliers
 * - Quality adjustment based on response time
 * - Integration with 5 review methods
 * 
 * @module lib/utils/__tests__/spaced-repetition-hybrid.test.ts
 */

import { describe, test, expect } from '@jest/globals';
import {
  calculateNextInterval,
  calculateEaseFactor,
  calculateRepetition,
  updateReviewRecord,
  createInitialReviewRecord,
} from '../spaced-repetition';
import {
  calculateAdjustedQuality,
  ratingToQuality,
  getMethodDifficultyMultiplier,
  getResponseTimeCategory,
  isMethodWeakness,
  isMethodMastered,
  METHOD_DIFFICULTY_MULTIPLIERS,
  RESPONSE_TIME_THRESHOLDS,
} from '@/lib/constants/review-methods';
import type { ReviewRecord } from '@/lib/types/vocabulary';
import type { ReviewMethodType } from '@/lib/types/review-methods';

// ============================================================================
// Test Suite 1: Method Difficulty Multipliers
// ============================================================================

describe('Method Difficulty Multipliers', () => {
  test('should have correct multipliers for all methods', () => {
    expect(METHOD_DIFFICULTY_MULTIPLIERS['traditional']).toBe(1.0);
    expect(METHOD_DIFFICULTY_MULTIPLIERS['multiple-choice']).toBe(0.8);
    expect(METHOD_DIFFICULTY_MULTIPLIERS['audio-recognition']).toBe(1.2);
    expect(METHOD_DIFFICULTY_MULTIPLIERS['fill-blank']).toBe(1.1);
    expect(METHOD_DIFFICULTY_MULTIPLIERS['context-selection']).toBe(0.9);
  });

  test('should retrieve method multiplier correctly', () => {
    expect(getMethodDifficultyMultiplier('traditional')).toBe(1.0);
    expect(getMethodDifficultyMultiplier('audio-recognition')).toBe(1.2);
    expect(getMethodDifficultyMultiplier('multiple-choice')).toBe(0.8);
  });

  test('harder methods should have higher multipliers', () => {
    const audioMultiplier = getMethodDifficultyMultiplier('audio-recognition');
    const mcMultiplier = getMethodDifficultyMultiplier('multiple-choice');
    
    expect(audioMultiplier).toBeGreaterThan(mcMultiplier);
  });
});

// ============================================================================
// Test Suite 2: Quality Adjustment Based on Response Time
// ============================================================================

describe('Quality Adjustment - Response Time', () => {
  test('should convert ratings to quality scores', () => {
    expect(ratingToQuality('forgot')).toBe(0);
    expect(ratingToQuality('hard')).toBe(2);
    expect(ratingToQuality('good')).toBe(3);
    expect(ratingToQuality('easy')).toBe(4);
  });

  test('should categorize response times correctly', () => {
    expect(getResponseTimeCategory(1500, 'traditional')).toBe('very-fast');
    expect(getResponseTimeCategory(3000, 'traditional')).toBe('fast');
    expect(getResponseTimeCategory(7000, 'traditional')).toBe('moderate');
    expect(getResponseTimeCategory(15000, 'traditional')).toBe('slow');
    expect(getResponseTimeCategory(25000, 'traditional')).toBe('very-slow');
  });

  test('should adjust quality up for very fast responses', () => {
    const baseQuality = 3; // "good"
    const fastTime = 1500; // 1.5 seconds
    const adjusted = calculateAdjustedQuality(baseQuality, fastTime, 'traditional');
    
    expect(adjusted).toBeGreaterThan(baseQuality);
    expect(adjusted).toBe(4); // Should boost to "easy"
  });

  test('should adjust quality down for slow responses', () => {
    const baseQuality = 3; // "good"
    const slowTime = 15000; // 15 seconds
    const adjusted = calculateAdjustedQuality(baseQuality, slowTime, 'traditional');
    
    expect(adjusted).toBeLessThan(baseQuality);
    expect(adjusted).toBe(2.5); // Should penalize
  });

  test('should not adjust quality for moderate response times', () => {
    const baseQuality = 3; // "good"
    const moderateTime = 7000; // 7 seconds
    const adjusted = calculateAdjustedQuality(baseQuality, moderateTime, 'traditional');
    
    expect(adjusted).toBe(baseQuality);
  });

  test('should adjust thresholds based on method type', () => {
    const fastTime = 3000; // 3 seconds
    
    // Multiple-choice should be faster (0.7x multiplier)
    const mcCategory = getResponseTimeCategory(fastTime, 'multiple-choice');
    // Audio should be slower (1.3x multiplier)
    const audioCategory = getResponseTimeCategory(fastTime, 'audio-recognition');
    
    // 3 seconds is "fast" for multiple-choice but "very-fast" for audio
    expect(mcCategory).not.toBe(audioCategory);
  });

  test('should clamp adjusted quality to 0-5 range', () => {
    // Test lower bound
    const lowQuality = calculateAdjustedQuality(0, 30000, 'traditional');
    expect(lowQuality).toBeGreaterThanOrEqual(0);
    
    // Test upper bound
    const highQuality = calculateAdjustedQuality(5, 500, 'traditional');
    expect(highQuality).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// Test Suite 3: SM-2 Integration with Difficulty Multipliers
// ============================================================================

describe('SM-2 with Difficulty Multipliers', () => {
  test('should calculate longer intervals for harder methods on success', () => {
    const baseInterval = 10;
    const repetition = 2;
    const easeFactor = 2.5;
    const rating = 'good';
    
    // Traditional method (baseline)
    const traditionalInterval = calculateNextInterval(
      baseInterval,
      repetition,
      easeFactor,
      rating,
      1.0 // traditional multiplier
    );
    
    // Audio method (harder)
    const audioInterval = calculateNextInterval(
      baseInterval,
      repetition,
      easeFactor,
      rating,
      1.2 // audio multiplier
    );
    
    // Multiple-choice (easier)
    const mcInterval = calculateNextInterval(
      baseInterval,
      repetition,
      easeFactor,
      rating,
      0.8 // multiple-choice multiplier
    );
    
    expect(audioInterval).toBeGreaterThan(traditionalInterval);
    expect(mcInterval).toBeLessThan(traditionalInterval);
  });

  test('should handle first and second reviews correctly regardless of multiplier', () => {
    const easeFactor = 2.5;
    const rating = 'good';
    
    // First review (repetition = 0)
    const firstReview = calculateNextInterval(0, 0, easeFactor, rating, 1.2);
    expect(firstReview).toBe(1); // Always 1 day
    
    // Second review (repetition = 1)
    const secondReview = calculateNextInterval(1, 1, easeFactor, rating, 1.2);
    expect(secondReview).toBe(6); // Always 6 days
  });

  test('should apply multiplier to third+ reviews only', () => {
    const baseInterval = 6;
    const repetition = 2;
    const easeFactor = 2.5;
    const rating = 'good';
    
    const interval = calculateNextInterval(
      baseInterval,
      repetition,
      easeFactor,
      rating,
      1.5 // 50% bonus
    );
    
    // Expected: 6 * 2.5 * 1.5 = 22.5 → 23 (rounded)
    expect(interval).toBeCloseTo(23, 0);
  });

  test('should reset interval for "forgot" rating regardless of multiplier', () => {
    const interval = calculateNextInterval(30, 5, 2.5, 'forgot', 1.5);
    expect(interval).toBe(1); // Always resets to 1
  });
});

// ============================================================================
// Test Suite 4: UpdateReviewRecord with Quality Adjustment
// ============================================================================

describe('UpdateReviewRecord - Quality Adjustment Integration', () => {
  let initialReview: ReviewRecord;

  beforeEach(() => {
    initialReview = createInitialReviewRecord('test-vocab-id');
    // Advance to third review
    initialReview.repetition = 2;
    initialReview.interval = 6;
    initialReview.easeFactor = 2.5;
  });

  test('should apply quality adjustment when response time provided', () => {
    // Very fast response (1 second) with "good" rating
    // Should be adjusted to "easy"
    const updated = updateReviewRecord(
      initialReview,
      'good',
      Date.now(),
      'spanish-to-english',
      1.0, // traditional method
      1000, // 1 second (very fast)
      'traditional'
    );
    
    // Check that interval increased more than expected for "good"
    // Good: 6 * 2.5 = 15
    // Easy: 6 * 2.5 * 1.3 = 19.5
    expect(updated.interval).toBeGreaterThan(15);
  });

  test('should penalize slow responses', () => {
    // Slow response (15 seconds) with "good" rating
    // Should be adjusted down to "hard"
    const updated = updateReviewRecord(
      initialReview,
      'good',
      Date.now(),
      'spanish-to-english',
      1.0,
      15000, // 15 seconds (slow)
      'traditional'
    );
    
    // Check that interval increased less than expected for "good"
    const goodInterval = 6 * 2.5; // 15
    expect(updated.interval).toBeLessThan(goodInterval);
  });

  test('should not adjust quality for "forgot" rating', () => {
    const updated = updateReviewRecord(
      initialReview,
      'forgot',
      Date.now(),
      'spanish-to-english',
      1.0,
      500, // Even with very fast time
      'traditional'
    );
    
    // "forgot" should always reset
    expect(updated.interval).toBe(1);
    expect(updated.repetition).toBe(0);
  });

  test('should work without response time (backward compatible)', () => {
    const updated = updateReviewRecord(
      initialReview,
      'good',
      Date.now(),
      'spanish-to-english',
      1.0
      // No responseTime or reviewMethod
    );
    
    // Should use base rating without adjustment
    expect(updated.interval).toBeGreaterThan(initialReview.interval);
  });

  test('should combine difficulty multiplier and quality adjustment', () => {
    // Audio method (1.2x) with very fast response (quality boost)
    const fastAudio = updateReviewRecord(
      initialReview,
      'good',
      Date.now(),
      'spanish-to-english',
      1.2, // audio multiplier
      1000, // very fast
      'audio-recognition'
    );
    
    // Traditional method (1.0x) with slow response (quality penalty)
    const slowTraditional = updateReviewRecord(
      initialReview,
      'good',
      Date.now(),
      'spanish-to-english',
      1.0,
      15000, // slow
      'traditional'
    );
    
    // Fast audio should have much longer interval than slow traditional
    expect(fastAudio.interval).toBeGreaterThan(slowTraditional.interval * 1.5);
  });
});

// ============================================================================
// Test Suite 5: Method Performance Tracking
// ============================================================================

describe('Method Performance Tracking', () => {
  test('should identify method weakness', () => {
    expect(isMethodWeakness(0.65, 10)).toBe(true); // 65% < 70%
    expect(isMethodWeakness(0.75, 10)).toBe(false); // 75% > 70%
  });

  test('should identify method mastery', () => {
    expect(isMethodMastered(0.90, 10)).toBe(true); // 90% > 85%
    expect(isMethodMastered(0.80, 10)).toBe(false); // 80% < 85%
  });

  test('should require minimum attempts for classification', () => {
    // Not enough data (< 5 attempts)
    expect(isMethodWeakness(0.50, 3)).toBe(false);
    expect(isMethodMastered(0.95, 3)).toBe(false);
    
    // Enough data (>= 5 attempts)
    expect(isMethodWeakness(0.50, 5)).toBe(true);
    expect(isMethodMastered(0.95, 5)).toBe(true);
  });
});

// ============================================================================
// Test Suite 6: Edge Cases and Boundary Conditions
// ============================================================================

describe('Edge Cases - SM-2 Hybrid', () => {
  test('should handle zero response time', () => {
    const quality = calculateAdjustedQuality(3, 0, 'traditional');
    expect(quality).toBeGreaterThanOrEqual(0);
    expect(quality).toBeLessThanOrEqual(5);
  });

  test('should handle extremely long response time', () => {
    const quality = calculateAdjustedQuality(3, 999999, 'traditional');
    expect(quality).toBeGreaterThanOrEqual(0);
    expect(quality).toBeLessThanOrEqual(5);
  });

  test('should handle zero difficulty multiplier', () => {
    const interval = calculateNextInterval(10, 2, 2.5, 'good', 0);
    expect(interval).toBeGreaterThanOrEqual(1); // Min interval
  });

  test('should handle very high difficulty multiplier', () => {
    const interval = calculateNextInterval(10, 2, 2.5, 'good', 10);
    expect(interval).toBeLessThanOrEqual(365); // Max interval
  });

  test('should handle negative quality (edge case)', () => {
    // Should clamp to 0
    const quality = calculateAdjustedQuality(-5, 5000, 'traditional');
    expect(quality).toBe(0);
  });

  test('should handle quality above 5 (edge case)', () => {
    // Should clamp to 5
    const quality = calculateAdjustedQuality(10, 500, 'traditional');
    expect(quality).toBe(5);
  });
});

// ============================================================================
// Test Suite 7: Integration Scenarios
// ============================================================================

describe('Integration Scenarios', () => {
  test('Scenario: User masters word with varied methods', () => {
    let review = createInitialReviewRecord('test-word');
    
    // Review 1: Multiple-choice (easy method), fast response
    review = updateReviewRecord(
      review,
      'good',
      Date.now(),
      'spanish-to-english',
      0.8, // multiple-choice multiplier
      2000, // fast
      'multiple-choice'
    );
    expect(review.repetition).toBe(1);
    
    // Review 2: Audio (hard method), moderate response
    review = updateReviewRecord(
      review,
      'good',
      Date.now(),
      'spanish-to-english',
      1.2, // audio multiplier
      7000, // moderate
      'audio-recognition'
    );
    expect(review.repetition).toBe(2);
    
    // Review 3: Fill-blank (medium-hard), very fast response
    review = updateReviewRecord(
      review,
      'good',
      Date.now(),
      'spanish-to-english',
      1.1, // fill-blank multiplier
      1500, // very fast
      'fill-blank'
    );
    expect(review.repetition).toBe(3);
    
    // Should have progressing intervals
    expect(review.interval).toBeGreaterThan(6);
  });

  test('Scenario: User struggles with word', () => {
    let review = createInitialReviewRecord('difficult-word');
    
    // Review 1: Traditional, slow response, rated hard
    review = updateReviewRecord(
      review,
      'hard',
      Date.now(),
      'spanish-to-english',
      1.0,
      18000, // slow
      'traditional'
    );
    
    // Should have low ease factor
    expect(review.easeFactor).toBeLessThan(2.5);
    
    // Review 2: Forgot
    review = updateReviewRecord(
      review,
      'forgot',
      Date.now(),
      'spanish-to-english',
      1.0,
      30000,
      'traditional'
    );
    
    // Should reset
    expect(review.interval).toBe(1);
    expect(review.repetition).toBe(0);
  });

  test('Scenario: Consistent performance with audio method', () => {
    let review = createInitialReviewRecord('audio-word');
    
    // Simulate 5 successful audio reviews with varying times
    const responseTimes = [2000, 1800, 1500, 1200, 1000]; // Improving
    
    for (let i = 0; i < 5; i++) {
      review = updateReviewRecord(
        review,
        'good',
        Date.now(),
        'spanish-to-english',
        1.2, // audio multiplier
        responseTimes[i],
        'audio-recognition'
      );
    }
    
    // Should have long interval due to:
    // 1. Audio difficulty bonus (1.2x)
    // 2. Fast response times (quality boost)
    // 3. Consecutive successes
    expect(review.interval).toBeGreaterThan(20);
    expect(review.repetition).toBe(5);
  });
});

// ============================================================================
// Test Suite 8: Backward Compatibility
// ============================================================================

describe('Backward Compatibility', () => {
  test('should work without difficulty multiplier (default to 1.0)', () => {
    const review = createInitialReviewRecord('test');
    const updated = updateReviewRecord(review, 'good');
    
    expect(updated.repetition).toBe(1);
    expect(updated.interval).toBeGreaterThan(0);
  });

  test('should work without response time and method', () => {
    const review = createInitialReviewRecord('test');
    review.repetition = 2;
    review.interval = 6;
    
    const updated = updateReviewRecord(
      review,
      'good',
      Date.now(),
      'spanish-to-english',
      1.0
    );
    
    // Should use base SM-2 without adjustment
    const expectedInterval = 6 * 2.5; // 15
    expect(updated.interval).toBeCloseTo(expectedInterval, 0);
  });

  test('should maintain existing SM-2 behavior for forgot rating', () => {
    const review = createInitialReviewRecord('test');
    review.repetition = 5;
    review.interval = 30;
    
    const updated = updateReviewRecord(
      review,
      'forgot',
      Date.now(),
      'spanish-to-english',
      1.5, // Even with high multiplier
      500, // Even with fast time
      'audio-recognition'
    );
    
    expect(updated.interval).toBe(1);
    expect(updated.repetition).toBe(0);
  });
});

// ============================================================================
// Test Suite 9: Response Time Threshold Validation
// ============================================================================

describe('Response Time Thresholds', () => {
  test('should have reasonable threshold values', () => {
    expect(RESPONSE_TIME_THRESHOLDS.VERY_FAST).toBe(2000);
    expect(RESPONSE_TIME_THRESHOLDS.FAST).toBe(5000);
    expect(RESPONSE_TIME_THRESHOLDS.MODERATE).toBe(10000);
    expect(RESPONSE_TIME_THRESHOLDS.SLOW).toBe(20000);
    expect(RESPONSE_TIME_THRESHOLDS.VERY_SLOW).toBe(20000);
  });

  test('should have progressively increasing thresholds', () => {
    expect(RESPONSE_TIME_THRESHOLDS.VERY_FAST)
      .toBeLessThan(RESPONSE_TIME_THRESHOLDS.FAST);
    expect(RESPONSE_TIME_THRESHOLDS.FAST)
      .toBeLessThan(RESPONSE_TIME_THRESHOLDS.MODERATE);
    expect(RESPONSE_TIME_THRESHOLDS.MODERATE)
      .toBeLessThan(RESPONSE_TIME_THRESHOLDS.SLOW);
  });
});

// ============================================================================
// Test Suite 10: Comprehensive Accuracy Test
// ============================================================================

describe('Comprehensive Accuracy Test', () => {
  test('should produce consistent results across methods and times', () => {
    const scenarios: Array<{
      method: ReviewMethodType;
      rating: 'hard' | 'good' | 'easy';
      responseTime: number;
      expectedCategory: 'low' | 'medium' | 'high';
    }> = [
      {
        method: 'audio-recognition',
        rating: 'good',
        responseTime: 1000,
        expectedCategory: 'high', // Hard method + fast time
      },
      {
        method: 'multiple-choice',
        rating: 'good',
        responseTime: 10000,
        expectedCategory: 'low', // Easy method + slow time
      },
      {
        method: 'traditional',
        rating: 'good',
        responseTime: 5000,
        expectedCategory: 'medium', // Medium method + medium time
      },
    ];

    const baseReview = createInitialReviewRecord('test');
    baseReview.repetition = 2;
    baseReview.interval = 6;

    const results = scenarios.map(scenario => {
      const multiplier = getMethodDifficultyMultiplier(scenario.method);
      const updated = updateReviewRecord(
        baseReview,
        scenario.rating,
        Date.now(),
        'spanish-to-english',
        multiplier,
        scenario.responseTime,
        scenario.method
      );
      return {
        scenario,
        interval: updated.interval,
      };
    });

    // High interval scenario should be highest
    const highInterval = results.find(r => r.scenario.expectedCategory === 'high')!.interval;
    const lowInterval = results.find(r => r.scenario.expectedCategory === 'low')!.interval;
    const mediumInterval = results.find(r => r.scenario.expectedCategory === 'medium')!.interval;

    expect(highInterval).toBeGreaterThan(mediumInterval);
    expect(mediumInterval).toBeGreaterThan(lowInterval);
  });
});
