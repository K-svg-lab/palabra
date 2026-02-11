/**
 * Pricing Card Component
 * Apple-inspired pricing cards with clear value proposition
 * Phase 18.3.1: Monetization Implementation
 */

'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PricingCardProps {
  tier: 'free' | 'premium' | 'lifetime';
  isCurrentPlan?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  interval?: 'month' | 'year';
}

const PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Sparkles,
    iconColor: 'text-blue-500',
    description: 'Perfect for getting started',
    features: [
      'Unlimited vocabulary additions',
      'All 5 review methods',
      'Spaced repetition (SM-2)',
      'Interleaved practice',
      'Basic AI examples (cached)',
      'Progress tracking',
      'Activity insights',
    ],
    cta: 'Current Plan',
    highlighted: false,
    buttonVariant: 'outline' as const,
  },
  premium: {
    name: 'Premium',
    price: '$4.99',
    yearlyPrice: '$39.99',
    period: 'per month',
    yearlyPeriod: 'per year',
    yearlyNote: 'Save $20 with annual',
    icon: Crown,
    iconColor: 'text-purple-500',
    badge: 'MOST POPULAR',
    badgeColor: 'from-purple-500 to-pink-500',
    description: 'For serious learners',
    features: [
      'Everything in Free',
      'Deep learning mode',
      'Personalized AI examples',
      'Advanced interference detection',
      'Full analytics & export',
      'Offline mode',
      'Priority support',
    ],
    cta: 'Upgrade to Premium',
    highlighted: true,
    buttonVariant: 'default' as const,
  },
  lifetime: {
    name: 'Lifetime',
    price: '$79.99',
    period: 'one-time',
    icon: Zap,
    iconColor: 'text-yellow-500',
    badge: 'BEST VALUE',
    badgeColor: 'from-yellow-500 to-orange-500',
    description: 'Pay once, learn forever',
    features: [
      'Everything in Premium',
      'Lifetime access',
      'Never pay again',
      'Exclusive lifetime badge',
      'Vote on new features',
      'Early adopter pricing',
    ],
    cta: 'Get Lifetime Access',
    highlighted: false,
    buttonVariant: 'default' as const,
  },
};

export function PricingCard({
  tier,
  isCurrentPlan = false,
  onSelect,
  isLoading = false,
  interval = 'month',
}: PricingCardProps) {
  const plan = PLANS[tier];
  const Icon = plan.icon;
  
  // For premium, show yearly price if interval is 'year'
  const displayPrice =
    tier === 'premium' && interval === 'year' ? plan.yearlyPrice : plan.price;
  const displayPeriod =
    tier === 'premium' && interval === 'year' ? plan.yearlyPeriod : plan.period;

  return (
    <motion.div
      className={cn(
        'relative rounded-3xl p-8 border-2 transition-all duration-300',
        plan.highlighted
          ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-purple-500 shadow-xl scale-[1.02] z-10'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
        isCurrentPlan && 'ring-2 ring-green-500 ring-offset-2'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        !isCurrentPlan
          ? { scale: plan.highlighted ? 1.03 : 1.01 }
          : undefined
      }
      transition={{ duration: 0.2 }}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              'bg-gradient-to-r text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg',
              plan.badgeColor
            )}
          >
            {plan.badge}
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 right-6">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ✓ ACTIVE
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            plan.highlighted
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Icon className={cn('w-8 h-8', plan.iconColor)} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <div className="mb-2">
          <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {displayPrice}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
            {displayPeriod}
          </span>
        </div>
        {tier === 'premium' && interval === 'year' && plan.yearlyNote && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            💰 {plan.yearlyNote}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          {plan.description}
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {feature}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={onSelect}
        disabled={isCurrentPlan || isLoading}
        variant={plan.buttonVariant}
        className={cn(
          'w-full py-6 text-lg font-semibold transition-all duration-300',
          plan.highlighted &&
            !isCurrentPlan &&
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl',
          isCurrentPlan && 'cursor-not-allowed opacity-75'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          plan.cta
        )}
      </Button>

      {/* Additional info for current plan */}
      {isCurrentPlan && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          You're on this plan
        </p>
      )}
    </motion.div>
  );
}
