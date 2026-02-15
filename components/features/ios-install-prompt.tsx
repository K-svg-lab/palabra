/**
 * iOS Install Prompt Component
 * 
 * Displays installation instructions for iOS users since iOS Safari
 * doesn't support the beforeinstallprompt event like Android Chrome.
 * 
 * Follows Phase 17 Apple-inspired design with gradient background,
 * smooth animations, and proper safe area handling.
 * 
 * @module components/features/ios-install-prompt
 */

'use client';

import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

/**
 * iOS Install Prompt
 * 
 * Shows a banner at the bottom of the screen for iOS users who haven't
 * installed the PWA yet. Includes step-by-step instructions and respects
 * user dismissal via localStorage.
 */
export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if user is on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already installed (PWA running in standalone mode)
    const installed = window.matchMedia('(display-mode: standalone)').matches 
                      || (navigator as any).standalone === true; // iOS-specific property
    setIsInstalled(installed);
    
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('ios-install-dismissed');
    
    // Show prompt only if:
    // 1. User is on iOS
    // 2. App is NOT installed
    // 3. User hasn't dismissed it before
    if (iOS && !installed && !dismissed) {
      // Delay showing prompt slightly for better UX
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Handle user dismissing the prompt
   * Saves dismissal to localStorage to prevent showing again
   */
  const handleDismiss = () => {
    localStorage.setItem('ios-install-dismissed', 'true');
    setShow(false);
  };

  // Don't render if conditions aren't met
  if (!show || !isIOS || isInstalled) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-xl z-50 animate-slideIn safe-bottom"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Dismiss Button - Phase 17: 44px touch target, vertically centered */}
      <button
        onClick={handleDismiss}
        className="absolute top-1/2 -translate-y-1/2 right-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-150"
        aria-label="Dismiss install prompt"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      
      {/* Content - Phase 17: Equal vertical padding for balance */}
      <div className="py-4 px-4 pr-14">
        <p 
          id="install-prompt-title"
          className="font-semibold text-base text-gray-900 dark:text-white mb-2"
        >
          Install Palabra
        </p>
        
        <div 
          id="install-prompt-description"
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          <p className="flex items-center">
            Tap <Share className="w-3.5 h-3.5 mx-1 text-accent" aria-hidden="true" /> then "Add to Home Screen"
          </p>
        </div>
      </div>
    </div>
  );
}
