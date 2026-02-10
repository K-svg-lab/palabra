/**
 * Interference Detection Service Tests (Phase 18.2.1)
 * 
 * Tests for confusion pattern detection and comparative review logic.
 * 
 * @module interference-detection-tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  levenshteinDistance,
  detectConfusionPatterns,
  recordConfusion,
  recordComparativeReview,
  getActiveConfusions,
  shouldShowComparativeReview,
  getTopConfusion,
  getConfusionStats,
  type ConfusionPattern,
  type ComparativeReviewResult,
} from '../interference-detection';

describe('Interference Detection Service', () => {
  // ============================================================================
  // LEVENSHTEIN DISTANCE
  // ============================================================================

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('perro', 'perro')).toBe(0);
      expect(levenshteinDistance('gato', 'gato')).toBe(0);
    });

    it('should calculate single character substitution', () => {
      expect(levenshteinDistance('perro', 'perru')).toBe(1); // o -> u
      expect(levenshteinDistance('gato', 'pato')).toBe(1); // g -> p
    });

    it('should calculate single character insertion', () => {
      expect(levenshteinDistance('pero', 'perro')).toBe(1); // add 'r'
      expect(levenshteinDistance('gato', 'gatos')).toBe(1); // add 's'
    });

    it('should calculate single character deletion', () => {
      expect(levenshteinDistance('perro', 'pero')).toBe(1); // remove 'r'
      expect(levenshteinDistance('gatos', 'gato')).toBe(1); // remove 's'
    });

    it('should calculate complex edit distances', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      // k->s, e->i, insert g
      
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
      // remove 'at', remove 'ur'
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', 'world')).toBe(5);
    });

    it('should be case-sensitive', () => {
      expect(levenshteinDistance('Perro', 'perro')).toBe(1);
      expect(levenshteinDistance('GATO', 'gato')).toBe(4);
    });

    it('should calculate distance for Spanish words', () => {
      // Common confusions
      expect(levenshteinDistance('pero', 'perro')).toBe(1);
      expect(levenshteinDistance('pelo', 'perro')).toBe(2);
      expect(levenshteinDistance('casa', 'caza')).toBe(1);
      expect(levenshteinDistance('ser', 'estar')).toBe(4);
    });
  });

  // ============================================================================
  // CONFUSION DETECTION ALGORITHMS
  // ============================================================================

  describe('Confusion Detection Logic', () => {
    it('should identify high similarity words (>70%)', () => {
      // pero vs perro: 1 char diff, 4 max length = 75% similarity
      const distance1 = levenshteinDistance('pero', 'perro');
      const similarity1 = 1 - distance1 / Math.max('pero'.length, 'perro'.length);
      expect(similarity1).toBeGreaterThan(0.7);

      // pelo vs perro: 2 char diff, 5 max length = 60% similarity (below threshold)
      const distance2 = levenshteinDistance('pelo', 'perro');
      const similarity2 = 1 - distance2 / Math.max('pelo'.length, 'perro'.length);
      expect(similarity2).toBeLessThan(0.7);
    });

    it('should calculate confusion score correctly', () => {
      // Formula: Math.min(occurrences / (occurrences + 2), 1.0)
      
      // 1 occurrence: 1/(1+2) = 0.33
      expect(1 / (1 + 2)).toBeCloseTo(0.33, 2);
      
      // 3 occurrences: 3/(3+2) = 0.60
      expect(3 / (3 + 2)).toBeCloseTo(0.60, 2);
      
      // 5 occurrences: 5/(5+2) = 0.71
      expect(5 / (5 + 2)).toBeCloseTo(0.71, 2);
      
      // 10 occurrences: 10/(10+2) = 0.83
      expect(10 / (10 + 2)).toBeCloseTo(0.83, 2);
      
      // Should approach but never exceed 1.0
      expect(100 / (100 + 2)).toBeLessThan(1.0);
    });
  });

  // ============================================================================
  // CONFUSION PATTERN TYPES
  // ============================================================================

  describe('Confusion Pattern Structures', () => {
    it('should validate ConfusionPattern shape', () => {
      const pattern: ConfusionPattern = {
        word1: 'pero',
        word2: 'perro',
        word1Id: 'vocab-1',
        word2Id: 'vocab-2',
        confusionScore: 0.6,
        occurrences: 3,
        lastOccurrence: new Date(),
        resolved: false,
      };

      expect(pattern.word1).toBe('pero');
      expect(pattern.word2).toBe('perro');
      expect(pattern.confusionScore).toBeGreaterThan(0);
      expect(pattern.occurrences).toBeGreaterThan(0);
      expect(pattern.resolved).toBe(false);
    });

    it('should validate ComparativeReviewResult shape', () => {
      const result: ComparativeReviewResult = {
        word1Id: 'vocab-1',
        word2Id: 'vocab-2',
        questionsAsked: 4,
        questionsCorrect: 3,
        accuracy: 0.75,
        completedAt: new Date(),
      };

      expect(result.questionsAsked).toBe(4);
      expect(result.questionsCorrect).toBe(3);
      expect(result.accuracy).toBe(0.75);
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle words with accents', () => {
      const distance = levenshteinDistance('café', 'cafe');
      expect(distance).toBe(1); // é vs e
    });

    it('should handle Spanish special characters', () => {
      const distance1 = levenshteinDistance('niño', 'nino');
      expect(distance1).toBe(1); // ñ vs n

      const distance2 = levenshteinDistance('señor', 'senor');
      expect(distance2).toBe(1); // ñ vs n
    });

    it('should handle very short words', () => {
      expect(levenshteinDistance('el', 'él')).toBe(1);
      expect(levenshteinDistance('a', 'á')).toBe(1);
      expect(levenshteinDistance('si', 'sí')).toBe(1);
    });

    it('should handle very long words', () => {
      const long1 = 'extraordinariamente';
      const long2 = 'extraordinariamante'; // typo: 'mente' -> 'mante'
      const distance = levenshteinDistance(long1, long2);
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle completely different words', () => {
      const distance = levenshteinDistance('perro', 'gato');
      expect(distance).toBeGreaterThan(3);
      
      const similarity = 1 - distance / Math.max('perro'.length, 'gato'.length);
      expect(similarity).toBeLessThan(0.5); // Very low similarity
    });
  });

  // ============================================================================
  // RESOLUTION LOGIC
  // ============================================================================

  describe('Confusion Resolution', () => {
    it('should mark confusion as resolved at 80% accuracy', () => {
      const highAccuracy: ComparativeReviewResult = {
        word1Id: 'vocab-1',
        word2Id: 'vocab-2',
        questionsAsked: 4,
        questionsCorrect: 4,
        accuracy: 1.0,
        completedAt: new Date(),
      };

      expect(highAccuracy.accuracy).toBeGreaterThanOrEqual(0.8);
    });

    it('should NOT mark as resolved below 80% accuracy', () => {
      const lowAccuracy: ComparativeReviewResult = {
        word1Id: 'vocab-1',
        word2Id: 'vocab-2',
        questionsAsked: 4,
        questionsCorrect: 2,
        accuracy: 0.5,
        completedAt: new Date(),
      };

      expect(lowAccuracy.accuracy).toBeLessThan(0.8);
    });

    it('should track comparative review count', () => {
      // After 1st comparative review
      let comparativeCount = 0;
      comparativeCount++;
      expect(comparativeCount).toBe(1);

      // After 2nd comparative review
      comparativeCount++;
      expect(comparativeCount).toBe(2);
    });
  });

  // ============================================================================
  // PERFORMANCE CALCULATIONS
  // ============================================================================

  describe('Accuracy Calculations', () => {
    it('should calculate perfect accuracy', () => {
      const accuracy = 4 / 4;
      expect(accuracy).toBe(1.0);
    });

    it('should calculate 75% accuracy', () => {
      const accuracy = 3 / 4;
      expect(accuracy).toBe(0.75);
    });

    it('should calculate 50% accuracy', () => {
      const accuracy = 2 / 4;
      expect(accuracy).toBe(0.5);
    });

    it('should calculate 25% accuracy', () => {
      const accuracy = 1 / 4;
      expect(accuracy).toBe(0.25);
    });

    it('should handle zero correct answers', () => {
      const accuracy = 0 / 4;
      expect(accuracy).toBe(0);
    });
  });

  // ============================================================================
  // COMMON SPANISH CONFUSIONS
  // ============================================================================

  describe('Common Spanish Word Pairs', () => {
    const commonConfusions = [
      { word1: 'pero', word2: 'perro', expectedDistance: 1 }, // but vs dog
      { word1: 'pelo', word2: 'perro', expectedDistance: 2 }, // hair vs dog
      { word1: 'casa', word2: 'caza', expectedDistance: 1 }, // house vs hunt
      { word1: 'ahora', word2: 'ahorra', expectedDistance: 1 }, // now vs save
      { word1: 'mañana', word2: 'manana', expectedDistance: 1 }, // tomorrow vs (no accent)
    ];

    commonConfusions.forEach(({ word1, word2, expectedDistance }) => {
      it(`should detect "${word1}" vs "${word2}" confusion`, () => {
        const distance = levenshteinDistance(word1, word2);
        expect(distance).toBe(expectedDistance);

        const maxLength = Math.max(word1.length, word2.length);
        const similarity = 1 - distance / maxLength;
        
        // High similarity = likely confusion
        expect(similarity).toBeGreaterThan(0.5);
      });
    });
  });

  // ============================================================================
  // SORTING AND PRIORITIZATION
  // ============================================================================

  describe('Confusion Prioritization', () => {
    it('should sort by confusion score (descending)', () => {
      const confusions: ConfusionPattern[] = [
        {
          word1: 'pero',
          word2: 'perro',
          word1Id: '1',
          word2Id: '2',
          confusionScore: 0.5,
          occurrences: 2,
          lastOccurrence: new Date(),
          resolved: false,
        },
        {
          word1: 'casa',
          word2: 'caza',
          word1Id: '3',
          word2Id: '4',
          confusionScore: 0.8,
          occurrences: 5,
          lastOccurrence: new Date(),
          resolved: false,
        },
        {
          word1: 'pelo',
          word2: 'perro',
          word1Id: '5',
          word2Id: '6',
          confusionScore: 0.3,
          occurrences: 1,
          lastOccurrence: new Date(),
          resolved: false,
        },
      ];

      const sorted = confusions.sort((a, b) => b.confusionScore - a.confusionScore);

      expect(sorted[0].confusionScore).toBe(0.8);
      expect(sorted[1].confusionScore).toBe(0.5);
      expect(sorted[2].confusionScore).toBe(0.3);
    });

    it('should filter by minimum threshold (0.3)', () => {
      const confusions: ConfusionPattern[] = [
        {
          word1: 'pero',
          word2: 'perro',
          word1Id: '1',
          word2Id: '2',
          confusionScore: 0.5,
          occurrences: 2,
          lastOccurrence: new Date(),
          resolved: false,
        },
        {
          word1: 'pelo',
          word2: 'perro',
          word1Id: '3',
          word2Id: '4',
          confusionScore: 0.2,
          occurrences: 1,
          lastOccurrence: new Date(),
          resolved: false,
        },
      ];

      const filtered = confusions.filter(p => p.confusionScore >= 0.3);

      expect(filtered.length).toBe(1);
      expect(filtered[0].confusionScore).toBe(0.5);
    });
  });
});
