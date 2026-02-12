/**
 * Pricing Preview Component
 * Simplified pricing overview emphasizing free tier
 * Phase 17 Design: Clear value proposition, no pressure
 */

'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      'Unlimited words',
      'All 5 review methods',
      'Basic AI examples',
      'Progress tracking',
      'Offline mode',
      'Cloud sync',
    ],
    cta: 'Start Free',
    popular: true,
  },
  {
    name: 'Premium',
    price: '€4.99',
    period: 'per month',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    features: [
      'Everything in Free',
      'Deep learning mode',
      'Personalized AI prompts',
      'Advanced analytics',
      'Interference detection',
      'Priority support',
    ],
    cta: 'Upgrade Later',
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Start Free, Upgrade When Ready
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No credit card required. No time limit. Truly free forever.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`relative h-full p-8 rounded-3xl ${
                    isPopular
                      ? 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-xl'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <div className={`mt-0.5 p-1 rounded-full bg-gradient-to-br ${plan.gradient}`}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={isPopular ? '/dashboard' : '/dashboard/settings/subscription'}>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        isPopular
                          ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Your data is private</span>
          </div>
        </motion.div>

        {/* Comparison Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/dashboard/settings/subscription"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            See full feature comparison
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
