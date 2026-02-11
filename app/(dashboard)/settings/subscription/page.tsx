/**
 * Subscription Management Page
 * View and manage subscription, upgrade, or cancel
 * Phase 18.3.1: Monetization Implementation
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Check, X, AlertCircle } from 'lucide-react';
import { PricingCard } from '@/components/subscription/pricing-card';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AppHeader } from '@/components/ui/app-header';

export default function SubscriptionPage() {
  const {
    subscription,
    isLoading,
    tier,
    upgradeToPremium,
    upgradeToLifetime,
    manageBilling,
    isUpgrading,
    isManaging,
  } = useSubscription();

  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get('canceled') === 'true') {
      setShowCanceled(true);
      setTimeout(() => setShowCanceled(false), 5000);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppHeader
          title="Subscription"
          subtitle="Manage your plan"
          backHref="/settings"
        />
        <div className="container max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppHeader
        title="Subscription"
        subtitle="Choose the perfect plan for your learning journey"
        backHref="/settings"
      />

      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Success Alert */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Check className="w-4 h-4 text-green-600" />
              <AlertTitle className="text-green-900 dark:text-green-100">
                Payment Successful!
              </AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your subscription has been activated. Enjoy all premium features!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Canceled Alert */}
        {showCanceled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900 dark:text-yellow-100">
                Payment Canceled
              </AlertTitle>
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                You can upgrade anytime. Your progress is saved.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Current Plan Status */}
        {subscription && tier !== 'free' && (
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 capitalize">
                    {tier} Plan
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subscription.isLifetime ? (
                      <>
                        Lifetime access • Purchased{' '}
                        {subscription.lifetimePaymentDate &&
                          new Date(subscription.lifetimePaymentDate).toLocaleDateString()}
                      </>
                    ) : subscription.status === 'active' ? (
                      <>
                        Active until{' '}
                        {subscription.subscriptionEnd &&
                          new Date(subscription.subscriptionEnd).toLocaleDateString()}
                      </>
                    ) : (
                      <>Status: {subscription.status}</>
                    )}
                  </p>
                  {subscription.isLifetime && subscription.lifetimeAmount && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      One-time payment: ${subscription.lifetimeAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Manage Billing Button (only for recurring subscriptions) */}
              {tier === 'premium' &&
                !subscription.isLifetime &&
                subscription.canManageBilling && (
                  <Button
                    variant="outline"
                    onClick={manageBilling}
                    disabled={isManaging}
                  >
                    {isManaging ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Manage Billing'
                    )}
                  </Button>
                )}
            </div>
          </motion.div>
        )}

        {/* Billing Interval Toggle (for Premium only) */}
        {tier === 'free' && (
          <div className="flex justify-center">
            <div className="inline-flex bg-white dark:bg-gray-900 rounded-full p-1 border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setInterval('month')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === 'month'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === 'year'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Yearly <span className="ml-1 text-xs">(Save $20)</span>
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <PricingCard
            tier="free"
            isCurrentPlan={tier === 'free'}
            onSelect={() => {}}
            isLoading={false}
          />
          <PricingCard
            tier="premium"
            interval={interval}
            isCurrentPlan={tier === 'premium' && !subscription?.isLifetime}
            onSelect={() => upgradeToPremium(interval)}
            isLoading={isUpgrading}
          />
          <PricingCard
            tier="lifetime"
            isCurrentPlan={subscription?.isLifetime || false}
            onSelect={upgradeToLifetime}
            isLoading={isUpgrading}
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16 space-y-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <FAQItem
            question="Can I cancel anytime?"
            answer="Yes! You can cancel your subscription anytime. You'll keep premium access until the end of your billing period."
          />
          <FAQItem
            question="What happens to my data if I cancel?"
            answer="Your vocabulary and progress are saved forever. You can downgrade and still access all your words in the free tier."
          />
          <FAQItem
            question="Is the lifetime plan really lifetime?"
            answer="Yes! Pay once, access premium features forever. No recurring charges, no hidden fees."
          />
          <FAQItem
            question="Can I upgrade from monthly to yearly?"
            answer="Yes! Use the 'Manage Billing' button to change your plan. You'll be credited for any unused time."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact support@palabra.app for a full refund."
          />
        </div>

        {/* Trust Signals */}
        <div className="max-w-3xl mx-auto mt-12 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                🔒 Secure
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payments processed by Stripe
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                💳 Flexible
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cancel anytime, no questions
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                🎓 Proven
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on research, not hype
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ Item Component
 */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        {question}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{answer}</p>
    </motion.div>
  );
}
