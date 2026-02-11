/**
 * Stripe Integration Service
 * Handles subscription creation, management, and webhook processing
 * Phase 18.3.1: Monetization Implementation
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/backend/db';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
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
  success_url: string,
  cancel_url: string
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
    success_url: success_url,
    cancel_url: cancel_url,
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
  return_url: string
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
    return_url: return_url,
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
        const payment_intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(payment_intent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const payment_intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(payment_intent);
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

  // Use type assertion to access properties (Stripe v20 API types are incomplete for preview versions)
  const sub = subscription as any;
  
  // If dates are missing at top level, fetch fresh subscription data from Stripe
  let actualSubscription = subscription;
  if (!sub.current_period_start || !sub.current_period_end) {
    console.log('[Stripe] Dates missing, fetching subscription from API...');
    actualSubscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['latest_invoice', 'customer'],
    });
  }
  
  const subData = actualSubscription as any;
  const item = actualSubscription.items.data[0] as any;
  
  // Try top-level first, then fall back to item level (where Stripe stores these in some webhook events)
  const periodEnd = new Date((subData.current_period_end || item.current_period_end || subData.currentPeriodEnd) * 1000);
  const periodStart = new Date((subData.current_period_start || item.current_period_start || subData.currentPeriodStart) * 1000);
  const price = item.price as any;

  // Update or create subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: actualSubscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: actualSubscription.id,
      stripePriceId: price.id,
      stripeCurrentPeriodStart: periodStart,
      stripeCurrentPeriodEnd: periodEnd,
      status: actualSubscription.status,
      tier: 'premium',
      amount: ((price.unit_amount || price.unitAmount) || 0) / 100,
      currency: actualSubscription.currency,
      interval: price.recurring?.interval || 'month',
    },
    update: {
      status: actualSubscription.status,
      stripeCurrentPeriodStart: periodStart,
      stripeCurrentPeriodEnd: periodEnd,
      stripePriceId: price.id,
      amount: ((price.unit_amount || price.unitAmount) || 0) / 100,
      canceledAt: (subData.canceled_at || subData.canceledAt) ? new Date((subData.canceled_at || subData.canceledAt) * 1000) : null,
      cancelAtEnd: subData.cancel_at_period_end || subData.cancelAtPeriodEnd || false,
    },
  });

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: actualSubscription.status === 'active' ? 'premium' : 'free',
      subscriptionStatus: actualSubscription.status,
      stripeSubscriptionId: actualSubscription.id,
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
  const inv = invoice as any;
  if (!inv.subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: inv.subscription as string },
  });

  if (!subscription) {
    console.error('[Stripe] Subscription not found for invoice:', invoice.id);
    return;
  }

  // Create payment record
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentIntentId: (inv.payment_intent || inv.paymentIntent) as string,
      stripeInvoiceId: invoice.id,
      amount: (inv.amount_paid || inv.amountPaid || 0) / 100,
      currency: invoice.currency,
      type: 'subscription',
      status: 'succeeded',
      description: `Subscription payment - ${subscription.interval}`,
      receiptUrl: (inv.hosted_invoice_url || inv.hostedInvoiceUrl) || undefined,
      paidAt: new Date(),
    },
  });

  console.log(`[Stripe] Payment succeeded for subscription ${subscription.id}`);
}

/**
 * Handle failed invoice payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const inv = invoice as any;
  if (!inv.subscription) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: inv.subscription as string },
  });

  if (!subscription) {
    return;
  }

  // Create failed payment record
  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      stripePaymentIntentId: (inv.payment_intent || inv.paymentIntent) as string,
      stripeInvoiceId: invoice.id,
      amount: (inv.amount_due || inv.amountDue || 0) / 100,
      currency: invoice.currency,
      type: 'subscription',
      status: 'failed',
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
  payment_intent: Stripe.PaymentIntent
): Promise<void> {
  // Payment intents for subscriptions are handled via invoices
  // This handles standalone payments (if any)
  console.log(`[Stripe] Payment intent succeeded: ${payment_intent.id}`);
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  payment_intent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`[Stripe] Payment intent failed: ${payment_intent.id}`);
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
