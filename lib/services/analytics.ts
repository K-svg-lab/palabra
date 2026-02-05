/**
 * Analytics Service
 * 
 * Tracks word lookups, API performance, cache hits, and user behavior.
 * Phase 16.2 - Infrastructure & Developer Experience
 */

import type { PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface WordLookupAnalytics {
  sourceWord: string;
  sourceLanguage: string;
  targetLanguage: string;
  languagePair: string;
  fromCache: boolean;
  responseTime: number;
  translationFound: boolean;
  examplesFound: number;
  confidenceScore?: number;
  apiSource?: string;
  apiCallsCount?: number;
  userId?: string;
  sessionId?: string;
  deviceType?: string;
}

export interface ApiCallAnalytics {
  apiName: string;
  endpoint?: string;
  method?: string;
  sourceWord: string;
  languagePair: string;
  responseTime: number;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  rateLimited?: boolean;
  retryCount?: number;
  translationReturned?: boolean;
  examplesReturned?: number;
  userId?: string;
  sessionId?: string;
}

export interface SaveAnalytics {
  lookupEventId?: string;
  sourceWord: string;
  languagePair: string;
  wasEdited: boolean;
  editedFields?: string[];
  userId?: string;
}

export interface CachePerformanceSnapshot {
  date: Date;
  languagePair: string;
  totalLookups: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  avgCacheResponseTime: number;
  avgApiResponseTime: number;
  saveRate: number;
  editRate: number;
}

// ============================================================================
// ANALYTICS TRACKING FUNCTIONS
// ============================================================================

/**
 * Track a word lookup event
 */
export async function trackWordLookup(
  prisma: PrismaClient,
  data: WordLookupAnalytics
): Promise<void> {
  try {
    await prisma.wordLookupEvent.create({
      data: {
        sourceWord: data.sourceWord,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        languagePair: data.languagePair,
        fromCache: data.fromCache,
        cacheHit: data.fromCache,
        cacheMiss: !data.fromCache,
        apiSource: data.apiSource,
        responseTime: data.responseTime,
        apiCallsCount: data.apiCallsCount || 0,
        translationFound: data.translationFound,
        examplesFound: data.examplesFound,
        confidenceScore: data.confidenceScore,
        userId: data.userId,
        sessionId: data.sessionId,
        deviceType: data.deviceType,
      },
    });
  } catch (error) {
    // Log but don't throw - analytics should never break the app
    console.error('[Analytics] Failed to track word lookup:', error);
  }
}

/**
 * Track an API call event
 */
export async function trackApiCall(
  prisma: PrismaClient,
  data: ApiCallAnalytics
): Promise<void> {
  try {
    await prisma.apiCallEvent.create({
      data: {
        apiName: data.apiName,
        endpoint: data.endpoint,
        method: data.method || 'GET',
        sourceWord: data.sourceWord,
        languagePair: data.languagePair,
        responseTime: data.responseTime,
        success: data.success,
        statusCode: data.statusCode,
        errorMessage: data.errorMessage,
        rateLimited: data.rateLimited || false,
        retryCount: data.retryCount || 0,
        translationReturned: data.translationReturned || false,
        examplesReturned: data.examplesReturned || 0,
        userId: data.userId,
        sessionId: data.sessionId,
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to track API call:', error);
  }
}

/**
 * Update a lookup event when the word is saved
 */
export async function trackWordSave(
  prisma: PrismaClient,
  data: SaveAnalytics
): Promise<void> {
  try {
    // Find recent lookup event for this word by this user
    const recentLookup = await prisma.wordLookupEvent.findFirst({
      where: {
        sourceWord: data.sourceWord,
        languagePair: data.languagePair,
        userId: data.userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentLookup) {
      await prisma.wordLookupEvent.update({
        where: { id: recentLookup.id },
        data: {
          wasSaved: true,
          wasEdited: data.wasEdited,
        },
      });
    }
  } catch (error) {
    console.error('[Analytics] Failed to track word save:', error);
  }
}

/**
 * Increment lookup count for verified vocabulary
 */
export async function incrementVerifiedWordLookup(
  prisma: PrismaClient,
  verifiedWordId: string
): Promise<void> {
  try {
    await prisma.verifiedVocabulary.update({
      where: { id: verifiedWordId },
      data: {
        lookupCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to increment lookup count:', error);
  }
}

/**
 * Increment save count for verified vocabulary
 */
export async function incrementVerifiedWordSave(
  prisma: PrismaClient,
  verifiedWordId: string
): Promise<void> {
  try {
    await prisma.verifiedVocabulary.update({
      where: { id: verifiedWordId },
      data: {
        saveCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to increment save count:', error);
  }
}

// ============================================================================
// ANALYTICS AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Get cache performance metrics for a date range
 */
export async function getCachePerformanceMetrics(
  prisma: PrismaClient,
  startDate: Date,
  endDate: Date,
  languagePair?: string
): Promise<CachePerformanceSnapshot[]> {
  const whereClause = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(languagePair && { languagePair }),
  };

  const lookups = await prisma.wordLookupEvent.groupBy({
    by: ['languagePair'],
    where: whereClause,
    _count: { id: true },
    _sum: {
      responseTime: true,
    },
    _avg: {
      responseTime: true,
      confidenceScore: true,
    },
  });

  return lookups.map((lookup) => ({
    date: startDate,
    languagePair: lookup.languagePair,
    totalLookups: lookup._count.id,
    cacheHits: 0, // Would need separate query
    cacheMisses: 0,
    cacheHitRate: 0,
    avgCacheResponseTime: 0,
    avgApiResponseTime: lookup._avg.responseTime || 0,
    saveRate: 0,
    editRate: 0,
  }));
}

/**
 * Get most popular words
 */
export async function getPopularWords(
  prisma: PrismaClient,
  languagePair: string,
  limit: number = 50,
  daysBack: number = 30
): Promise<Array<{ word: string; count: number; saveRate: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const popularWords = await prisma.wordLookupEvent.groupBy({
    by: ['sourceWord'],
    where: {
      languagePair,
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    _sum: {
      wasSaved: true,
    },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: limit,
  });

  return popularWords.map((word) => ({
    word: word.sourceWord,
    count: word._count.id,
    saveRate: word._sum.wasSaved ? (word._sum.wasSaved / word._count.id) : 0,
  }));
}

/**
 * Get API performance summary
 */
export async function getApiPerformanceSummary(
  prisma: PrismaClient,
  daysBack: number = 7
): Promise<Array<{
  apiName: string;
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  rateLimitedCount: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const apiStats = await prisma.apiCallEvent.groupBy({
    by: ['apiName'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    _sum: {
      success: true,
      rateLimited: true,
    },
    _avg: {
      responseTime: true,
    },
  });

  return apiStats.map((stat) => ({
    apiName: stat.apiName,
    totalCalls: stat._count.id,
    successRate: stat._sum.success ? (stat._sum.success / stat._count.id) : 0,
    avgResponseTime: stat._avg.responseTime || 0,
    rateLimitedCount: stat._sum.rateLimited || 0,
  }));
}

/**
 * Get overall analytics summary
 */
export async function getAnalyticsSummary(
  prisma: PrismaClient,
  daysBack: number = 7
): Promise<{
  totalLookups: number;
  totalSaves: number;
  saveRate: number;
  cacheHitRate: number;
  avgResponseTime: number;
  totalApiCalls: number;
  apiCallsSaved: number;
  popularWords: Array<{ word: string; count: number }>;
  apiPerformance: Array<{ apiName: string; avgResponseTime: number }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get lookup stats
  const lookupStats = await prisma.wordLookupEvent.aggregate({
    where: { createdAt: { gte: startDate } },
    _count: { id: true },
    _sum: {
      wasSaved: true,
      apiCallsCount: true,
      cacheHit: true,
    },
    _avg: {
      responseTime: true,
    },
  });

  // Get popular words
  const popularWords = await getPopularWords(prisma, 'es-en', 10, daysBack);

  // Get API performance
  const apiPerformance = await getApiPerformanceSummary(prisma, daysBack);

  const totalLookups = lookupStats._count.id || 0;
  const cacheHits = lookupStats._sum.cacheHit || 0;
  const totalSaves = lookupStats._sum.wasSaved || 0;

  return {
    totalLookups,
    totalSaves,
    saveRate: totalLookups > 0 ? totalSaves / totalLookups : 0,
    cacheHitRate: totalLookups > 0 ? cacheHits / totalLookups : 0,
    avgResponseTime: lookupStats._avg.responseTime || 0,
    totalApiCalls: lookupStats._sum.apiCallsCount || 0,
    apiCallsSaved: cacheHits, // Each cache hit saves API calls
    popularWords: popularWords.map((w) => ({ word: w.word, count: w.count })),
    apiPerformance: apiPerformance.map((api) => ({
      apiName: api.apiName,
      avgResponseTime: api.avgResponseTime,
    })),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate session ID from request (for tracking user sessions)
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

/**
 * Calculate language pair from source and target languages
 */
export function getLanguagePair(sourceLanguage: string, targetLanguage: string): string {
  return `${sourceLanguage}-${targetLanguage}`;
}
