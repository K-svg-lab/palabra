/**
 * How It Works Component
 * 3-step process showing user journey
 * Phase 17 Design: Clear information hierarchy, visual flow
 */

'use client';

import { motion } from 'framer-motion';
import { PlusCircle, Repeat, TrendingUp, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: PlusCircle,
    title: 'Add Words',
    description: 'Just type a Spanish word. AI automatically fetches translations, examples, and pronunciation.',
    features: ['AI translations', 'Native audio', 'Real examples'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    icon: Repeat,
    title: 'Practice Daily',
    description: '5 varied review methods keep learning engaging. Smart scheduling shows you the right words at the right time.',
    features: ['5 practice methods', 'Spaced repetition', 'Adaptive difficulty'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Beautiful visualizations show your vocabulary growth, streaks, and achievements.',
    features: ['Activity rings', 'Streak tracking', '12 achievements'],
    gradient: 'from-pink-500 to-orange-500',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start learning in 3 simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-orange-200 dark:from-blue-900 dark:via-purple-900 dark:to-orange-900 transform -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Card */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    {/* Step Number */}
                    <div className="absolute -top-6 left-8">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {step.number}
                        </span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 mt-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {step.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.gradient}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
