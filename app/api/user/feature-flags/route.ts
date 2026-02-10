/**
 * Feature Flags API (Phase 18.2.3)
 * 
 * Returns feature flags for current user based on A/B test assignment.
 * 
 * @module api/user/feature-flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/backend/auth';
import { prisma } from '@/lib/backend/db';
import {
  getUserFeatureFlags,
  getGuestFeatureFlags,
} from '@/lib/services/ab-test-assignment';

/**
 * GET /api/user/feature-flags
 * 
 * Returns feature flags for authenticated user.
 * For guests, returns default features.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();

    if (!session?.userId) {
      // Guest user - return default features
      return NextResponse.json({
        flags: getGuestFeatureFlags(),
        isGuest: true,
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get feature flags
    const flags = await getUserFeatureFlags(user.id);

    return NextResponse.json({
      flags,
      isGuest: false,
    });
  } catch (error) {
    console.error('[Feature Flags API] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
