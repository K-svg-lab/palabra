'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, LayoutDashboard, Sparkles } from 'lucide-react';

/**
 * Smart Landing Page Header
 * 
 * Displays context-aware navigation:
 * - Authenticated users: Show "Go to Dashboard" button
 * - Unauthenticated users: Show "Sign In" button
 * 
 * Design: Apple-inspired with glass morphism and smooth animations
 */
export function LandingHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        // Only parse JSON if response is OK
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(!!data.user);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Silent fail - user is not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Palabra
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
            {isLoading ? (
              // Loading state
              <div className="w-24 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : isAuthenticated ? (
              // Authenticated: Show "Go to Dashboard"
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">App</span>
                </motion.button>
              </Link>
            ) : (
              // Unauthenticated: Show "Sign In"
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white font-medium backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </motion.button>
              </Link>
            )}
          </nav>
      </div>
    </motion.header>
  );
}
