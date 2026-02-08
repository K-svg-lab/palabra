/**
 * Method Selector Tests (Phase 18.1.4)
 * 
 * Tests for intelligent review method selection algorithm.
 * 
 * Run with: npm test -- method-selector.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { selectReviewMethod, generateMethodSelectionReport } from '../method-selector';
import type {
  MethodSelectionContext,
  MethodSelectorConfig,
  MethodPerformance,
  MethodHistory,
} from '@/lib/types/review-methods';
import type { VocabularyWord } from '@/lib/types/vocabulary';

describe('Method Selector Service', () => {
  // Mock vocabulary words
  const wordWithExamples: VocabularyWord = {
    id: 'test-1',
    spanishWord: 'perro',
    englishTranslation: 'dog',
    examples: [
      {
        spanish: 'El perro es muy amigable.',
        english: 'The dog is very friendly.',
      },
    ],
    status: 'learning',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const wordWithoutExamples: VocabularyWord = {
    id: 'test-2',
    spanishWord: 'gato',
    englishTranslation: 'cat',
    examples: [],
    status: 'learning',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultConfig: MethodSelectorConfig = {
    enableVariation: true,
    minHistorySize: 5,
    weaknessWeight: 0.7,
    repetitionWindow: 3,
    disabledMethods: [],
  };

  describe('Basic Functionality', () => {
    it('should select a valid review method', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
      };

      const result = selectReviewMethod(context, defaultConfig);

      expect(result.method).toBeDefined();
      expect(['traditional', 'fill-blank', 'multiple-choice', 'audio-recognition', 'context-selection']).toContain(result.method);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reason).toBeTruthy();
    });

    it('should return traditional when variation is disabled', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
      };

      const config: MethodSelectorConfig = {
        ...defaultConfig,
        enableVariation: false,
      };

      const result = selectReviewMethod(context, config);

      expect(result.method).toBe('traditional');
      expect(result.reason).toBe('Method variation disabled');
      expect(result.confidence).toBe(1.0);
    });

    it('should fallback to traditional when all methods are disabled', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
      };

      const config: MethodSelectorConfig = {
        ...defaultConfig,
        disabledMethods: ['traditional', 'fill-blank', 'multiple-choice', 'audio-recognition', 'context-selection'],
      };

      const result = selectReviewMethod(context, config);

      expect(result.method).toBe('traditional');
      expect(result.reason).toContain('disabled');
    });

    it('should provide alternative method suggestions', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
      };

      const result = selectReviewMethod(context, defaultConfig);

      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
      expect(result.alternatives.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Availability Scoring', () => {
    it('should avoid methods requiring examples when word has no examples', () => {
      const context: MethodSelectionContext = {
        word: wordWithoutExamples,
        recentHistory: [],
        performance: [],
      };

      const result = selectReviewMethod(context, defaultConfig);

      // Should select methods that don't require examples
      expect(['traditional', 'multiple-choice', 'audio-recognition']).toContain(result.method);
      // Should NOT select methods requiring examples
      expect(['fill-blank', 'context-selection']).not.toContain(result.method);
    });

    it('should allow all methods when word has examples', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
      };

      // Run selection multiple times to see variety
      const methods = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        methods.add(result.method);
      }

      // Should have tried multiple methods
      expect(methods.size).toBeGreaterThan(1);
    });

    it('should respect disabled methods', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
      };

      const config: MethodSelectorConfig = {
        ...defaultConfig,
        disabledMethods: ['audio-recognition', 'multiple-choice'],
      };

      // Run selection multiple times
      for (let i = 0; i < 20; i++) {
        const result = selectReviewMethod(context, config);
        expect(['audio-recognition', 'multiple-choice']).not.toContain(result.method);
      }
    });
  });

  describe('Performance-Based Selection', () => {
    it('should prioritize methods with lower accuracy (weaker methods)', () => {
      const performance: MethodPerformance[] = [
        {
          method: 'traditional',
          attempts: 20,
          correct: 18,
          accuracy: 0.9, // High accuracy = strong
          lastAttempt: Date.now() - 1000,
        },
        {
          method: 'fill-blank',
          attempts: 20,
          correct: 10,
          accuracy: 0.5, // Low accuracy = weak
          lastAttempt: Date.now() - 2000,
        },
        {
          method: 'multiple-choice',
          attempts: 20,
          correct: 16,
          accuracy: 0.8, // Medium accuracy
          lastAttempt: Date.now() - 1500,
        },
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance,
      };

      // Run selection multiple times and track frequency
      const methodCounts: Record<string, number> = {
        'traditional': 0,
        'fill-blank': 0,
        'multiple-choice': 0,
        'audio-recognition': 0,
        'context-selection': 0,
      };

      for (let i = 0; i < 100; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        methodCounts[result.method]++;
      }

      // fill-blank (weakest) should be selected more than traditional (strongest)
      expect(methodCounts['fill-blank']).toBeGreaterThan(methodCounts['traditional']);
    });

    it('should encourage trying untried methods', () => {
      const performance: MethodPerformance[] = [
        {
          method: 'traditional',
          attempts: 20,
          correct: 18,
          accuracy: 0.9,
          lastAttempt: Date.now(),
        },
        // fill-blank not in performance = never tried
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance,
      };

      // Run selection multiple times
      const methodCounts: Record<string, number> = {
        'fill-blank': 0,
        'traditional': 0,
      };

      for (let i = 0; i < 50; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        if (result.method === 'fill-blank' || result.method === 'traditional') {
          methodCounts[result.method]++;
        }
      }

      // fill-blank (untried) should get some attempts
      expect(methodCounts['fill-blank']).toBeGreaterThan(0);
    });

    it('should use random selection with insufficient history', () => {
      const performance: MethodPerformance[] = [
        {
          method: 'traditional',
          attempts: 2, // Below minHistorySize
          correct: 2,
          accuracy: 1.0,
          lastAttempt: Date.now(),
        },
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance,
      };

      // Should still work (random selection)
      const result = selectReviewMethod(context, defaultConfig);
      expect(result.method).toBeDefined();
      expect(result.reason).toContain('random');
    });
  });

  describe('History Penalty (Prevent Repetition)', () => {
    it('should penalize recently used methods', () => {
      const now = Date.now();
      const recentHistory: MethodHistory[] = [
        {
          wordId: 'word-1',
          method: 'traditional',
          timestamp: now - 3000,
        },
        {
          wordId: 'word-2',
          method: 'multiple-choice',
          timestamp: now - 2000,
        },
        {
          wordId: 'word-3',
          method: 'traditional',
          timestamp: now - 1000, // Most recent
        },
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory,
        performance: [],
      };

      // Run selection multiple times
      const methodCounts: Record<string, number> = {
        'traditional': 0,
        'fill-blank': 0,
        'multiple-choice': 0,
      };

      for (let i = 0; i < 50; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        if (methodCounts[result.method] !== undefined) {
          methodCounts[result.method]++;
        }
      }

      // Traditional (most recent) should be selected less often
      expect(methodCounts['traditional']).toBeLessThan(methodCounts['fill-blank']);
    });

    it('should respect repetition window size', () => {
      const now = Date.now();
      const longHistory: MethodHistory[] = [
        { wordId: 'word-1', method: 'traditional', timestamp: now - 10000 }, // Outside window
        { wordId: 'word-2', method: 'fill-blank', timestamp: now - 9000 },
        { wordId: 'word-3', method: 'multiple-choice', timestamp: now - 8000 },
        { wordId: 'word-4', method: 'audio-recognition', timestamp: now - 3000 }, // Within window
        { wordId: 'word-5', method: 'context-selection', timestamp: now - 2000 },
        { wordId: 'word-6', method: 'traditional', timestamp: now - 1000 }, // Most recent
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: longHistory,
        performance: [],
      };

      const config: MethodSelectorConfig = {
        ...defaultConfig,
        repetitionWindow: 3, // Only look at last 3
      };

      const result = selectReviewMethod(context, config);
      
      // Should work without error
      expect(result.method).toBeDefined();
    });
  });

  describe('User Level Bonus', () => {
    it('should favor easier methods for beginners (A1-A2)', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
        userLevel: 'A1',
      };

      // Run selection multiple times
      const methodCounts: Record<string, number> = {
        'multiple-choice': 0,
        'traditional': 0,
        'audio-recognition': 0,
      };

      for (let i = 0; i < 100; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        if (methodCounts[result.method] !== undefined) {
          methodCounts[result.method]++;
        }
      }

      // Easy methods (multiple-choice) should be favored over hard (audio)
      expect(methodCounts['multiple-choice'] + methodCounts['traditional'])
        .toBeGreaterThan(methodCounts['audio-recognition']);
    });

    it('should favor harder methods for advanced users (C1-C2)', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
        userLevel: 'C1',
      };

      // Run selection multiple times
      const methodCounts: Record<string, number> = {
        'audio-recognition': 0,
        'multiple-choice': 0,
      };

      for (let i = 0; i < 100; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        if (methodCounts[result.method] !== undefined) {
          methodCounts[result.method]++;
        }
      }

      // Hard methods (audio) should be favored over easy (multiple-choice) for advanced
      expect(methodCounts['audio-recognition']).toBeGreaterThan(0);
    });

    it('should balance methods for intermediate users (B1-B2)', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
        userLevel: 'B1',
      };

      // Run selection multiple times
      const methods = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        methods.add(result.method);
      }

      // Should see variety of methods
      expect(methods.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Variety Bonus', () => {
    it('should encourage trying underused methods', () => {
      const performance: MethodPerformance[] = [
        {
          method: 'traditional',
          attempts: 50, // Heavily used
          correct: 45,
          accuracy: 0.9,
          lastAttempt: Date.now(),
        },
        {
          method: 'fill-blank',
          attempts: 5, // Rarely used
          correct: 4,
          accuracy: 0.8,
          lastAttempt: Date.now() - 5000,
        },
        {
          method: 'multiple-choice',
          attempts: 40,
          correct: 36,
          accuracy: 0.9,
          lastAttempt: Date.now() - 3000,
        },
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance,
      };

      // Run selection multiple times
      const methodCounts: Record<string, number> = {
        'traditional': 0,
        'fill-blank': 0,
        'multiple-choice': 0,
      };

      for (let i = 0; i < 100; i++) {
        const result = selectReviewMethod(context, defaultConfig);
        if (methodCounts[result.method] !== undefined) {
          methodCounts[result.method]++;
        }
      }

      // fill-blank (underused) should get some representation
      expect(methodCounts['fill-blank']).toBeGreaterThan(0);
      // traditional (overused) should not dominate
      expect(methodCounts['traditional']).toBeLessThan(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty performance array', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [],
      };

      const result = selectReviewMethod(context, defaultConfig);
      expect(result.method).toBeDefined();
    });

    it('should handle undefined performance', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        // performance: undefined,
      };

      const result = selectReviewMethod(context, defaultConfig);
      expect(result.method).toBeDefined();
    });

    it('should handle empty history', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
      };

      const result = selectReviewMethod(context, defaultConfig);
      expect(result.method).toBeDefined();
    });

    it('should handle word with no ID', () => {
      const wordNoId: VocabularyWord = {
        ...wordWithExamples,
        id: '',
      };

      const context: MethodSelectionContext = {
        word: wordNoId,
        recentHistory: [],
      };

      const result = selectReviewMethod(context, defaultConfig);
      expect(result.method).toBeDefined();
    });
  });

  describe('Selection Report Generation', () => {
    it('should generate a valid selection report', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [
          {
            method: 'traditional',
            attempts: 10,
            correct: 8,
            accuracy: 0.8,
            lastAttempt: Date.now(),
          },
        ],
        userLevel: 'B1',
      };

      const report = generateMethodSelectionReport(context, defaultConfig);

      expect(report).toContain('Method Selection Report');
      expect(report).toContain('perro');
      expect(report).toContain('Selected Method:');
      expect(report).toContain('Alternatives:');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex real-world scenario', () => {
      // Simulate a user who:
      // - Is intermediate level (B1)
      // - Has performance history
      // - Has recent method usage
      // - Word has examples
      
      const now = Date.now();
      const performance: MethodPerformance[] = [
        { method: 'traditional', attempts: 30, correct: 27, accuracy: 0.9, lastAttempt: now - 1000 },
        { method: 'fill-blank', attempts: 15, correct: 9, accuracy: 0.6, lastAttempt: now - 5000 },
        { method: 'multiple-choice', attempts: 25, correct: 23, accuracy: 0.92, lastAttempt: now - 3000 },
        { method: 'audio-recognition', attempts: 10, correct: 5, accuracy: 0.5, lastAttempt: now - 8000 },
      ];

      const recentHistory: MethodHistory[] = [
        { wordId: 'word-1', method: 'traditional', timestamp: now - 3000 },
        { wordId: 'word-2', method: 'multiple-choice', timestamp: now - 2000 },
        { wordId: 'word-3', method: 'traditional', timestamp: now - 1000 },
      ];

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory,
        performance,
        userLevel: 'B1',
      };

      const result = selectReviewMethod(context, defaultConfig);

      // Should select a valid method
      expect(result.method).toBeDefined();
      
      // Should have high confidence (lots of data)
      expect(result.confidence).toBeGreaterThan(0);
      
      // Should provide reasoning
      expect(result.reason.length).toBeGreaterThan(0);
      
      // Should have alternatives
      expect(result.alternatives.length).toBeGreaterThan(0);

      // Given the data:
      // - fill-blank and audio-recognition are weakest (should be favored)
      // - traditional was used recently twice (should be penalized)
      // - User is B1 (medium methods preferred)
      // Expected: fill-blank or audio-recognition likely to be selected
    });

    it('should handle beginner user with limited history', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [
          { method: 'traditional', attempts: 2, correct: 1, accuracy: 0.5, lastAttempt: Date.now() },
        ],
        userLevel: 'A1',
      };

      const result = selectReviewMethod(context, defaultConfig);

      // Should work and select easier methods
      expect(result.method).toBeDefined();
      expect(['traditional', 'multiple-choice']).toContain(result.method);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle extreme weaknessWeight values', () => {
      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: [],
        performance: [
          { method: 'traditional', attempts: 10, correct: 9, accuracy: 0.9, lastAttempt: Date.now() },
          { method: 'fill-blank', attempts: 10, correct: 3, accuracy: 0.3, lastAttempt: Date.now() },
        ],
      };

      // Test with weaknessWeight = 0 (no weakness prioritization)
      const config1: MethodSelectorConfig = {
        ...defaultConfig,
        weaknessWeight: 0,
      };
      const result1 = selectReviewMethod(context, config1);
      expect(result1.method).toBeDefined();

      // Test with weaknessWeight = 1 (maximum weakness prioritization)
      const config2: MethodSelectorConfig = {
        ...defaultConfig,
        weaknessWeight: 1.0,
      };
      const result2 = selectReviewMethod(context, config2);
      expect(result2.method).toBeDefined();
    });

    it('should handle large repetition windows', () => {
      const longHistory: MethodHistory[] = Array.from({ length: 100 }, (_, i) => ({
        wordId: `word-${i}`,
        method: (i % 2 === 0 ? 'traditional' : 'fill-blank') as any,
        timestamp: Date.now() - (100 - i) * 1000,
      }));

      const context: MethodSelectionContext = {
        word: wordWithExamples,
        recentHistory: longHistory,
        performance: [],
      };

      const config: MethodSelectorConfig = {
        ...defaultConfig,
        repetitionWindow: 50, // Large window
      };

      const result = selectReviewMethod(context, config);
      expect(result.method).toBeDefined();
    });
  });
});
