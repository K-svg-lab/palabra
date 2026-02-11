/**
 * User Subscription API
 * Get current user's subscription status and details
 * Phase 18.3.1: Monetization Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/backend/api-utils';
import { getUserSubscription, hasActivePremium } from '@/lib/services/stripe';
import { PREMIUM_FEATURES } from '@/lib/middleware/subscription-guard';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription details
    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check active premium status
    const isPremium = await hasActivePremium(user.id);

    // Build feature access map
    const features: Record<string, boolean> = {};
    for (const [key, feature] of Object.entries(PREMIUM_FEATURES)) {
      // Premium features require active premium
      features[key] = feature.tier === 'premium' ? isPremium : true;
    }

    return NextResponse.json({
      tier: subscription.tier,
      status: subscription.status,
      isActive: subscription.isActive,
      isPremium,
      isLifetime: subscription.isLifetime,
      subscriptionStart: subscription.subscriptionStart,
      subscriptionEnd: subscription.subscriptionEnd,
      lifetimePaymentDate: subscription.lifetimePaymentDate,
      lifetimeAmount: subscription.lifetimeAmount,
      canManageBilling: subscription.canManageBilling,
      features,
    });

  } catch (error) {
    console.error('[Subscription API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
