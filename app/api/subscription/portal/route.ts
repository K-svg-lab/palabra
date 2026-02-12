/**
 * Customer Portal API
 * Creates Stripe customer portal session for subscription management
 * Phase 18.3.1: Monetization Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/backend/api-utils';
import { createCustomerPortalSession } from '@/lib/services/stripe';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build return URL
    const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
    const returnUrl = `${baseUrl}/dashboard/settings/subscription`;

    // Create portal session
    const portalUrl = await createCustomerPortalSession(user.id, returnUrl);

    return NextResponse.json({
      url: portalUrl,
    });

  } catch (error) {
    console.error('[Portal API] Error:', error);
    
    // Handle specific error for users without Stripe customer
    if (error instanceof Error && error.message.includes('No Stripe customer')) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
