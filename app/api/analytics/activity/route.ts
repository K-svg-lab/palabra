/**
 * Activity Tracking API Endpoint (Phase 18.1.2)
 * 
 * Receives activity events from client and updates retention metrics.
 * 
 * Actions:
 * - heartbeat: Periodic activity ping
 * - review: User completed a review
 * - word_added: User added a new word
 * - session_started: User started a review session
 * - session_completed: User completed a review session
 * 
 * @see lib/hooks/use-retention-tracking.ts
 * @see lib/services/retention-analytics.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackUserActivity,
  initializeUserCohort,
  trackWordAdded,
} from '@/lib/services/retention-analytics';
import { prisma } from '@/lib/backend/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, timestamp } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure UserCohort exists
    const cohort = await prisma.userCohort.findUnique({
      where: { userId },
    });

    if (!cohort) {
      // Initialize cohort on first activity
      await initializeUserCohort(userId);
    }

    // Handle different action types
    switch (action) {
      case 'heartbeat':
        // Periodic activity ping
        await trackUserActivity(userId);
        break;

      case 'review':
        // Review completed - already tracked by trackReviewAttempt
        // Just update activity timestamp
        await trackUserActivity(userId);
        break;

      case 'word_added':
        // User added a new word
        await trackWordAdded(userId);
        break;

      case 'session_started':
        // Session started - track activity
        await trackUserActivity(userId);
        break;

      case 'session_completed':
        // Session completed - track activity
        await trackUserActivity(userId);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      userId,
      action,
      timestamp: timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Activity tracking error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
