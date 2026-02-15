/**
 * Subscription Guard Middleware
 * Feature gating for premium features
 * Phase 18.3.1: Monetization Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { hasActivePremium } from '@/lib/services/stripe';
import { getAuthUser } from '@/lib/backend/api-utils';

// Re-export constants from shared file (safe for client components)
export { PREMIUM_FEATURES, type PremiumFeature } from '@/lib/constants/premium-features';
import { PREMIUM_FEATURES, type PremiumFeature } from '@/lib/constants/premium-features';

/**
 * Check if user has premium access (subscription or lifetime)
 */
export async function requirePremium(userId: string): Promise<boolean> {
  return await hasActivePremium(userId);
}

/**
 * Check if user can access a specific premium feature
 */
export async function canAccessFeature(
  userId: string,
  feature: PremiumFeature
): Promise<boolean> {
  const featureConfig = PREMIUM_FEATURES[feature];
  
  if (featureConfig.tier === 'premium') {
    return await requirePremium(userId);
  }
  
  return true; // Free features
}

/**
 * API route wrapper that requires premium access
 * Returns 403 with upgrade URL if user doesn't have premium
 */
export function withPremium(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getAuthUser(req);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const hasPremium = await requirePremium(user.id);
      
      if (!hasPremium) {
        return NextResponse.json(
          {
            error: 'Premium subscription required',
            message: 'This feature requires a premium subscription',
            upgradeUrl: '/settings/subscription',
            tier: 'premium',
          },
          { status: 403 }
        );
      }
      
      return await handler(req, user.id);
    } catch (error) {
      console.error('[Subscription Guard] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Client-side hook helper types
 * Used by React components to gate features
 */
export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'lifetime';
  isActive: boolean;
  isPremium: boolean;
  isLifetime: boolean;
  subscriptionEnd?: Date | null;
  canAccessFeature: (feature: PremiumFeature) => boolean;
}

/**
 * Get upgrade message for a specific feature
 */
export function getUpgradeMessage(feature: PremiumFeature): string {
  const featureConfig = PREMIUM_FEATURES[feature];
  return `${featureConfig.name} is a premium feature. Upgrade to unlock ${featureConfig.description.toLowerCase()}.`;
}

/**
 * Check if user is on free tier (helper)
 */
export function isFreeTier(tier: string | null): boolean {
  return !tier || tier === 'free';
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscriptionEnd: Date | null): boolean {
  if (!subscriptionEnd) return true;
  return new Date() > new Date(subscriptionEnd);
}
