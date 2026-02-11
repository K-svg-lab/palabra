/**
 * Stripe Integration Service
 * Handles subscription creation, management, and webhook processing
 * Phase 18.3.1: Monetization Implementation
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/backend/db';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Price IDs from Stripe Dashboard (set in environment variables)
export const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  lifetime: process.env.STRIPE_PRICE_LIFETIME!,
};

// Subscription tiers
export type SubscriptionTier = 'free' | 'premium' | 'lifetime';

/**
 * Create Stripe checkout session for subscription or one-time payment
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name || undefined,
      metadata: { userId },
    });

    customerId = customer.id;

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Determine mode (subscription vs one-time payment)
  const isLifetime = priceId === PRICE_IDS.lifetime;
  const mode = isLifetime ? 'payment' : 'subscription';

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      userId,
      priceId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

/**
 * Create Stripe customer portal session for subscription management
 */
export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found for user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Main webhook handler - processes all Stripe events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`[Stripe Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      // Checkout completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      // Subscription lifecycle
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // Invoice events
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      // Payment intent events (for one-time payments)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    throw error; // Re-throw to return 500 to Stripe
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('[Stripe] No userId in session metadata');
    return;
  }

  if (session.mode === 'payment') {
    // One-time payment (lifetime)
    await handleLifetimePurchase(session, userId);
  } else if (session.mode === 'subscription') {
    // Subscription payment
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(subscription);
  }
}

/**
 * Handle lifetime purchase
 */
async function handleLifetimePurchase(
  session: Stripe.Checkout.Session,
  userId: string
): Promise<void> {
  const amount = (session.amount_total || 0) / 100; // Convert cents to dollars

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'lifetime',
      subscriptionStatus: 'active',
      lifetimePayment: true,
      lifetimePaymentDate: new Date(),
      lifetimeAmount: amount,
    },
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      userId,
      stripePaymentIntentId: session.payment_intent as string,
      amount,
      type: 'lifetime',
      status: 'succeeded',
      description: 'Lifetime Premium Access',
      paidAt: new Date(),
    },
  });

  // Update cohort if exists
  await prisma.userCohort.update({
    where: { userId },
    data: {
      isPremium: true,
      premiumSince: new Date(),
    },
  }).catch(() => {
    // Cohort might not exist yet - that's okay
  });

  console.log(`[Stripe] Lifetime purchase complete for user ${userId}`);
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find user by customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!user) {
    console.error('[Stripe] User not found for customer:', subscription.customer);
    return;
  }

  const periodEnd = new Date(subscription.current_period_end * 1000);
  const periodStart = new Date(subscription.current_period_start * 1000);
  const price = subscription.items.data[0].price;

  // Update or create subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCurrentPeriodStart: periodStart,
      stripeCurrentPeriodEnd: periodEnd,
      status: subscription.status,
      tier: 'premium',
      amount: (price.unit_amount || 0) / 100,
      currency: subscription.currency,
      interval: price.recurring?.interval || 'month',
    },
    update: {
      status: subscription.status,
      stripeCurrentPeriodStart: periodStart,
      stripeCurrentPeriodEnd: periodEnd,
      stripePriceId: price.id,
      amount: (price.unit_amount || 0) / 100,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      cancelAtEnd: subscription.cancel_at_period_end,
    },
  });

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: subscription.status === 'active' ? 'premium' : 'free',
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      subscriptionStart: periodStart,
      subscriptionEnd: periodEnd,
    },
  });

  // Update cohort
  await prisma.userCohort.update({
    where: { userId: user.id },
    data: {
      isPremium: subscription.status === 'active',
      premiumSince: subscription.status === 'active' ? periodStart : null,
    },
  }).catch(() => {
    // Cohort might not exist yet
  });

  console.log(`[Stripe] Subscription ${subscription.status} for user ${user.id}`);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // Find user
  const user = await prisma.user.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (user) {
    // Downgrade to free tier
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
      },
    });

    // Update cohort
    await prisma.userCohort.update({
      where: { userId: user.id },
      data: {
        isPremium: false,
      },
    }).catch(() => {});

    console.log(`[Stripe] Subscription canceled for user ${user.id}`);
  }
}

/**
 * Handle successful invoice payment (recurring subscription)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (!subscription) {
    console.error('[Stripe] Subscription not found for invoice:', invoice.id);
    return;
  }

  // Create payment record
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      stripeChargeId: invoice.charge as string,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      type: 'subscription',
      status: 'succeeded',
      subscriptionId: subscription.id,
      description: `Subscription payment - ${subscription.interval}`,
      receiptUrl: invoice.hosted_invoice_url || undefined,
      paidAt: new Date(),
    },
  });

  console.log(`[Stripe] Payment succeeded for subscription ${subscription.id}`);
}

/**
 * Handle failed invoice payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (!subscription) {
    return;
  }

  // Create failed payment record
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      type: 'subscription',
      status: 'failed',
      subscriptionId: subscription.id,
      description: `Failed subscription payment - ${subscription.interval}`,
      failureMessage: 'Payment failed',
    },
  });

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'past_due' },
  });

  // Update user status
  await prisma.user.update({
    where: { id: subscription.userId },
    data: { subscriptionStatus: 'past_due' },
  });

  console.log(`[Stripe] Payment failed for subscription ${subscription.id}`);
}

/**
 * Handle successful payment intent (one-time payments)
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  // Payment intents for subscriptions are handled via invoices
  // This handles standalone payments (if any)
  console.log(`[Stripe] Payment intent succeeded: ${paymentIntent.id}`);
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`[Stripe] Payment intent failed: ${paymentIntent.id}`);
}

/**
 * Check if user has active premium subscription or lifetime access
 */
export async function hasActivePremium(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEnd: true,
      lifetimePayment: true,
    },
  });

  if (!user) return false;

  // Lifetime always has access
  if (user.lifetimePayment || user.subscriptionTier === 'lifetime') {
    return true;
  }

  // Premium with active subscription
  if (
    user.subscriptionTier === 'premium' &&
    user.subscriptionStatus === 'active' &&
    user.subscriptionEnd &&
    user.subscriptionEnd > new Date()
  ) {
    return true;
  }

  return false;
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionStart: true,
      subscriptionEnd: true,
      lifetimePayment: true,
      lifetimePaymentDate: true,
      lifetimeAmount: true,
      stripeCustomerId: true,
    },
  });

  if (!user) return null;

  return {
    tier: user.subscriptionTier as SubscriptionTier,
    status: user.subscriptionStatus,
    isActive: await hasActivePremium(userId),
    subscriptionStart: user.subscriptionStart,
    subscriptionEnd: user.subscriptionEnd,
    isLifetime: user.lifetimePayment,
    lifetimePaymentDate: user.lifetimePaymentDate,
    lifetimeAmount: user.lifetimeAmount,
    canManageBilling: !!user.stripeCustomerId,
  };
}

export { stripe };
