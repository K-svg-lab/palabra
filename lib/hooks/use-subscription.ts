/**
 * Subscription Hook
 * Client-side hook for accessing subscription status and feature gating
 * Phase 18.3.1: Monetization Implementation
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { PremiumFeature } from '@/lib/middleware/subscription-guard';

interface SubscriptionData {
  tier: 'free' | 'premium' | 'lifetime';
  status: string | null;
  isActive: boolean;
  isPremium: boolean;
  isLifetime: boolean;
  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;
  lifetimePaymentDate?: Date | null;
  lifetimeAmount?: number | null;
  canManageBilling: boolean;
  features: Record<string, boolean>;
}

/**
 * Fetch user subscription data
 */
async function fetchSubscription(): Promise<SubscriptionData> {
  const response = await fetch('/api/user/subscription', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscription');
  }

  return response.json();
}

/**
 * Create checkout session
 */
async function createCheckoutSession(
  tier: 'premium' | 'lifetime',
  interval?: 'month' | 'year'
): Promise<{ url: string }> {
  const response = await fetch('/api/subscription/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tier, interval }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create customer portal session
 */
async function createPortalSession(): Promise<{ url: string }> {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Main subscription hook
 */
export function useSubscription() {
  const queryClient = useQueryClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch subscription data
  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: ({
      tier,
      interval,
    }: {
      tier: 'premium' | 'lifetime';
      interval?: 'month' | 'year';
    }) => createCheckoutSession(tier, interval),
    onSuccess: (data) => {
      setIsRedirecting(true);
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('[Subscription] Upgrade failed:', error);
      setIsRedirecting(false);
    },
  });

  // Portal mutation
  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => {
      setIsRedirecting(true);
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('[Subscription] Portal failed:', error);
      setIsRedirecting(false);
    },
  });

  /**
   * Check if user can access a feature
   */
  const canAccessFeature = (feature: PremiumFeature): boolean => {
    if (!subscription) return false;
    return subscription.features[feature] ?? false;
  };

  /**
   * Upgrade to premium (monthly or yearly)
   */
  const upgradeToPremium = (interval: 'month' | 'year' = 'month') => {
    upgradeMutation.mutate({ tier: 'premium', interval });
  };

  /**
   * Upgrade to lifetime
   */
  const upgradeToLifetime = () => {
    upgradeMutation.mutate({ tier: 'lifetime' });
  };

  /**
   * Open customer portal for billing management
   */
  const manageBilling = () => {
    portalMutation.mutate();
  };

  /**
   * Refresh subscription data
   */
  const refresh = () => {
    return refetch();
  };

  return {
    // Data
    subscription,
    isLoading: isLoading || isRedirecting,
    error,
    
    // Status helpers
    isPremium: subscription?.isPremium ?? false,
    isLifetime: subscription?.isLifetime ?? false,
    isFree: subscription?.tier === 'free',
    tier: subscription?.tier ?? 'free',
    
    // Feature access
    canAccessFeature,
    features: subscription?.features ?? {},
    
    // Actions
    upgradeToPremium,
    upgradeToLifetime,
    manageBilling,
    refresh,
    
    // Loading states
    isUpgrading: upgradeMutation.isPending || isRedirecting,
    isManaging: portalMutation.isPending || isRedirecting,
  };
}

/**
 * Hook specifically for feature gating
 * Returns whether user can access a feature and an upgrade function
 */
export function useFeatureAccess(feature: PremiumFeature) {
  const { canAccessFeature, upgradeToPremium, isPremium } = useSubscription();
  
  return {
    hasAccess: canAccessFeature(feature),
    isPremium,
    upgrade: upgradeToPremium,
  };
}

/**
 * Hook for checking multiple features at once
 */
export function useFeatures(features: PremiumFeature[]) {
  const { canAccessFeature, subscription } = useSubscription();
  
  const access: Record<string, boolean> = {};
  
  for (const feature of features) {
    access[feature] = canAccessFeature(feature);
  }
  
  return {
    access,
    hasAll: features.every((f) => canAccessFeature(f)),
    hasAny: features.some((f) => canAccessFeature(f)),
    isPremium: subscription?.isPremium ?? false,
  };
}
