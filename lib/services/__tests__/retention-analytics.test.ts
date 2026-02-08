/**
 * Retention Analytics Service Tests (Phase 18.1.2)
 * 
 * Comprehensive tests for retention tracking and analytics functionality.
 * 
 * Run with: npm test -- retention-analytics.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  initializeUserCohort,
  trackUserActivity,
  trackReviewAttempt,
  startReviewSession,
  completeReviewSession,
  getCohortRetention,
  getWeeklyCohortAnalysis,
  getMethodPerformance,
  trackWordAdded,
} from '../retention-analytics';
import { prisma } from '@/lib/backend/db';

describe('Retention Analytics Service', () => {
  let testUserId: string;
  let testVocabularyId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `retention-test-${Date.now()}@test.com`,
        name: 'Retention Test User',
      },
    });
    testUserId = user.id;

    // Create test vocabulary item
    const vocab = await prisma.vocabularyItem.create({
      data: {
        userId: testUserId,
        spanish: 'perro',
        english: 'dog',
      },
    });
    testVocabularyId = vocab.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.reviewAttempt.deleteMany({ where: { userId: testUserId } });
    await prisma.reviewSession.deleteMany({ where: { userId: testUserId } });
    await prisma.userCohort.deleteMany({ where: { userId: testUserId } });
    await prisma.vocabularyItem.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('Cohort Initialization', () => {
    it('should initialize user cohort', async () => {
      await initializeUserCohort(testUserId);

      const cohort = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      expect(cohort).toBeDefined();
      expect(cohort?.userId).toBe(testUserId);
      expect(cohort?.cohortWeek).toMatch(/^\d{4}-W\d{2}$/);
      expect(cohort?.cohortMonth).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should not duplicate cohort on re-initialization', async () => {
      await initializeUserCohort(testUserId);
      await initializeUserCohort(testUserId);

      const cohorts = await prisma.userCohort.findMany({
        where: { userId: testUserId },
      });

      expect(cohorts.length).toBe(1);
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activity', async () => {
      await trackUserActivity(testUserId);

      const cohort = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      expect(cohort?.lastActiveAt).toBeDefined();
      expect(cohort?.day1Active).toBe(true); // Immediately active after signup
    });

    it('should track word added', async () => {
      const cohortBefore = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      await trackWordAdded(testUserId);

      const cohortAfter = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      expect(cohortAfter?.totalWordsAdded).toBe((cohortBefore?.totalWordsAdded || 0) + 1);
      expect(cohortAfter?.lastAddedWordAt).toBeDefined();
    });
  });

  describe('Review Session Tracking', () => {
    it('should start and track review session', async () => {
      testSessionId = await startReviewSession({
        userId: testUserId,
        sessionType: 'review',
        deviceType: 'desktop',
        platform: 'web',
      });

      expect(testSessionId).toBeDefined();

      const session = await prisma.reviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
      expect(session?.sessionType).toBe('review');
      expect(session?.deviceType).toBe('desktop');
    });

    it('should track review attempt', async () => {
      await trackReviewAttempt({
        userId: testUserId,
        vocabularyId: testVocabularyId,
        sessionId: testSessionId,
        reviewMethod: 'traditional',
        methodDifficulty: 1.0,
        correct: true,
        quality: 4,
        responseTime: 2500,
        correctAnswer: 'dog',
        intervalBefore: 0,
        easeFactorBefore: 2.5,
        intervalAfter: 1,
        easeFactorAfter: 2.6,
      });

      const attempts = await prisma.reviewAttempt.findMany({
        where: {
          userId: testUserId,
          vocabularyId: testVocabularyId,
        },
      });

      expect(attempts.length).toBeGreaterThan(0);
      expect(attempts[0].correct).toBe(true);
      expect(attempts[0].reviewMethod).toBe('traditional');

      const cohort = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      expect(cohort?.totalReviews).toBeGreaterThan(0);
    });

    it('should complete review session', async () => {
      // Add more attempts
      await trackReviewAttempt({
        userId: testUserId,
        vocabularyId: testVocabularyId,
        sessionId: testSessionId,
        reviewMethod: 'fill_blank',
        methodDifficulty: 1.2,
        correct: false,
        quality: 2,
        responseTime: 3500,
        correctAnswer: 'dog',
        intervalBefore: 1,
        easeFactorBefore: 2.6,
        intervalAfter: 1,
        easeFactorAfter: 2.4,
      });

      await completeReviewSession(testSessionId);

      const session = await prisma.reviewSession.findUnique({
        where: { id: testSessionId },
      });

      expect(session?.completedAt).toBeDefined();
      expect(session?.cardsReviewed).toBe(2);
      expect(session?.cardsCorrect).toBe(1);
      expect(session?.accuracy).toBeCloseTo(0.5);
      expect(session?.methodBreakdown).toBeDefined();
    });
  });

  describe('Analytics', () => {
    it('should get cohort retention metrics', async () => {
      const today = new Date();
      const metrics = await getCohortRetention(today);

      expect(metrics).toBeDefined();
      expect(metrics.cohortDate).toBeDefined();
      expect(typeof metrics.day1Retention).toBe('number');
      expect(typeof metrics.day7Retention).toBe('number');
    });

    it('should get weekly cohort analysis', async () => {
      const cohort = await prisma.userCohort.findUnique({
        where: { userId: testUserId },
      });

      if (cohort) {
        const analysis = await getWeeklyCohortAnalysis(cohort.cohortWeek);

        expect(analysis).toBeDefined();
        expect(analysis?.signups).toBeGreaterThan(0);
        expect(analysis?.retention.day1).toBeDefined();
      }
    });

    it('should get method performance', async () => {
      const performance = await getMethodPerformance(testUserId, 30);

      expect(performance).toBeDefined();
      expect(Array.isArray(performance)).toBe(true);

      if (performance.length > 0) {
        expect(performance[0].method).toBeDefined();
        expect(performance[0].totalAttempts).toBeGreaterThan(0);
        expect(performance[0].accuracy).toBeGreaterThanOrEqual(0);
        expect(performance[0].accuracy).toBeLessThanOrEqual(1);
      }
    });
  });
});
