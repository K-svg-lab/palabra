/**
 * Stripe Webhook Handler
 * Processes Stripe events (subscriptions, payments, etc.)
 * Phase 18.3.1: Monetization Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, handleWebhookEvent } from '@/lib/services/stripe';
import Stripe from 'stripe';

// Disable Next.js body parsing (Stripe requires raw body)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/stripe
 * Handle all Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text();
    
    // Get Stripe signature
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature provided');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log webhook event
    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Handle the event
    try {
      await handleWebhookEvent(event);
      
      return NextResponse.json({
        received: true,
        eventType: event.type,
        eventId: event.id,
      });
    } catch (handlerError) {
      console.error('[Stripe Webhook] Handler failed:', handlerError);
      
      // Return 500 so Stripe retries the webhook
      return NextResponse.json(
        {
          error: 'Handler failed',
          eventType: event.type,
          eventId: event.id,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 * Return webhook configuration info (for debugging)
 */
export async function GET() {
  const isConfigured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  );

  return NextResponse.json({
    configured: isConfigured,
    endpoint: '/api/webhooks/stripe',
    message: isConfigured
      ? 'Webhook endpoint is configured'
      : 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET',
  });
}
