/**
 * A/B Test Analytics API Route
 * 
 * Tracks A/B test variant views and events for analysis.
 * Phase 16.2 - Task 3: A/B Test Cache Indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * POST /api/analytics/ab-test
 * 
 * Records A/B test events (views, interactions, conversions)
 * 
 * Body:
 * {
 *   testName: string;
 *   variant: 'control' | 'variantA' | 'variantB' | 'variantC';
 *   eventType: 'view' | 'event';
 *   eventName?: string; // For custom events (click, hover, etc.)
 *   eventData?: any;
 *   timestamp: string;
 *   userAgent: string;
 *   screenSize: string;
 *   deviceType: 'mobile' | 'tablet' | 'desktop';
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      testName,
      variant,
      eventType,
      eventName,
      eventData,
      timestamp,
      userAgent,
      screenSize,
      deviceType,
    } = body;

    // Validate required fields
    if (!testName || !variant || !eventType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: testName, variant, eventType' },
        { status: 400 }
      );
    }

    // Store in database
    await prisma.aBTestEvent.create({
      data: {
        testName,
        variant,
        eventType,
        eventName: eventName || null,
        eventData: eventData ? JSON.stringify(eventData) : null,
        userAgent: userAgent || null,
        screenSize: screenSize || null,
        deviceType: deviceType || 'unknown',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test event recorded',
    });
  } catch (error) {
    console.error('[AB Test API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record A/B test event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/ab-test
 * 
 * Retrieves A/B test results and statistics
 * 
 * Query parameters:
 * - testName: Filter by test name
 * - daysBack: Number of days to look back (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get('testName');
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Build where clause
    const whereClause: any = {
      timestamp: { gte: startDate },
    };
    if (testName) {
      whereClause.testName = testName;
    }

    // Get all events
    const events = await prisma.aBTestEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit for performance
    });

    // Aggregate statistics
    const stats = aggregateABTestStats(events);

    return NextResponse.json({
      success: true,
      period: {
        daysBack,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      totalEvents: events.length,
      statistics: stats,
    });
  } catch (error) {
    console.error('[AB Test API] Error retrieving stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve A/B test statistics' },
      { status: 500 }
    );
  }
}

/**
 * Aggregate A/B test statistics
 */
function aggregateABTestStats(events: any[]): any {
  const stats: Record<string, any> = {};

  // Group by test name
  const testGroups = events.reduce((acc, event) => {
    if (!acc[event.testName]) {
      acc[event.testName] = [];
    }
    acc[event.testName].push(event);
    return acc;
  }, {});

  // Calculate stats for each test
  for (const [testName, testEvents] of Object.entries(testGroups)) {
    const eventArray = testEvents as any[];
    
    // Group by variant
    const variantStats: Record<string, any> = {};
    const variants = ['control', 'variantA', 'variantB', 'variantC'];

    for (const variant of variants) {
      const variantEvents = eventArray.filter(e => e.variant === variant);
      const views = variantEvents.filter(e => e.eventType === 'view').length;
      const interactions = variantEvents.filter(e => e.eventType === 'event').length;
      const clicks = variantEvents.filter(e => e.eventName === 'click').length;
      const hovers = variantEvents.filter(e => e.eventName === 'hover').length;

      // Calculate metrics
      const clickRate = views > 0 ? (clicks / views) * 100 : 0;
      const interactionRate = views > 0 ? (interactions / views) * 100 : 0;

      // Device breakdown
      const deviceBreakdown = {
        mobile: variantEvents.filter(e => e.deviceType === 'mobile').length,
        tablet: variantEvents.filter(e => e.deviceType === 'tablet').length,
        desktop: variantEvents.filter(e => e.deviceType === 'desktop').length,
      };

      variantStats[variant] = {
        views,
        interactions,
        clicks,
        hovers,
        clickRate: Math.round(clickRate * 100) / 100,
        interactionRate: Math.round(interactionRate * 100) / 100,
        deviceBreakdown,
      };
    }

    stats[testName] = {
      totalEvents: eventArray.length,
      totalViews: eventArray.filter(e => e.eventType === 'view').length,
      totalInteractions: eventArray.filter(e => e.eventType === 'event').length,
      variants: variantStats,
    };
  }

  return stats;
}
