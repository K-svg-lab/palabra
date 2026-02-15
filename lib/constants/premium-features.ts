/**
 * Premium Feature Constants
 * Shared between client and server code
 * Phase 18.3.1: Monetization Implementation
 * 
 * NOTE: This file must have NO server-only imports (e.g., next/headers)
 * so it can be safely imported by client components.
 */

/**
 * Premium feature list
 * Used for UI gating and messaging
 */
export const PREMIUM_FEATURES = {
  deepLearning: {
    name: 'Deep Learning Mode',
    description: 'Elaborative interrogation for deeper memory',
    tier: 'premium' as const,
  },
  personalizedAI: {
    name: 'Personalized AI Examples',
    description: 'On-demand AI-generated examples tailored to you',
    tier: 'premium' as const,
  },
  advancedInterference: {
    name: 'Advanced Interference Detection',
    description: 'Comparative review for confused words',
    tier: 'premium' as const,
  },
  dataExport: {
    name: 'Data Export',
    description: 'Export your vocabulary and progress',
    tier: 'premium' as const,
  },
  offlineMode: {
    name: 'Offline Mode',
    description: 'Access your vocabulary without internet',
    tier: 'premium' as const,
  },
  advancedAnalytics: {
    name: 'Advanced Analytics',
    description: 'Detailed progress insights and statistics',
    tier: 'premium' as const,
  },
  prioritySupport: {
    name: 'Priority Support',
    description: 'Get help faster when you need it',
    tier: 'premium' as const,
  },
} as const;

export type PremiumFeature = keyof typeof PREMIUM_FEATURES;
