/**
 * Analytics API Route
 * 
 * Provides analytics data for word lookups, cache performance, and API usage.
 * Phase 16.2 - Infrastructure & Developer Experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAnalyticsSummary, getPopularWords, getApiPerformanceSummary } from '@/lib/services/analytics';

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * GET /api/analytics
 * 
 * Returns analytics summary including:
 * - Total lookups and saves
 * - Cache hit rate
 * - Popular words
 * - API performance
 * 
 * Query parameters:
 * - daysBack: Number of days to look back (default: 7)
 * - languagePair: Language pair to filter by (default: 'es-en')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('daysBack') || '7', 10);
    const languagePair = searchParams.get('languagePair') || 'es-en';

    // Get analytics summary
    const summary = await getAnalyticsSummary(prisma, daysBack);

    // Get popular words for specific language pair
    const popularWords = await getPopularWords(prisma, languagePair, 50, daysBack);

    // Get API performance
    const apiPerformance = await getApiPerformanceSummary(prisma, daysBack);

    return NextResponse.json({
      success: true,
      period: {
        daysBack,
        startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      },
      overview: {
        totalLookups: summary.totalLookups,
        totalSaves: summary.totalSaves,
        saveRate: Math.round(summary.saveRate * 100),
        cacheHitRate: Math.round(summary.cacheHitRate * 100),
        avgResponseTime: Math.round(summary.avgResponseTime),
        totalApiCalls: summary.totalApiCalls,
        apiCallsSaved: summary.apiCallsSaved,
      },
      popularWords: popularWords.slice(0, 20), // Top 20
      apiPerformance,
      languagePair,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve analytics data' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/cache-performance
 * 
 * Returns detailed cache performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, languagePair } = body;

    // Validate inputs
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get cache performance metrics for date range
    const metrics = await prisma.wordLookupEvent.groupBy({
      by: ['languagePair'],
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        ...(languagePair && { languagePair }),
      },
      _count: {
        id: true,
        cacheHit: true,
        cacheMiss: true,
        wasSaved: true,
      },
      _sum: {
        responseTime: true,
        apiCallsCount: true,
      },
      _avg: {
        responseTime: true,
        confidenceScore: true,
      },
    });

    // Get counts for boolean fields (cannot use _sum on booleans)
    const cacheHitCounts = await prisma.wordLookupEvent.groupBy({
      by: ['languagePair'],
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        cacheHit: true,
        ...(languagePair && { languagePair }),
      },
      _count: { id: true },
    });

    const cacheMissCounts = await prisma.wordLookupEvent.groupBy({
      by: ['languagePair'],
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        cacheMiss: true,
        ...(languagePair && { languagePair }),
      },
      _count: { id: true },
    });

    const savedCounts = await prisma.wordLookupEvent.groupBy({
      by: ['languagePair'],
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        wasSaved: true,
        ...(languagePair && { languagePair }),
      },
      _count: { id: true },
    });

    // Create lookup maps for counts
    const cacheHitMap = new Map(cacheHitCounts.map(c => [c.languagePair, c._count.id]));
    const cacheMissMap = new Map(cacheMissCounts.map(c => [c.languagePair, c._count.id]));
    const savedMap = new Map(savedCounts.map(c => [c.languagePair, c._count.id]));

    const result = metrics.map((metric) => {
      const cacheHits = cacheHitMap.get(metric.languagePair) || 0;
      const cacheMisses = cacheMissMap.get(metric.languagePair) || 0;
      const totalSaves = savedMap.get(metric.languagePair) || 0;

      return {
        languagePair: metric.languagePair,
        totalLookups: metric._count.id,
        cacheHits,
        cacheMisses,
        cacheHitRate: metric._count.id > 0 
          ? Math.round((cacheHits / metric._count.id) * 100) 
          : 0,
        avgResponseTime: Math.round(metric._avg.responseTime || 0),
        totalApiCalls: metric._sum.apiCallsCount || 0,
        totalSaves,
        saveRate: metric._count.id > 0 
          ? Math.round((totalSaves / metric._count.id) * 100) 
          : 0,
        avgConfidence: metric._avg.confidenceScore 
          ? Math.round(metric._avg.confidenceScore * 100) 
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      period: {
        startDate,
        endDate,
      },
      metrics: result,
    });
  } catch (error) {
    console.error('[Analytics API] Cache performance error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve cache performance data' 
      },
      { status: 500 }
    );
  }
}
