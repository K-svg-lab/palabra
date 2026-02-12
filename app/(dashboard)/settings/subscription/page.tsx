/**
 * Subscription Management Page
 * View and manage subscription, upgrade, or cancel
 * Phase 18.3.1: Monetization Implementation
 */

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, AlertCircle, Lock, CreditCard, GraduationCap } from 'lucide-react';
import { PricingCard } from '@/components/subscription/pricing-card';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AppHeader } from '@/components/ui/app-header';

function SubscriptionPageContent() {
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
          showBack={true}
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
        showBack={true}
      />

      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Success & Canceled Alerts - Enhanced with Phase 17 styling and exit animations */}
        <AnimatePresence mode="wait">
          {showSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <Alert className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border-2 border-green-500/50 shadow-xl shadow-green-500/20">
                <Check className="w-5 h-5 text-green-400" />
                <AlertTitle className="text-white font-bold text-lg">
                  Payment Successful!
                </AlertTitle>
                <AlertDescription className="text-gray-300">
                  Your subscription has been activated. Enjoy all premium features!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {showCanceled && (
            <motion.div
              key="canceled"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <Alert className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/20">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <AlertTitle className="text-white font-bold text-lg">
                  Payment Canceled
                </AlertTitle>
                <AlertDescription className="text-gray-300">
                  You can upgrade anytime. Your progress is saved.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Plan Status - FIX #2: Added top margin */}
        {subscription && tier !== 'free' && (
          <motion.div
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-2 border-purple-500/50 rounded-3xl p-8 shadow-xl shadow-purple-500/10 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Crown className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold mb-1 capitalize text-white">
                    {tier} Plan
                  </h3>
                  <p className="text-sm text-gray-300">
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
                    <p className="text-xs text-gray-400 mt-1">
                      One-time payment: €{subscription.lifetimeAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Manage Billing Button (only for recurring subscriptions) - Enhanced spring animation */}
              {tier === 'premium' &&
                !subscription.isLifetime &&
                subscription.canManageBilling && (
                  <motion.div
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Button
                      variant="outline"
                      onClick={manageBilling}
                      disabled={isManaging}
                      className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 hover:border-purple-500 text-white backdrop-blur-sm transition-colors duration-200"
                    >
                      {isManaging ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Manage Billing'
                      )}
                    </Button>
                  </motion.div>
                )}
            </div>
          </motion.div>
        )}

        {/* Billing Interval Toggle (for Premium only) - FIX: Added proper top spacing */}
        {tier === 'free' && (
          <motion.div
            className="flex justify-center mt-12 mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex bg-white dark:bg-gray-900 rounded-full p-1 border border-gray-200 dark:border-gray-800 shadow-lg">
              <button
                onClick={() => setInterval('month')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === 'month'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  interval === 'year'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Yearly <span className="ml-1 text-xs">(Save €20)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Pricing Cards - Enhanced spacing to prevent overlap on hover */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>

        {/* FAQ Section - FIX #7: Made more visually engaging */}
        <div className="max-w-3xl mx-auto mt-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Everything you need to know about Palabra Premium
            </p>
          </motion.div>

          <FAQItem
            question="Can I cancel anytime?"
            answer="Yes! You can cancel your subscription anytime. You'll keep premium access until the end of your billing period."
            index={0}
          />
          <FAQItem
            question="What happens to my data if I cancel?"
            answer="Your vocabulary and progress are saved forever. You can downgrade and still access all your words in the free tier."
            index={1}
          />
          <FAQItem
            question="Is the lifetime plan really lifetime?"
            answer="Yes! Pay once, access premium features forever. No recurring charges, no hidden fees."
            index={2}
          />
          <FAQItem
            question="Can I upgrade from monthly to yearly?"
            answer="Yes! Use the 'Manage Billing' button to change your plan. You'll be credited for any unused time."
            index={3}
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact support@palabra.app for a full refund."
            index={4}
          />
        </div>

        {/* Trust Signals - FIX #8: Added bottom spacing and enhanced styling */}
        <div className="max-w-5xl mx-auto mt-16 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrustSignal
            icon={Lock}
            iconColor="text-green-400"
            title="Secure"
            description="Payments processed by Stripe"
            gradientFrom="from-green-500/10"
            gradientTo="to-emerald-500/10"
            borderColor="border-green-800/30"
            delay={0.1}
          />
          <TrustSignal
            icon={CreditCard}
            iconColor="text-blue-400"
            title="Flexible"
            description="Cancel anytime, no questions"
            gradientFrom="from-blue-500/10"
            gradientTo="to-cyan-500/10"
            borderColor="border-blue-800/30"
            delay={0.2}
          />
          <TrustSignal
            icon={GraduationCap}
            iconColor="text-purple-400"
            title="Proven"
            description="Based on research, not hype"
            gradientFrom="from-purple-500/10"
            gradientTo="to-pink-500/10"
            borderColor="border-purple-800/30"
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ Item Component - Enhanced visual engagement
 */
interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
  return (
    <motion.div
      className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl p-6 border border-purple-700/30 hover:border-purple-500/50 hover:bg-purple-500/8 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
      whileHover={{ x: 4, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-start gap-2">
        <span className="text-purple-500 text-xl">Q.</span>
        {question}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed pl-7">
        {answer}
      </p>
    </motion.div>
  );
}

/**
 * Trust Signal Component - FIX #8: Enhanced visual appeal
 */
interface TrustSignalProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  delay?: number;
}

function TrustSignal({
  icon: Icon,
  iconColor,
  title,
  description,
  gradientFrom,
  gradientTo,
  borderColor,
  delay = 0,
}: TrustSignalProps) {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-8 border-2 ${borderColor} text-center backdrop-blur-sm`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <motion.div
        className="flex justify-center mb-4"
        initial={{ scale: 0.8 }}
        whileInView={{ scale: 1 }}
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ delay: delay + 0.2, type: 'spring', stiffness: 300 }}
      >
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} backdrop-blur-sm flex items-center justify-center shadow-lg`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </motion.div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

/**
 * Default Export with Suspense Boundary
 */
export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <AppHeader
            title="Subscription"
            subtitle="Manage your plan"
            showBack={true}
          />
          <div className="container max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
          </div>
        </div>
      }
    >
      <SubscriptionPageContent />
    </Suspense>
  );
}
