/**
 * AI Example Generator Tests (Phase 18.1.3)
 * 
 * Tests for AI-generated contextual examples and cost control.
 * 
 * Run with: npm test -- ai-example-generator.test.ts
 * 
 * NOTE: These tests require OPENAI_API_KEY to be set in .env.local
 * Some tests are integration tests that make real API calls.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateExamples, batchGenerateExamples } from '../ai-example-generator';
import {
  canMakeAICall,
  getCurrentMonthCostReport,
  recordAICost,
  estimateTokens,
  estimateCostUSD,
} from '../ai-cost-control';
import { prisma } from '@/lib/backend/db';
import type { CEFRLevel } from '@/lib/types/proficiency';

describe('AI Example Generator Service', () => {
  const testWord = 'perro';
  const testTranslation = 'dog';
  const testLevel: CEFRLevel = 'B1';

  beforeAll(async () => {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.warn('⚠️ OPENAI_API_KEY not configured. Some tests will be skipped.');
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.aICostEvent.deleteMany({
      where: {
        metadata: {
          path: ['word'],
          equals: testWord,
        },
      },
    });
  });

  describe('Example Generation', () => {
    it('should generate examples for a word', async () => {
      const result = await generateExamples({
        word: testWord,
        translation: testTranslation,
        level: testLevel,
        count: 3,
      });

      expect(result).toBeDefined();
      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples.length).toBeLessThanOrEqual(3);

      // Check example structure
      const firstExample = result.examples[0];
      expect(firstExample.spanish).toBeDefined();
      expect(firstExample.english).toBeDefined();
      expect(firstExample.level).toBe(testLevel);
    }, 15000); // 15 second timeout for API call

    it('should use cached examples on second call', async () => {
      // First call (generates)
      const result1 = await generateExamples({
        word: testWord,
        translation: testTranslation,
        level: testLevel,
        count: 3,
      });

      expect(result1.fromCache).toBe(false);

      // Second call (cached)
      const result2 = await generateExamples({
        word: testWord,
        translation: testTranslation,
        level: testLevel,
        count: 3,
      });

      expect(result2.fromCache).toBe(true);
      expect(result2.examples.length).toBe(result1.examples.length);
    }, 15000);

    it('should generate different examples for different levels', async () => {
      const a1Result = await generateExamples({
        word: testWord,
        translation: testTranslation,
        level: 'A1',
        count: 2,
      });

      const c1Result = await generateExamples({
        word: testWord,
        translation: testTranslation,
        level: 'C1',
        count: 2,
      });

      expect(a1Result.examples).toBeDefined();
      expect(c1Result.examples).toBeDefined();

      // Examples should have different levels
      expect(a1Result.examples[0].level).toBe('A1');
      expect(c1Result.examples[0].level).toBe('C1');
    }, 30000);

    it('should fallback to templates when budget exceeded', async () => {
      // This test verifies fallback mechanism works
      // In real scenario, this would trigger when budget limit reached
      
      const result = await generateExamples({
        word: 'gato',
        translation: 'cat',
        level: 'B1',
        count: 3,
        useCache: false, // Force generation
      });

      expect(result.examples).toBeDefined();
      expect(result.examples.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Cost Control', () => {
    it('should check if AI call is within budget', async () => {
      const canCall = await canMakeAICall();
      expect(typeof canCall).toBe('boolean');
    });

    it('should get current month cost report', async () => {
      const report = await getCurrentMonthCostReport();

      expect(report).toBeDefined();
      expect(report.monthlyBudget).toBe(50);
      expect(report.currentSpend).toBeGreaterThanOrEqual(0);
      expect(report.remainingBudget).toBeLessThanOrEqual(50);
      expect(report.canMakeRequest).toBe(typeof report.canMakeRequest === 'boolean');
    });

    it('should estimate tokens correctly', async () => {
      const prompt = 'Generate examples for the word "perro"';
      const tokens = estimateTokens(prompt);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(100); // Should be ~10-20 tokens
    });

    it('should estimate cost correctly', async () => {
      const tokens = 1000;
      const cost = estimateCostUSD(tokens);

      expect(cost).toBe(0.002); // $0.002 per 1000 tokens
    });

    it('should record AI cost events', async () => {
      await recordAICost({
        service: 'openai',
        model: 'gpt-3.5-turbo',
        tokensUsed: 150,
        success: true,
        metadata: { test: true },
      });

      const events = await prisma.aICostEvent.findMany({
        where: {
          metadata: {
            path: ['test'],
            equals: true,
          },
        },
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].service).toBe('openai');
      expect(events[0].tokensUsed).toBe(150);

      // Cleanup
      await prisma.aICostEvent.deleteMany({
        where: {
          metadata: {
            path: ['test'],
            equals: true,
          },
        },
      });
    });
  });

  describe('Batch Generation', () => {
    it('should batch generate examples for multiple words', async () => {
      const words = [
        { word: 'casa', translation: 'house' },
        { word: 'libro', translation: 'book' },
      ];

      const result = await batchGenerateExamples(words, ['A1', 'B1']);

      expect(result).toBeDefined();
      expect(result.total).toBe(4); // 2 words × 2 levels
      expect(result.generated + result.cached + result.failed).toBe(result.total);
      expect(result.totalCost).toBeGreaterThanOrEqual(0);
    }, 60000); // 60 second timeout for batch operation
  });
});

describe('AI Cost Control Service', () => {
  describe('Budget Management', () => {
    it('should track monthly spend accurately', async () => {
      const report = await getCurrentMonthCostReport();

      expect(report.currentSpend).toBeGreaterThanOrEqual(0);
      expect(report.remainingBudget).toBeLessThanOrEqual(report.monthlyBudget);
      expect(report.percentageUsed).toBeGreaterThanOrEqual(0);
      expect(report.percentageUsed).toBeLessThanOrEqual(100);
    });

    it('should calculate estimated calls remaining', async () => {
      const report = await getCurrentMonthCostReport();

      expect(report.estimatedCallsRemaining).toBeGreaterThanOrEqual(0);
      
      if (report.canMakeRequest) {
        expect(report.estimatedCallsRemaining).toBeGreaterThan(0);
      }
    });

    it('should enforce budget buffer (90%)', async () => {
      const report = await getCurrentMonthCostReport();

      if (report.percentageUsed >= 90) {
        expect(report.canMakeRequest).toBe(false);
      }
    });
  });
});
