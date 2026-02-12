/**
 * Pricing Card Component
 * Apple-inspired pricing cards with Phase 17 design system
 * Phase 18.3.1: Monetization Implementation (Phase 17 Enhanced)
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
    price: '€0',
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
    cta: 'Start Free',
    highlighted: false,
    buttonVariant: 'outline' as const,
  },
  premium: {
    name: 'Premium',
    price: '€4.99',
    yearlyPrice: '€39.99',
    period: 'per month',
    yearlyPeriod: 'per year',
    yearlyNote: 'Save €20 with annual',
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
    price: '€79.99',
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
  
  // Determine if user can downgrade (only for free tier when they have premium/lifetime)
  const isDowngrade = tier === 'free' && !isCurrentPlan;
  
  // For premium, show yearly price if interval is 'year'
  const premiumPlan = tier === 'premium' ? PLANS.premium : null;
  const displayPrice =
    tier === 'premium' && interval === 'year' && premiumPlan
      ? premiumPlan.yearlyPrice
      : plan.price;
  const displayPeriod =
    tier === 'premium' && interval === 'year' && premiumPlan
      ? premiumPlan.yearlyPeriod
      : plan.period;

  return (
    <motion.div
      className={cn(
        'relative rounded-3xl p-8 border-2 transition-all duration-300',
        plan.highlighted
          ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-purple-500 shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/40'
          : tier === 'lifetime'
          ? 'bg-gradient-to-br from-orange-900/40 to-yellow-900/40 backdrop-blur-sm border-orange-500 shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/40'
          : tier === 'free'
          ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border-blue-500/50 shadow-lg shadow-blue-500/10 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20'
          : 'bg-gradient-to-br from-gray-900/40 to-gray-800/40 border-gray-700 hover:border-gray-600 hover:shadow-lg',
        isCurrentPlan && 'ring-2 ring-white/20'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay: tier === 'free' ? 0.1 : tier === 'premium' ? 0.2 : 0.3,
        type: 'spring',
        stiffness: 150
      }}
      whileHover={
        !isCurrentPlan 
          ? { 
              scale: plan.highlighted ? 1.03 : 1.02,
              y: plan.highlighted ? -4 : -5,
              transition: { duration: 0.2, type: 'spring', stiffness: 300 }
            } 
          : undefined
      }
    >
      {/* Badges and Active Indicator - Show both when appropriate */}
      
      {/* Active Checkmark - Top right corner */}
      {isCurrentPlan && (
        <motion.div
          className="absolute -top-3 -right-3 z-10"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <div 
            className={cn(
              'rounded-full p-2 shadow-xl border-2 border-gray-950',
              tier === 'premium' && 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/50',
              tier === 'lifetime' && 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-orange-500/50',
              tier === 'free' && 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/50'
            )}
          >
            <Check className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      )}

      {/* Badge - Top center (MOST POPULAR, BEST VALUE) - Enhanced with glow */}
      {'badge' in plan && plan.badge && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <span
            className={cn(
              'inline-block bg-gradient-to-r text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider',
              'badgeColor' in plan ? plan.badgeColor : '',
              tier === 'premium' && 'shadow-xl shadow-purple-500/60',
              tier === 'lifetime' && 'shadow-xl shadow-orange-500/60'
            )}
          >
            {plan.badge}
          </span>
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        className="flex justify-center mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm',
            plan.highlighted
              ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 shadow-lg shadow-purple-500/20'
              : tier === 'lifetime'
              ? 'bg-gradient-to-br from-orange-500/30 to-yellow-500/30 shadow-lg shadow-orange-500/20'
              : tier === 'free'
              ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 shadow-lg shadow-blue-500/20'
              : 'bg-gray-800/50'
          )}
        >
          <Icon className={cn('w-8 h-8', plan.iconColor)} />
        </div>
      </motion.div>

      {/* Header - Enhanced typography */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
        <div className="mb-3">
          <div>
            <span className="text-6xl md:text-7xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {displayPrice}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2">
            {displayPeriod}
          </div>
        </div>
        {tier === 'premium' && interval === 'year' && premiumPlan?.yearlyNote && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <span className="text-green-400 text-xs font-semibold">💰 {premiumPlan.yearlyNote}</span>
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
          {plan.description}
        </p>
      </div>

      {/* Features - Enhanced with circular backgrounds */}
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-400" />
              </div>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {feature}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* CTA - Enhanced with delightful states and animations */}
      <motion.div
        whileHover={!isCurrentPlan && !isLoading && !isDowngrade ? { scale: 1.05 } : undefined}
        whileTap={!isCurrentPlan && !isLoading && !isDowngrade ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Button
          onClick={onSelect}
          disabled={isCurrentPlan || isLoading || isDowngrade}
          variant={isCurrentPlan ? 'outline' : 'default'}
          className={cn(
            'w-full py-6 text-lg font-semibold transition-all duration-300 relative overflow-hidden',
            isCurrentPlan 
              ? 'cursor-not-allowed border-2 border-white/40 bg-white/15 backdrop-blur-md text-white font-bold hover:bg-white/15 shadow-lg'
              : isDowngrade
              ? 'bg-gray-800/30 border-2 border-gray-700/50 text-gray-500 cursor-not-allowed'
              : plan.highlighted &&
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/60',
            !isCurrentPlan && !isDowngrade && tier === 'lifetime' &&
              'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/60',
            !isCurrentPlan && !isDowngrade && tier === 'free' &&
              'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            <div className="flex items-center justify-center gap-2.5">
              <div 
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shadow-lg',
                  tier === 'premium' && 'bg-white shadow-purple-500/30',
                  tier === 'lifetime' && 'bg-white shadow-orange-500/30',
                  tier === 'free' && 'bg-white shadow-blue-500/30'
                )}
              >
                <Check 
                  className={cn(
                    'w-3.5 h-3.5',
                    tier === 'premium' && 'text-purple-500',
                    tier === 'lifetime' && 'text-orange-500',
                    tier === 'free' && 'text-blue-500'
                  )}
                  strokeWidth={3} 
                />
              </div>
              <span className="font-bold text-white">Active</span>
            </div>
          ) : isDowngrade ? (
            <div className="flex items-center justify-center gap-2">
              <span>Not Available</span>
            </div>
          ) : (
            plan.cta
          )}
        </Button>
      </motion.div>

      {/* Helpful note for downgrade option */}
      {isDowngrade && (
        <motion.p 
          className="text-xs text-center mt-3 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Contact support to downgrade
        </motion.p>
      )}
    </motion.div>
  );
}
