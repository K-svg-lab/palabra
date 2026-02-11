/**
 * Subscription Checkout API
 * Creates Stripe checkout session for subscriptions and lifetime purchases
 * Phase 18.3.1: Monetization Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/backend/api-utils';
import { createCheckoutSession, PRICE_IDS } from '@/lib/services/stripe';

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

    // Parse request body
    const body = await request.json();
    const { tier, interval } = body;

    // Validate tier and interval
    if (!tier || !['premium', 'lifetime'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    if (tier === 'premium' && !interval) {
      return NextResponse.json(
        { error: 'Interval required for premium subscription' },
        { status: 400 }
      );
    }

    if (tier === 'premium' && !['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year"' },
        { status: 400 }
      );
    }

    // Determine price ID
    let priceId: string;
    
    if (tier === 'lifetime') {
      priceId = PRICE_IDS.lifetime;
    } else if (interval === 'month') {
      priceId = PRICE_IDS.premium_monthly;
    } else {
      priceId = PRICE_IDS.premium_yearly;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }

    // Build success/cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/settings/subscription?success=true&tier=${tier}`;
    const cancelUrl = `${baseUrl}/settings/subscription?canceled=true`;

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      user.id,
      priceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      url: checkoutUrl,
      tier,
      interval: tier === 'premium' ? interval : null,
    });

  } catch (error) {
    console.error('[Checkout API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
