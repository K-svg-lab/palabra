/**
 * PWA Install Prompt Component
 * Beautiful floating install prompt for Progressive Web App
 * Phase 17 Design: Gradients, smooth animations, Apple-quality polish
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a short delay (let user see the page first)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      setShowPrompt(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* Content */}
            <div className="p-6">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Install Palabra
              </h3>

              {/* Subtitle */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Get the full app experience
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Offline access to your vocabulary</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Native app experience</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Fast and reliable</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>No app store required</span>
                </li>
              </ul>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInstalling ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.div>
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Install Now
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Not Now
                </motion.button>
              </div>

              {/* Online indicator */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Decorative gradient orb */}
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
