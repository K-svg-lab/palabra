/**
 * Social Proof Component
 * User testimonials, statistics, and trust signals
 * Phase 17 Design: Authentic, credible, visually appealing
 */

'use client';

import { motion } from 'framer-motion';
import { Star, Users, BookOpen, BarChart3, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Rodriguez',
    role: 'Language Student',
    avatar: '👩‍🎓',
    rating: 5,
    text: 'The AI examples are incredible! They adapt to my level perfectly. I\'ve learned 200+ words in just 3 weeks.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Carlos Silva',
    role: 'Business Professional',
    avatar: '👨‍💼',
    rating: 5,
    text: 'Finally, an app that doesn\'t feel like homework. The variety of review methods keeps me engaged every day.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Sophie Chen',
    role: 'University Student',
    avatar: '👩‍💻',
    rating: 5,
    text: 'Maintaining a 14-day streak has never been easier. The progress tracking is so motivating!',
    gradient: 'from-pink-500 to-orange-500',
  },
];

const stats = [
  {
    icon: Users,
    value: '1,000+',
    label: 'Active Learners',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BookOpen,
    value: '50K+',
    label: 'Words Learned',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    value: '95%',
    label: 'Satisfaction Rate',
    gradient: 'from-pink-500 to-orange-500',
  },
];

export function SocialProof() {
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
              Loved by Learners
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands making real progress every day
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Card */}
              <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* Quote Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center mb-6 shadow-md`}>
                  <Quote className="w-6 h-6 text-white" />
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Trusted by learners worldwide
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
