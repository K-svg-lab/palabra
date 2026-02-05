/**
 * Cache Indicator Component
 * 
 * Displays verification status for cached vocabulary translations.
 * Phase 16.2 - Tasks 3 & 4: A/B Testing and Mobile Polish
 * 
 * Features:
 * - Multiple design variants for A/B testing
 * - Mobile-optimized responsive design
 * - Progressive disclosure (hover for details)
 * - Apple-inspired minimal aesthetics
 */

'use client';

import { Check, CheckCircle, CheckCircle2, Star, Users, Shield } from 'lucide-react';
import { useABTest, type ABTestVariant } from '@/lib/hooks/use-ab-test';
import { useState } from 'react';

export interface CacheMetadata {
  verificationCount: number;
  confidenceScore?: number;
  lastVerified?: string;
}

export interface CacheIndicatorProps {
  metadata: CacheMetadata;
  compact?: boolean; // For mobile/small screens
}

/**
 * Cache Indicator with A/B Testing
 * 
 * Automatically selects and displays one of 4 design variants:
 * - Control: Simple checkmark + text
 * - Variant A: Badge style with icon
 * - Variant B: Pill with user count emphasis
 * - Variant C: Shield style with confidence score
 */
export function CacheIndicator({ metadata, compact = false }: CacheIndicatorProps) {
  const { variant, trackEvent } = useABTest({
    testName: 'cache-indicator-design-v1',
    variants: ['control', 'variantA', 'variantB', 'variantC'],
  });

  const [showDetails, setShowDetails] = useState(false);

  const handleHover = () => {
    setShowDetails(true);
    trackEvent('hover', { verificationCount: metadata.verificationCount });
  };

  const handleLeave = () => {
    setShowDetails(false);
  };

  const handleClick = () => {
    trackEvent('click', { verificationCount: metadata.verificationCount });
  };

  // Render based on variant
  switch (variant) {
    case 'variantA':
      return (
        <VariantA
          metadata={metadata}
          compact={compact}
          showDetails={showDetails}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      );
    case 'variantB':
      return (
        <VariantB
          metadata={metadata}
          compact={compact}
          showDetails={showDetails}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      );
    case 'variantC':
      return (
        <VariantC
          metadata={metadata}
          compact={compact}
          showDetails={showDetails}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      );
    case 'control':
    default:
      return (
        <ControlVariant
          metadata={metadata}
          compact={compact}
          showDetails={showDetails}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      );
  }
}

// ============================================================================
// VARIANT IMPLEMENTATIONS
// ============================================================================

interface VariantProps {
  metadata: CacheMetadata;
  compact: boolean;
  showDetails: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

/**
 * CONTROL: Simple checkmark + text (current design)
 * 
 * Mobile: Checkmark + count only
 * Desktop: Checkmark + "Verified translation · N users"
 */
function ControlVariant({ metadata, compact, showDetails, onHover, onLeave, onClick }: VariantProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 transition-all duration-300 cursor-help"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="status"
      aria-label={`Verified translation by ${metadata.verificationCount} users`}
    >
      <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
      
      {compact ? (
        // Mobile: Just count
        <p className="text-xs text-green-800 dark:text-green-200 font-medium">
          {metadata.verificationCount}
        </p>
      ) : (
        // Desktop: Full text
        <p className="text-sm text-green-800 dark:text-green-200 flex-1">
          <span className="font-medium">Verified translation</span>
          {metadata.verificationCount > 1 && (
            <span className="text-green-600 dark:text-green-400 ml-1">
              · {metadata.verificationCount} users
            </span>
          )}
        </p>
      )}

      {/* Progressive disclosure tooltip */}
      {showDetails && !compact && metadata.confidenceScore && (
        <span className="text-xs text-green-600 dark:text-green-400 ml-2 animate-fadeIn">
          {Math.round(metadata.confidenceScore * 100)}% confidence
        </span>
      )}
    </div>
  );
}

/**
 * VARIANT A: Badge style with star icon
 * 
 * Mobile: Star + count badge
 * Desktop: Star + "Verified · N users" badge
 */
function VariantA({ metadata, compact, showDetails, onHover, onLeave, onClick }: VariantProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-sm cursor-help"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="status"
      aria-label={`Verified by ${metadata.verificationCount} users`}
    >
      <Star className="h-3.5 w-3.5 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
      
      {compact ? (
        <span className="text-xs font-semibold text-green-800 dark:text-green-200">
          {metadata.verificationCount}
        </span>
      ) : (
        <span className="text-xs font-medium text-green-800 dark:text-green-200">
          Verified · {metadata.verificationCount}
        </span>
      )}

      {showDetails && !compact && (
        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 animate-fadeIn" />
      )}
    </div>
  );
}

/**
 * VARIANT B: Pill with user count emphasis
 * 
 * Mobile: Users icon + count
 * Desktop: Users icon + "N verified users"
 */
function VariantB({ metadata, compact, showDetails, onHover, onLeave, onClick }: VariantProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-help"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="status"
      aria-label={`Verified by ${metadata.verificationCount} users`}
    >
      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
      
      {compact ? (
        <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
          {metadata.verificationCount}
        </span>
      ) : (
        <span className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-bold">{metadata.verificationCount}</span>
          <span className="text-blue-600 dark:text-blue-400 ml-1">
            {metadata.verificationCount === 1 ? 'verified user' : 'verified users'}
          </span>
        </span>
      )}

      {showDetails && !compact && (
        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-fadeIn" />
      )}
    </div>
  );
}

/**
 * VARIANT C: Shield style with confidence score
 * 
 * Mobile: Shield + score percentage
 * Desktop: Shield + "N users · X% confidence"
 */
function VariantC({ metadata, compact, showDetails, onHover, onLeave, onClick }: VariantProps) {
  const confidencePercent = Math.round((metadata.confidenceScore || 0.8) * 100);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 cursor-help"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      role="status"
      aria-label={`${confidencePercent}% confidence, verified by ${metadata.verificationCount} users`}
    >
      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
      
      {compact ? (
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-purple-800 dark:text-purple-200">
            {confidencePercent}%
          </span>
        </div>
      ) : (
        <div className="text-sm text-purple-800 dark:text-purple-200">
          <span className="font-medium">{metadata.verificationCount} users</span>
          <span className="text-purple-600 dark:text-purple-400 mx-1">·</span>
          <span className="font-semibold">{confidencePercent}%</span>
        </div>
      )}

      {showDetails && !compact && (
        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 animate-fadeIn" />
      )}
    </div>
  );
}

/**
 * Compact version for mobile/small screens
 * 
 * Usage:
 * ```tsx
 * <CacheIndicator metadata={data} compact={isMobile} />
 * ```
 */
export function CacheIndicatorCompact({ metadata }: { metadata: CacheMetadata }) {
  return <CacheIndicator metadata={metadata} compact={true} />;
}
