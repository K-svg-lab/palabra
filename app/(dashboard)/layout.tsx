/**
 * Dashboard layout
 * Provides consistent structure for all dashboard pages with bottom navigation
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/layouts/bottom-nav';
import { SkipLink } from '@/components/shared/skip-link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout component
 * Wraps dashboard pages with bottom navigation
 * 
 * @param props - Component props
 * @returns Layout wrapper
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content link for accessibility */}
      <SkipLink />
      
      {/* Phase 12 Auth Banner */}
      {!loading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <h2 className="text-sm font-bold">Phase 12: Cloud Sync Active!</h2>
                {user ? (
                  <p className="text-xs text-purple-100">
                    Signed in as {user.name || user.email}
                  </p>
                ) : (
                  <p className="text-xs text-purple-100">
                    Sign up to test authentication & multi-device sync
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/signin"
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area with bottom padding for navigation */}
      <main 
        id="main-content" 
        className={`flex-1 pb-[calc(49px+env(safe-area-inset-bottom))] ${!loading ? 'pt-[60px]' : ''}`}
        role="main"
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

