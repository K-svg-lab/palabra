/**
 * Features Showcase Component
 * Interactive demonstration of 5 review methods with animations
 * Phase 17 Design: Visual hierarchy, smooth transitions, engaging interactions
 */

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Brain,
  Sparkles,
  MessageSquare,
  Volume2,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    id: 'methods',
    icon: Brain,
    title: '5 Review Methods',
    description: 'Varied practice keeps your brain engaged and prevents boredom',
    gradient: 'from-blue-500 to-purple-500',
    methods: [
      { name: 'Traditional Flashcards', icon: '🎴', color: 'text-blue-500' },
      { name: 'Fill in the Blank', icon: '✏️', color: 'text-purple-500' },
      { name: 'Multiple Choice', icon: '🎯', color: 'text-pink-500' },
      { name: 'Audio Recognition', icon: '🔊', color: 'text-green-500' },
      { name: 'Context Selection', icon: '📝', color: 'text-orange-500' },
    ],
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI-Powered Examples',
    description: 'Get contextual examples tailored to your proficiency level',
    gradient: 'from-purple-500 to-pink-500',
    benefits: [
      'Adapts to A1-C2 proficiency',
      'Real-world context',
      'Native speaker patterns',
    ],
  },
  {
    id: 'spaced',
    icon: TrendingUp,
    title: 'Spaced Repetition',
    description: 'Research-backed algorithm optimizes when you review each word',
    gradient: 'from-pink-500 to-orange-500',
    stats: [
      { value: '43%', label: 'Better retention' },
      { value: 'SM-2', label: 'Algorithm' },
      { value: 'Auto', label: 'Scheduling' },
    ],
  },
];

export function FeaturesShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
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
              Why Palabra Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Research-backed methods that make learning effective and enjoyable
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Tab Navigation */}
          <div className="lg:w-1/3 space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r ' + feature.gradient + ' text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100/70 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isActive
                            ? 'text-white/90'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feature Content */}
          <div className="lg:w-2/3">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 sm:p-12 min-h-[400px] flex items-center justify-center"
            >
              {/* 5 Review Methods */}
              {activeFeature === 0 && (
                <div className="w-full">
                  <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    Variety Keeps You Engaged
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features[0].methods?.map((method, i) => (
                      <motion.div
                        key={method.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="text-4xl mb-3">{method.icon}</div>
                        <div className={`text-lg font-semibold ${method.color}`}>
                          {method.name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Powered Examples */}
              {activeFeature === 1 && (
                <div className="w-full">
                  <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    Context That Matches Your Level
                  </h3>
                  <div className="space-y-6">
                    {/* Example Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            "aprender"
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            to learn
                          </div>
                        </div>
                      </div>
                      <div className="pl-15 space-y-3">
                        {features[1].benefits?.map((benefit, i) => (
                          <motion.div
                            key={benefit}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Spaced Repetition */}
              {activeFeature === 2 && (
                <div className="w-full">
                  <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    Science-Backed Learning
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {features[2].stats?.map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                      >
                        <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl"
                  >
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      The SM-2 algorithm automatically schedules reviews at the
                      optimal time to maximize retention and minimize study time.
                    </p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
