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
      className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-4 shadow-xl z-50 animate-slideIn safe-bottom"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      {/* Dismiss Button - Phase 17: 44px touch target */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-2 hover:bg-white/20 rounded-full transition-all duration-150"
        aria-label="Dismiss install prompt"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Content */}
      <div className="pr-12">
        <p 
          id="install-prompt-title"
          className="font-semibold text-lg mb-2"
        >
          Install Palabra
        </p>
        
        <div 
          id="install-prompt-description"
          className="text-sm space-y-2 opacity-90"
        >
          <p>For the best experience, install this app:</p>
          
          {/* Installation Steps */}
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0">Tap the</span>
              <Share className="w-4 h-4 inline flex-shrink-0" aria-hidden="true" />
              <span className="flex-shrink-0">Share button</span>
            </li>
            <li>Scroll and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
