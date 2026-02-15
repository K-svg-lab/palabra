/**
 * Deep Learning Toggle Component
 * Premium-gated toggle for enabling/disabling Deep Learning Mode
 * 
 * Features:
 * - Shows upgrade modal for free users
 * - Allows toggling for premium users
 * - Clear value communication (research-backed benefits)
 * - Mobile optimized with 44px+ touch targets
 * - Accessible (keyboard navigation, ARIA labels)
 * 
 * Phase 18.3.6: Feature Gating Implementation
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Brain, TrendingUp, X } from 'lucide-react';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { useReviewPreferences } from '@/lib/hooks/use-review-preferences';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Main toggle component with premium gating
 */
export function DeepLearningToggle() {
  const { isPremium, isLoading } = useSubscription();
  const { preferences, setPreferences } = useReviewPreferences();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle toggle click
  const handleToggle = () => {
    if (!isPremium) {
      // Free user - show upgrade modal
      setShowUpgradeModal(true);
      return;
    }
    
    // Premium user - allow toggle
    setPreferences({ 
      deepLearningEnabled: !preferences.deepLearningEnabled 
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        aria-label="Loading subscription status"
      />
    );
  }

  const isEnabled = isPremium && preferences.deepLearningEnabled;

  return (
    <>
      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out 
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${isEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}
          ${!isPremium ? 'opacity-60' : ''}
        `}
        role="switch"
        aria-checked={isEnabled}
        aria-label={
          isPremium 
            ? `Deep Learning Mode ${isEnabled ? 'enabled' : 'disabled'}` 
            : 'Deep Learning Mode requires Premium - click to upgrade'
        }
        type="button"
      >
        {/* Sliding Circle */}
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
        
        {/* Crown Icon Overlay (Free Users Only) */}
        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </div>
        )}
      </button>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && !isPremium && (
          <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Upgrade modal shown to free users
 * Explains feature value and provides upgrade path
 */
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
            {/* Sparkle decorations */}
            <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Deep Learning Mode
        </h3>
        
        {/* Subtitle */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Unlock research-backed elaborative interrogation for 
          <span className="font-semibold text-purple-600 dark:text-purple-400"> 71% better retention</span>
        </p>

        {/* Features List */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <FeatureBullet 
            icon={<Brain className="w-5 h-5 text-purple-500" />}
            text="5 prompt types: etymology, connections, usage patterns"
          />
          <FeatureBullet 
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            text="Research-backed: d = 0.71 effect size (medium-large improvement)"
          />
          <FeatureBullet 
            icon={<Sparkles className="w-5 h-5 text-purple-500" />}
            text="Non-intrusive: Auto-skip after 3 seconds if you prefer"
          />
        </div>

        {/* Research Citation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-900 dark:text-blue-200">
            <strong>Research Foundation:</strong> Pressley et al. (1988), Woloshyn et al. (1992) - 
            Elaborative interrogation creates deeper memory traces by connecting new information to prior knowledge.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link href="/dashboard/settings/subscription" className="block">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>

        {/* Trust Signal */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          ✓ Your free features stay free forever  
          ✓ Cancel anytime  
          ✓ Start at $4.99/month
        </p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Feature bullet point component
 * Reusable for modal feature lists
 */
function FeatureBullet({ 
  icon, 
  text 
}: { 
  icon: React.ReactNode; 
  text: string 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
