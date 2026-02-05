/**
 * A/B Testing Hook
 * 
 * Manages A/B test variants and tracks user interactions.
 * Phase 16.2 - Task 3: A/B Test Cache Indicators
 * 
 * Features:
 * - Persistent variant assignment (localStorage)
 * - Automatic tracking of variant views
 * - Simple API for component usage
 */

'use client';

import { useState, useEffect } from 'react';

export type ABTestVariant = 'control' | 'variantA' | 'variantB' | 'variantC';

export interface ABTestConfig {
  testName: string;
  variants: ABTestVariant[];
  weights?: number[]; // Distribution weights (default: equal)
}

export interface ABTestResult {
  variant: ABTestVariant;
  isLoading: boolean;
  trackEvent: (eventName: string, data?: any) => void;
}

// Default distribution: equal weights
const DEFAULT_WEIGHTS = [0.25, 0.25, 0.25, 0.25];

/**
 * A/B Testing Hook
 * 
 * Usage:
 * ```tsx
 * const { variant, trackEvent } = useABTest({
 *   testName: 'cache-indicator-design',
 *   variants: ['control', 'variantA', 'variantB', 'variantC'],
 * });
 * ```
 */
export function useABTest(config: ABTestConfig): ABTestResult {
  const [variant, setVariant] = useState<ABTestVariant>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or assign variant
    const assignedVariant = getOrAssignVariant(config);
    setVariant(assignedVariant);
    setIsLoading(false);

    // Track variant view (only once per session)
    const viewedKey = `ab_viewed_${config.testName}_${assignedVariant}`;
    if (!sessionStorage.getItem(viewedKey)) {
      trackVariantView(config.testName, assignedVariant);
      sessionStorage.setItem(viewedKey, 'true');
    }
  }, [config.testName]);

  const trackEvent = (eventName: string, data?: any) => {
    trackABEvent(config.testName, variant, eventName, data);
  };

  return {
    variant,
    isLoading,
    trackEvent,
  };
}

/**
 * Get or assign A/B test variant
 * 
 * Checks localStorage for existing assignment, or assigns new variant
 * based on weighted distribution.
 */
function getOrAssignVariant(config: ABTestConfig): ABTestVariant {
  const storageKey = `ab_variant_${config.testName}`;
  
  // Check for existing assignment
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(storageKey);
    if (stored && config.variants.includes(stored as ABTestVariant)) {
      return stored as ABTestVariant;
    }
  }

  // Assign new variant based on weights
  const weights = config.weights || DEFAULT_WEIGHTS;
  const variant = selectVariant(config.variants, weights);

  // Store assignment
  if (typeof window !== 'undefined') {
    localStorage.setItem(storageKey, variant);
  }

  return variant;
}

/**
 * Select variant based on weighted distribution
 */
function selectVariant(variants: ABTestVariant[], weights: number[]): ABTestVariant {
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < variants.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return variants[i];
    }
  }

  // Fallback to first variant
  return variants[0];
}

/**
 * Track variant view (when user sees the variant)
 */
function trackVariantView(testName: string, variant: ABTestVariant) {
  if (typeof window === 'undefined') return;

  try {
    // Send to analytics API (async, don't block)
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testName,
        variant,
        eventType: 'view',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: detectDeviceType(),
      }),
    }).catch(err => console.error('[AB Test] Failed to track view:', err));
  } catch (error) {
    console.error('[AB Test] Error tracking view:', error);
  }
}

/**
 * Track A/B test event (e.g., click, hover, conversion)
 */
function trackABEvent(
  testName: string,
  variant: ABTestVariant,
  eventName: string,
  data?: any
) {
  if (typeof window === 'undefined') return;

  try {
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testName,
        variant,
        eventType: 'event',
        eventName,
        eventData: data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: detectDeviceType(),
      }),
    }).catch(err => console.error('[AB Test] Failed to track event:', err));
  } catch (error) {
    console.error('[AB Test] Error tracking event:', error);
  }
}

/**
 * Detect device type from user agent and screen size
 */
function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();

  if (width < 768 || ua.includes('mobile')) {
    return 'mobile';
  } else if (width < 1024 || ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Force reset variant assignment (for testing)
 */
export function resetABTestVariant(testName: string) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`ab_variant_${testName}`);
    sessionStorage.removeItem(`ab_viewed_${testName}_control`);
    sessionStorage.removeItem(`ab_viewed_${testName}_variantA`);
    sessionStorage.removeItem(`ab_viewed_${testName}_variantB`);
    sessionStorage.removeItem(`ab_viewed_${testName}_variantC`);
  }
}
