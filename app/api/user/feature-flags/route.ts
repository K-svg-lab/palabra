/**
 * Feature Flags API (Phase 18.2.3)
 * 
 * Returns feature flags for current user based on A/B test assignment.
 * 
 * @module api/user/feature-flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/backend/prisma/client';
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Guest user - return default features
      return NextResponse.json({
        flags: getGuestFeatureFlags(),
        isGuest: true,
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
