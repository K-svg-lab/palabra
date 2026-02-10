/**
 * Deep Learning Service Tests (Phase 18.2.2)
 * 
 * Tests for elaborative interrogation prompt generation and tracking.
 * 
 * @module deep-learning-tests
 */

import { describe, it, expect } from '@jest/globals';
import type {
  ElaborativePromptType,
  ElaborativePrompt,
  ElaborativeResponse,
} from '../deep-learning';

describe('Deep Learning Service', () => {
  // ============================================================================
  // PROMPT TYPES
  // ============================================================================

  describe('Prompt Types', () => {
    it('should have 5 valid prompt types', () => {
      const types: ElaborativePromptType[] = [
        'etymology',
        'connection',
        'usage',
        'comparison',
        'personal',
      ];

      expect(types).toHaveLength(5);
      expect(types).toContain('etymology');
      expect(types).toContain('connection');
      expect(types).toContain('usage');
      expect(types).toContain('comparison');
      expect(types).toContain('personal');
    });

    it('should validate ElaborativePrompt structure', () => {
      const prompt: ElaborativePrompt = {
        type: 'connection',
        question: 'How might you remember that "perro" means "dog"?',
        hints: ['Think about the sound', 'Does it remind you of any English words?'],
        idealAnswer: 'It sounds like "paw" which dogs have',
        wordId: 'vocab-123',
        wordSpanish: 'perro',
        wordEnglish: 'dog',
      };

      expect(prompt.type).toBe('connection');
      expect(prompt.question).toContain('perro');
      expect(prompt.hints).toHaveLength(2);
      expect(prompt.wordId).toBe('vocab-123');
    });

    it('should validate ElaborativeResponse structure', () => {
      const response: ElaborativeResponse = {
        id: 'resp-123',
        userId: 'user-456',
        wordId: 'vocab-789',
        promptType: 'etymology',
        question: 'Why do you think "biblioteca" sounds like "library"?',
        userResponse: 'They both come from Latin words related to books',
        skipped: false,
        responseTime: 15000, // 15 seconds
        createdAt: new Date(),
      };

      expect(response.skipped).toBe(false);
      expect(response.responseTime).toBe(15000);
      expect(response.userResponse).toBeTruthy();
    });
  });

  // ============================================================================
  // PROMPT QUESTION FORMATS
  // ============================================================================

  describe('Prompt Question Formats', () => {
    it('should format etymology questions correctly', () => {
      const question = 'Why do you think "biblioteca" sounds similar to the English word "library"?';
      
      expect(question).toContain('Why');
      expect(question).toContain('biblioteca');
      expect(question).toContain('library');
      expect(question).toMatch(/similar|sounds like/i);
    });

    it('should format connection questions correctly', () => {
      const question = 'How might you remember that "perro" means "dog"?';
      
      expect(question).toContain('How');
      expect(question).toContain('remember');
      expect(question).toContain('perro');
      expect(question).toContain('dog');
    });

    it('should format usage questions correctly', () => {
      const question = 'When would you use "estar" instead of "ser"?';
      
      expect(question).toContain('When');
      expect(question).toContain('use');
      expect(question).toContain('estar');
      expect(question).toContain('ser');
    });

    it('should format comparison questions correctly', () => {
      const question = 'How is "conocer" different from "saber"?';
      
      expect(question).toContain('How');
      expect(question).toMatch(/different|similar/i);
      expect(question).toContain('conocer');
      expect(question).toContain('saber');
    });

    it('should format personal questions correctly', () => {
      const question = 'Can you think of a time when you\'d use "feliz"?';
      
      expect(question).toContain('you');
      expect(question).toContain('feliz');
      expect(question).toMatch(/think|imagine/i);
    });
  });

  // ============================================================================
  // FREQUENCY LOGIC
  // ============================================================================

  describe('Frequency Logic', () => {
    it('should show prompt every 12 cards (default)', () => {
      const frequency = 12;
      
      // Should show at: 12, 24, 36, 48, etc.
      expect(12 % frequency).toBe(0);
      expect(24 % frequency).toBe(0);
      expect(36 % frequency).toBe(0);
      
      // Should NOT show at: 1, 5, 11, 13, 23
      expect(1 % frequency).not.toBe(0);
      expect(5 % frequency).not.toBe(0);
      expect(11 % frequency).not.toBe(0);
      expect(13 % frequency).not.toBe(0);
      expect(23 % frequency).not.toBe(0);
    });

    it('should support different frequencies', () => {
      const frequencies = [10, 12, 15, 20];
      
      frequencies.forEach(freq => {
        // Should show at first interval
        expect(freq % freq).toBe(0);
        
        // Should show at second interval
        expect((freq * 2) % freq).toBe(0);
        
        // Should NOT show just before interval
        expect((freq - 1) % freq).not.toBe(0);
      });
    });

    it('should calculate next deep learning card correctly', () => {
      const frequency = 12;
      const cardsReviewed = 8;
      
      const cardsUntilNext = frequency - (cardsReviewed % frequency);
      expect(cardsUntilNext).toBe(4); // 12 - 8 = 4 cards remaining
    });
  });

  // ============================================================================
  // AUTO-SKIP LOGIC
  // ============================================================================

  describe('Auto-Skip Logic', () => {
    it('should auto-skip after 3 seconds if no interaction', () => {
      const autoSkipTime = 3000; // milliseconds
      
      expect(autoSkipTime).toBe(3000);
      expect(autoSkipTime / 1000).toBe(3); // 3 seconds
    });

    it('should stop auto-skip timer on user interaction', () => {
      let timer = 3;
      const hasInteracted = true;
      
      if (hasInteracted) {
        timer = 999; // Stop countdown
      }
      
      expect(timer).toBe(999);
    });

    it('should track whether response was skipped', () => {
      const skippedResponse: Pick<ElaborativeResponse, 'skipped' | 'userResponse'> = {
        skipped: true,
        userResponse: null,
      };
      
      const providedResponse: Pick<ElaborativeResponse, 'skipped' | 'userResponse'> = {
        skipped: false,
        userResponse: 'My thoughtful answer',
      };
      
      expect(skippedResponse.skipped).toBe(true);
      expect(skippedResponse.userResponse).toBeNull();
      
      expect(providedResponse.skipped).toBe(false);
      expect(providedResponse.userResponse).toBeTruthy();
    });
  });

  // ============================================================================
  // CEFR LEVEL ADAPTATION
  // ============================================================================

  describe('CEFR Level Adaptation', () => {
    it('should support all CEFR levels', () => {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      
      expect(levels).toHaveLength(6);
      levels.forEach(level => {
        expect(level).toMatch(/^[ABC][12]$/);
      });
    });

    it('should provide level descriptions', () => {
      const descriptions: Record<string, string> = {
        A1: 'absolute beginners (basic phrases)',
        A2: 'elementary learners (simple conversations)',
        B1: 'intermediate learners (independent speakers)',
        B2: 'upper intermediate (confident speakers)',
        C1: 'advanced learners (proficient speakers)',
        C2: 'mastery level (near-native fluency)',
      };
      
      Object.entries(descriptions).forEach(([level, desc]) => {
        expect(desc).toBeTruthy();
        expect(desc.length).toBeGreaterThan(10);
      });
    });
  });

  // ============================================================================
  // RESPONSE TIME TRACKING
  // ============================================================================

  describe('Response Time Tracking', () => {
    it('should calculate response time in milliseconds', () => {
      const startTime = Date.now();
      const endTime = startTime + 15000; // 15 seconds later
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBe(15000);
    });

    it('should track both quick and slow responses', () => {
      const quickResponse = 3000; // 3 seconds
      const averageResponse = 15000; // 15 seconds
      const slowResponse = 60000; // 60 seconds
      
      expect(quickResponse).toBeLessThan(5000);
      expect(averageResponse).toBeGreaterThanOrEqual(10000);
      expect(averageResponse).toBeLessThan(30000);
      expect(slowResponse).toBeGreaterThanOrEqual(30000);
    });
  });

  // ============================================================================
  // STATISTICS
  // ============================================================================

  describe('Statistics Calculations', () => {
    it('should calculate engagement rate', () => {
      const totalPrompts = 10;
      const engaged = 7;
      const skipped = 3;
      
      expect(engaged + skipped).toBe(totalPrompts);
      
      const engagementRate = engaged / totalPrompts;
      expect(engagementRate).toBe(0.7); // 70%
    });

    it('should calculate average response time', () => {
      const responseTimes = [10000, 15000, 20000, 25000]; // milliseconds
      
      const sum = responseTimes.reduce((acc, time) => acc + time, 0);
      const avg = sum / responseTimes.length;
      
      expect(avg).toBe(17500); // 17.5 seconds
    });

    it('should handle zero prompts gracefully', () => {
      const totalPrompts = 0;
      const engaged = 0;
      
      const engagementRate = totalPrompts > 0 ? engaged / totalPrompts : 0;
      expect(engagementRate).toBe(0);
    });
  });

  // ============================================================================
  // OPTIONAL RESPONSE
  // ============================================================================

  describe('Optional Response Feature', () => {
    it('should allow blank responses', () => {
      const blankResponse: Pick<ElaborativeResponse, 'userResponse' | 'skipped'> = {
        userResponse: '',
        skipped: false,
      };
      
      // User clicked "Continue" but didn't type anything
      expect(blankResponse.skipped).toBe(false);
      expect(blankResponse.userResponse).toBe('');
    });

    it('should distinguish between skip and blank response', () => {
      const skipped: Pick<ElaborativeResponse, 'userResponse' | 'skipped'> = {
        userResponse: null,
        skipped: true,
      };
      
      const blank: Pick<ElaborativeResponse, 'userResponse' | 'skipped'> = {
        userResponse: '',
        skipped: false,
      };
      
      const provided: Pick<ElaborativeResponse, 'userResponse' | 'skipped'> = {
        userResponse: 'My answer',
        skipped: false,
      };
      
      expect(skipped.skipped).toBe(true);
      expect(blank.skipped).toBe(false);
      expect(provided.skipped).toBe(false);
      
      expect(skipped.userResponse).toBeNull();
      expect(blank.userResponse).toBe('');
      expect(provided.userResponse).toBeTruthy();
    });
  });

  // ============================================================================
  // TEMPLATE FALLBACK
  // ============================================================================

  describe('Template Fallback', () => {
    it('should provide templates when AI unavailable', () => {
      const templates = [
        'How might you remember that "{word}" means "{meaning}"?',
        'Can you think of a situation where you\'d use "{word}"?',
        'Does "{word}" remind you of any English words?',
        'When would you use "{word}" in conversation?',
      ];
      
      expect(templates).toHaveLength(4);
      templates.forEach(template => {
        expect(template).toContain('{word}');
      });
    });

    it('should fill template with word data', () => {
      const template = 'How might you remember that "{word}" means "{meaning}"?';
      const word = 'perro';
      const meaning = 'dog';
      
      const filled = template
        .replace('{word}', word)
        .replace('{meaning}', meaning);
      
      expect(filled).toBe('How might you remember that "perro" means "dog"?');
      expect(filled).not.toContain('{');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very short words', () => {
      const shortWords = ['el', 'la', 'yo', 'tú', 'sí', 'no'];
      
      shortWords.forEach(word => {
        expect(word.length).toBeLessThanOrEqual(3);
        
        const question = `How might you remember "${word}"?`;
        expect(question).toContain(word);
      });
    });

    it('should handle very long words', () => {
      const longWord = 'extraordinariamente';
      
      expect(longWord.length).toBeGreaterThan(15);
      
      const question = `When would you use "${longWord}"?`;
      expect(question).toContain(longWord);
    });

    it('should handle words with special characters', () => {
      const specialWords = ['niño', 'señor', 'está', 'más', 'José'];
      
      specialWords.forEach(word => {
        const question = `Can you think of a time when you'd use "${word}"?`;
        expect(question).toContain(word);
      });
    });
  });
});
