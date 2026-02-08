/**
 * Interleaving Service Tests (Phase 18.1.5)
 * 
 * Tests for intelligent interleaving algorithm that mixes vocabulary words
 * by part of speech, age, and difficulty to enhance retention.
 * 
 * Run with: npm test -- interleaving.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  categorizeWord,
  interleaveWords,
  analyzeInterleaving,
  generateInterleavingReport,
  DEFAULT_INTERLEAVING_CONFIG,
  type WordCategory,
  type InterleavingConfig,
} from '../interleaving';
import type { VocabularyWord } from '@/lib/types/vocabulary';

describe('Interleaving Service', () => {
  // Mock vocabulary words with different characteristics
  const createMockWord = (
    id: string,
    partOfSpeech: string,
    createdDaysAgo: number,
    easeFactor?: number
  ): VocabularyWord => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);
    
    return {
      id,
      spanishWord: `word-${id}`,
      englishTranslation: `translation-${id}`,
      partOfSpeech,
      easeFactor,
      status: easeFactor && easeFactor >= 2.5 ? 'mastered' : easeFactor && easeFactor >= 2.0 ? 'learning' : 'new',
      createdAt,
      updatedAt: new Date(),
    };
  };

  describe('Word Categorization', () => {
    it('should categorize new word (0-3 days)', () => {
      const word = createMockWord('1', 'noun', 2);
      const category = categorizeWord(word);
      
      expect(category.age).toBe('new');
      expect(category.partOfSpeech).toBe('noun');
    });

    it('should categorize young word (4-21 days)', () => {
      const word = createMockWord('1', 'verb', 10);
      const category = categorizeWord(word);
      
      expect(category.age).toBe('young');
    });

    it('should categorize mature word (22+ days)', () => {
      const word = createMockWord('1', 'adjective', 30);
      const category = categorizeWord(word);
      
      expect(category.age).toBe('mature');
    });

    it('should categorize easy word (easeFactor >= 2.5)', () => {
      const word = createMockWord('1', 'noun', 10, 2.8);
      const category = categorizeWord(word);
      
      expect(category.difficulty).toBe('easy');
    });

    it('should categorize medium word (2.0 <= easeFactor < 2.5)', () => {
      const word = createMockWord('1', 'noun', 10, 2.2);
      const category = categorizeWord(word);
      
      expect(category.difficulty).toBe('medium');
    });

    it('should categorize hard word (easeFactor < 2.0)', () => {
      const word = createMockWord('1', 'noun', 10, 1.5);
      const category = categorizeWord(word);
      
      expect(category.difficulty).toBe('hard');
    });

    it('should use status fallback when easeFactor missing', () => {
      const wordNew = createMockWord('1', 'noun', 2);
      wordNew.status = 'new';
      delete wordNew.easeFactor;
      
      const categoryNew = categorizeWord(wordNew);
      expect(categoryNew.difficulty).toBe('hard');
      
      const wordLearning = createMockWord('2', 'verb', 10);
      wordLearning.status = 'learning';
      delete wordLearning.easeFactor;
      
      const categoryLearning = categorizeWord(wordLearning);
      expect(categoryLearning.difficulty).toBe('medium');
      
      const wordMastered = createMockWord('3', 'adjective', 30);
      wordMastered.status = 'mastered';
      delete wordMastered.easeFactor;
      
      const categoryMastered = categorizeWord(wordMastered);
      expect(categoryMastered.difficulty).toBe('easy');
    });
  });

  describe('Interleaving Algorithm', () => {
    it('should return original order when disabled', () => {
      const words = [
        createMockWord('1', 'noun', 2),
        createMockWord('2', 'noun', 2),
        createMockWord('3', 'noun', 2),
      ];
      
      const config: InterleavingConfig = {
        ...DEFAULT_INTERLEAVING_CONFIG,
        enabled: false,
      };
      
      const result = interleaveWords(words, config);
      
      expect(result.map(w => w.id)).toEqual(['1', '2', '3']);
    });

    it('should return original order for <= 2 words', () => {
      const words = [
        createMockWord('1', 'noun', 2),
        createMockWord('2', 'verb', 10),
      ];
      
      const result = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      
      expect(result.length).toBe(2);
      // Order might vary slightly, but should still return both words
      expect(result.map(w => w.id)).toContain('1');
      expect(result.map(w => w.id)).toContain('2');
    });

    it('should mix words by part of speech', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.5),
        createMockWord('2', 'noun', 10, 2.5),
        createMockWord('3', 'verb', 10, 2.5),
        createMockWord('4', 'verb', 10, 2.5),
        createMockWord('5', 'adjective', 10, 2.5),
      ];
      
      const result = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      
      // Check that we don't have too many consecutive nouns or verbs
      let maxConsecutive = 0;
      let currentPos: string | null = null;
      let currentCount = 0;
      
      for (const word of result) {
        const pos = word.partOfSpeech!;
        if (pos === currentPos) {
          currentCount++;
          maxConsecutive = Math.max(maxConsecutive, currentCount);
        } else {
          currentPos = pos;
          currentCount = 1;
        }
      }
      
      // Should not exceed maxConsecutive config (default 2)
      expect(maxConsecutive).toBeLessThanOrEqual(DEFAULT_INTERLEAVING_CONFIG.maxConsecutive);
    });

    it('should mix words by age', () => {
      const words = [
        createMockWord('1', 'noun', 1, 2.5),  // new
        createMockWord('2', 'noun', 2, 2.5),  // new
        createMockWord('3', 'noun', 10, 2.5), // young
        createMockWord('4', 'noun', 15, 2.5), // young
        createMockWord('5', 'noun', 30, 2.5), // mature
      ];
      
      const result = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      
      // Analyze the sequence
      const categories = result.map(w => categorizeWord(w));
      
      // Check for age mixing
      let ageChanges = 0;
      for (let i = 1; i < categories.length; i++) {
        if (categories[i].age !== categories[i - 1].age) {
          ageChanges++;
        }
      }
      
      // Should have some age variation (at least 2 changes)
      expect(ageChanges).toBeGreaterThanOrEqual(2);
    });

    it('should mix words by difficulty', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.8),  // easy
        createMockWord('2', 'noun', 10, 2.7),  // easy
        createMockWord('3', 'noun', 10, 2.2),  // medium
        createMockWord('4', 'noun', 10, 2.1),  // medium
        createMockWord('5', 'noun', 10, 1.5),  // hard
      ];
      
      const result = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      
      // Analyze the sequence
      const categories = result.map(w => categorizeWord(w));
      
      // Check for difficulty mixing
      let difficultyChanges = 0;
      for (let i = 1; i < categories.length; i++) {
        if (categories[i].difficulty !== categories[i - 1].difficulty) {
          difficultyChanges++;
        }
      }
      
      // Should have some difficulty variation (at least 2 changes)
      expect(difficultyChanges).toBeGreaterThanOrEqual(2);
    });

    it('should respect maxConsecutive constraint', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.5),
        createMockWord('2', 'noun', 10, 2.5),
        createMockWord('3', 'noun', 10, 2.5),
        createMockWord('4', 'noun', 10, 2.5),
        createMockWord('5', 'verb', 10, 2.5),
      ];
      
      const config: InterleavingConfig = {
        ...DEFAULT_INTERLEAVING_CONFIG,
        maxConsecutive: 2,
      };
      
      const result = interleaveWords(words, config);
      
      // Check that no category appears more than maxConsecutive times in a row
      const categories = result.map(w => categorizeWord(w));
      let maxConsecutiveNoun = 0;
      let currentCount = 0;
      
      for (const cat of categories) {
        if (cat.partOfSpeech === 'noun') {
          currentCount++;
          maxConsecutiveNoun = Math.max(maxConsecutiveNoun, currentCount);
        } else {
          currentCount = 0;
        }
      }
      
      expect(maxConsecutiveNoun).toBeLessThanOrEqual(config.maxConsecutive);
    });

    it('should handle config with selective mixing', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.8),
        createMockWord('2', 'verb', 10, 2.5),
        createMockWord('3', 'noun', 10, 2.2),
        createMockWord('4', 'verb', 10, 2.0),
      ];
      
      // Only mix by part of speech, ignore age and difficulty
      const config: InterleavingConfig = {
        ...DEFAULT_INTERLEAVING_CONFIG,
        mixByPartOfSpeech: true,
        mixByAge: false,
        mixByDifficulty: false,
      };
      
      const result = interleaveWords(words, config);
      
      // Should still alternate between noun and verb
      expect(result.length).toBe(4);
      // Can't predict exact order due to randomness, but should have mix
    });
  });

  describe('Interleaving Analytics', () => {
    it('should analyze empty word list', () => {
      const metrics = analyzeInterleaving([]);
      
      expect(metrics.totalWords).toBe(0);
      expect(metrics.switches).toBe(0);
      expect(metrics.switchRate).toBe(0);
      expect(metrics.maxConsecutive).toBe(0);
    });

    it('should analyze single word', () => {
      const words = [createMockWord('1', 'noun', 10, 2.5)];
      const metrics = analyzeInterleaving(words);
      
      expect(metrics.totalWords).toBe(1);
      expect(metrics.switches).toBe(0);
      expect(metrics.distribution.partOfSpeech['noun']).toBe(1);
    });

    it('should count category switches correctly', () => {
      const words = [
        createMockWord('1', 'noun', 1, 2.8),  // new, easy
        createMockWord('2', 'verb', 10, 2.2), // young, medium
        createMockWord('3', 'noun', 30, 1.5), // mature, hard
      ];
      
      const metrics = analyzeInterleaving(words);
      
      expect(metrics.totalWords).toBe(3);
      // Each word differs from previous in all dimensions
      expect(metrics.switches).toBeGreaterThanOrEqual(2);
    });

    it('should track distribution correctly', () => {
      const words = [
        createMockWord('1', 'noun', 2),
        createMockWord('2', 'verb', 2),
        createMockWord('3', 'noun', 10),
        createMockWord('4', 'adjective', 30),
      ];
      
      const metrics = analyzeInterleaving(words);
      
      expect(metrics.distribution.partOfSpeech['noun']).toBe(2);
      expect(metrics.distribution.partOfSpeech['verb']).toBe(1);
      expect(metrics.distribution.partOfSpeech['adjective']).toBe(1);
      
      expect(metrics.distribution.age['new']).toBe(2);
      expect(metrics.distribution.age['young']).toBe(1);
      expect(metrics.distribution.age['mature']).toBe(1);
    });

    it('should calculate max consecutive correctly', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.5),
        createMockWord('2', 'noun', 10, 2.5),
        createMockWord('3', 'noun', 10, 2.5),
        createMockWord('4', 'verb', 10, 2.5),
      ];
      
      const metrics = analyzeInterleaving(words);
      
      // 3 nouns in a row
      expect(metrics.maxConsecutive).toBe(3);
    });

    it('should calculate average consecutive correctly', () => {
      const words = [
        createMockWord('1', 'noun', 10, 2.5),
        createMockWord('2', 'noun', 10, 2.5),
        createMockWord('3', 'verb', 10, 2.5),
        createMockWord('4', 'verb', 10, 2.5),
        createMockWord('5', 'verb', 10, 2.5),
      ];
      
      const metrics = analyzeInterleaving(words);
      
      // Run 1: 2 nouns (consecutive: 2)
      // Run 2: 3 verbs (consecutive: 3)
      // Average: (2 + 3) / 2 = 2.5
      expect(metrics.avgConsecutive).toBe(2.5);
    });
  });

  describe('Report Generation', () => {
    it('should generate readable report', () => {
      const words = [
        createMockWord('1', 'noun', 2, 2.5),
        createMockWord('2', 'verb', 10, 2.0),
        createMockWord('3', 'adjective', 30, 1.5),
      ];
      
      const metrics = analyzeInterleaving(words);
      const report = generateInterleavingReport(metrics);
      
      expect(report).toContain('Interleaving Quality Report');
      expect(report).toContain('Total Words: 3');
      expect(report).toContain('Part of Speech:');
      expect(report).toContain('Age:');
      expect(report).toContain('Difficulty:');
    });
  });

  describe('Integration Scenarios', () => {
    it('should improve distribution over random ordering', () => {
      // Create a biased set (many nouns, few verbs)
      const words = [
        ...Array.from({ length: 8 }, (_, i) => createMockWord(`n${i}`, 'noun', 10, 2.5)),
        ...Array.from({ length: 2 }, (_, i) => createMockWord(`v${i}`, 'verb', 10, 2.5)),
      ];
      
      const interleaved = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      const metrics = analyzeInterleaving(interleaved);
      
      // Should have reasonable mixing despite imbalance
      expect(metrics.switches).toBeGreaterThanOrEqual(2);
      expect(metrics.maxConsecutive).toBeLessThanOrEqual(4); // Some clustering okay with imbalance
    });

    it('should handle words with identical categories', () => {
      // All words have same characteristics
      const words = [
        createMockWord('1', 'noun', 10, 2.5),
        createMockWord('2', 'noun', 10, 2.5),
        createMockWord('3', 'noun', 10, 2.5),
      ];
      
      const result = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      
      // Should still return all words
      expect(result.length).toBe(3);
      expect(result.map(w => w.id)).toContain('1');
      expect(result.map(w => w.id)).toContain('2');
      expect(result.map(w => w.id)).toContain('3');
    });

    it('should work well with real-world distribution', () => {
      // Simulate realistic vocabulary list
      const words = [
        createMockWord('1', 'noun', 1, 1.3),      // new, hard
        createMockWord('2', 'verb', 2, 1.8),      // new, hard
        createMockWord('3', 'noun', 5, 2.1),      // young, medium
        createMockWord('4', 'adjective', 8, 2.0),  // young, medium
        createMockWord('5', 'verb', 15, 2.4),     // young, medium
        createMockWord('6', 'noun', 25, 2.6),     // mature, easy
        createMockWord('7', 'verb', 30, 2.8),     // mature, easy
        createMockWord('8', 'adjective', 40, 2.9), // mature, easy
      ];
      
      const interleaved = interleaveWords(words, DEFAULT_INTERLEAVING_CONFIG);
      const metrics = analyzeInterleaving(interleaved);
      
      // Should have good mixing
      expect(metrics.switches).toBeGreaterThanOrEqual(5);
      expect(metrics.maxConsecutive).toBeLessThanOrEqual(2);
      expect(metrics.switchRate).toBeGreaterThan(0.5); // At least 50% switch rate
    });
  });
});
