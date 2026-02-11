/**
 * Feature Gate Component
 * Shows upgrade prompts when users try to access premium features
 * Phase 18.3.1: Monetization Implementation
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { useFeatureAccess } from '@/lib/hooks/use-subscription';
import type { PremiumFeature } from '@/lib/middleware/subscription-guard';
import { PREMIUM_FEATURES } from '@/lib/middleware/subscription-guard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeatureGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

/**
 * Feature Gate
 * Conditionally renders children based on feature access
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
}: FeatureGateProps) {
  const { hasAccess, upgrade } = useFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const featureConfig = PREMIUM_FEATURES[feature];

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-8 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-2">{featureConfig.name}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {featureConfig.description}
      </p>

      {/* Upgrade Button */}
      <Link href="/settings/subscription">
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Crown className="w-5 h-5 mr-2" />
          Upgrade to Premium
        </Button>
      </Link>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="w-8 h-8 text-purple-500" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-20">
        <Sparkles className="w-6 h-6 text-pink-500" />
      </div>
    </motion.div>
  );
}

/**
 * Inline Feature Gate (smaller, inline prompt)
 */
export function InlineFeatureGate({
  feature,
  children,
}: {
  feature: PremiumFeature;
  children: ReactNode;
}) {
  const { hasAccess } = useFeatureAccess(feature);
  const featureConfig = PREMIUM_FEATURES[feature];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <Link href="/settings/subscription">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur"
          >
            <Lock className="w-4 h-4 mr-2" />
            Unlock {featureConfig.name}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Feature Badge
 * Shows a premium badge next to features
 */
export function PremiumBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium ${sizeClasses[size]}`}
    >
      <Crown className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      PRO
    </span>
  );
}
