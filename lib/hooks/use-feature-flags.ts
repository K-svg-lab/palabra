/**
 * Feature Flags Hook (Phase 18.2.3)
 * 
 * React hook to check if features are enabled for the current user.
 * Used for A/B testing and conditional feature rendering.
 * 
 * @module use-feature-flags
 */

'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_FEATURES, type FeatureFlags } from '@/lib/config/ab-tests';

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get feature flags for current user
 * 
 * Fetches feature flags from server on mount and provides
 * helper function to check if specific features are enabled.
 * 
 * For guest users, returns default features.
 * 
 * @returns Feature flags and helper functions
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    async function loadFlags() {
      try {
        // Check if user is authenticated
        const authResponse = await fetch('/api/auth/me');
        
        if (!authResponse.ok) {
          // Guest user - use default features
          setIsGuest(true);
          setFlags(DEFAULT_FEATURES);
          setLoading(false);
          return;
        }

        const authData = await authResponse.json();
        
        if (!authData.user) {
          // Guest user
          setIsGuest(true);
          setFlags(DEFAULT_FEATURES);
          setLoading(false);
          return;
        }

        // Authenticated user - fetch feature flags
        const flagsResponse = await fetch('/api/user/feature-flags');
        
        if (flagsResponse.ok) {
          const data = await flagsResponse.json();
          setFlags(data.flags || DEFAULT_FEATURES);
        } else {
          // Fallback to defaults if fetch fails
          setFlags(DEFAULT_FEATURES);
        }
      } catch (error) {
        console.error('Failed to load feature flags:', error);
        // Fallback to defaults
        setFlags(DEFAULT_FEATURES);
      } finally {
        setLoading(false);
      }
    }

    loadFlags();
  }, []);

  /**
   * Check if specific feature is enabled
   * 
   * @param feature - Feature name
   * @returns True if enabled
   */
  const hasFeature = (feature: keyof FeatureFlags): boolean => {
    return flags[feature] === true;
  };

  /**
   * Check if multiple features are all enabled
   * 
   * @param features - Feature names
   * @returns True if all enabled
   */
  const hasAllFeatures = (...features: (keyof FeatureFlags)[]): boolean => {
    return features.every(feature => hasFeature(feature));
  };

  /**
   * Check if any of the features are enabled
   * 
   * @param features - Feature names
   * @returns True if any enabled
   */
  const hasAnyFeature = (...features: (keyof FeatureFlags)[]): boolean => {
    return features.some(feature => hasFeature(feature));
  };

  return {
    flags,
    loading,
    isGuest,
    hasFeature,
    hasAllFeatures,
    hasAnyFeature,
  };
}

// ============================================================================
// CONDITIONAL RENDERING HELPERS
// ============================================================================

/**
 * Component wrapper for feature gating
 * 
 * Only renders children if feature is enabled.
 * 
 * @param feature - Feature name
 * @param children - React children
 * @returns Children or null
 */
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature, loading } = useFeatureFlags();

  if (loading) {
    return null; // Or a loading skeleton
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Check if feature is enabled
 * 
 * const { hasFeature } = useFeatureFlags();
 * 
 * if (hasFeature('retrievalVariation')) {
 *   // Show all 5 review methods
 * } else {
 *   // Show traditional method only
 * }
 */

/**
 * Example: Feature gate component
 * 
 * <FeatureGate feature="aiExamples">
 *   <AIGeneratedExamples word={word} />
 * </FeatureGate>
 */

/**
 * Example: Multiple features
 * 
 * const { hasAllFeatures } = useFeatureFlags();
 * 
 * if (hasAllFeatures('aiExamples', 'retrievalVariation')) {
 *   // Both features enabled
 * }
 */
