/**
 * Retention Analytics API Endpoint (Phase 18.1.2)
 * 
 * Provides comprehensive retention metrics for admin dashboard.
 * 
 * Endpoints:
 * - GET /api/analytics/retention?type=cohort&cohortDate=2026-02-08
 * - GET /api/analytics/retention?type=trends&days=30
 * - GET /api/analytics/retention?type=weekly&week=2026-W06
 * - GET /api/analytics/retention?type=methods&userId=xxx&days=30
 * - GET /api/analytics/retention?type=at-risk
 * 
 * Authentication: Admin only (future implementation)
 * 
 * @see lib/services/retention-analytics.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCohortRetention,
  getRetentionTrends,
  getWeeklyCohortAnalysis,
  getMethodPerformance,
  getAtRiskUsers,
} from '@/lib/services/retention-analytics';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const session = await getSession(request);
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'trends';

    switch (type) {
      case 'cohort': {
        // Get retention for a specific cohort date
        const cohortDate = searchParams.get('cohortDate');
        if (!cohortDate) {
          return NextResponse.json(
            { error: 'cohortDate parameter required' },
            { status: 400 }
          );
        }

        const date = new Date(cohortDate);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD' },
            { status: 400 }
          );
        }

        const metrics = await getCohortRetention(date);
        return NextResponse.json({ metrics });
      }

      case 'trends': {
        // Get retention trends over the last N days
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        if (isNaN(days) || days < 1 || days > 365) {
          return NextResponse.json(
            { error: 'days must be between 1 and 365' },
            { status: 400 }
          );
        }

        const trends = await getRetentionTrends(days);
        return NextResponse.json({ trends });
      }

      case 'weekly': {
        // Get weekly cohort analysis
        const week = searchParams.get('week');
        if (!week) {
          return NextResponse.json(
            { error: 'week parameter required (format: 2026-W06)' },
            { status: 400 }
          );
        }

        if (!/^\d{4}-W\d{2}$/.test(week)) {
          return NextResponse.json(
            { error: 'Invalid week format. Use YYYY-WNN (e.g., 2026-W06)' },
            { status: 400 }
          );
        }

        const analysis = await getWeeklyCohortAnalysis(week);
        if (!analysis) {
          return NextResponse.json(
            { error: 'No data found for this week' },
            { status: 404 }
          );
        }

        return NextResponse.json({ analysis });
      }

      case 'methods': {
        // Get method performance
        const userId = searchParams.get('userId') || undefined;
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        if (isNaN(days) || days < 1 || days > 365) {
          return NextResponse.json(
            { error: 'days must be between 1 and 365' },
            { status: 400 }
          );
        }

        const performance = await getMethodPerformance(userId, days);
        return NextResponse.json({ performance });
      }

      case 'at-risk': {
        // Get at-risk users
        const users = await getAtRiskUsers();
        return NextResponse.json({
          atRiskUsers: users,
          count: users.length,
        });
      }

      default: {
        return NextResponse.json(
          { error: `Unknown type: ${type}. Valid types: cohort, trends, weekly, methods, at-risk` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('[API] Retention analytics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example requests:
 * 
 * 1. Get retention trends for last 30 days:
 *    GET /api/analytics/retention?type=trends&days=30
 * 
 * 2. Get retention for specific cohort:
 *    GET /api/analytics/retention?type=cohort&cohortDate=2026-02-08
 * 
 * 3. Get weekly cohort analysis:
 *    GET /api/analytics/retention?type=weekly&week=2026-W06
 * 
 * 4. Get method performance:
 *    GET /api/analytics/retention?type=methods&days=30
 * 
 * 5. Get at-risk users:
 *    GET /api/analytics/retention?type=at-risk
 * 
 * 6. Get method performance for specific user:
 *    GET /api/analytics/retention?type=methods&userId=clxxxxx&days=7
 */
