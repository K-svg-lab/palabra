/**
 * Dashboard layout
 * Provides consistent structure for all dashboard pages with bottom navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/layouts/bottom-nav';
import { SkipLink } from '@/components/shared/skip-link';
import { SyncStatusBanner } from '@/components/ui/sync-status-banner';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';

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
  const pathname = usePathname();
  
  // Initialize online status tracking (triggers sync when online)
  useOnlineStatus();

  // Pages that have user icon in their header (don't show floating indicator)
  const pagesWithHeaderUser = ['/', '/vocabulary', '/progress'];
  const hideFloatingUser = pagesWithHeaderUser.includes(pathname);

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content link for accessibility */}
      <SkipLink />
      
      {/* Sync status banner */}
      <SyncStatusBanner />
      
      {/* Subtle User Indicator - Bottom Right Corner (above nav) */}
      {!loading && !hideFloatingUser && (
        <Link
          href={user ? "/settings" : "/signin"}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
          title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync across devices'}
        >
          {user ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block pr-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Signed in</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline pr-1">Sign In</span>
            </>
          )}
        </Link>
      )}
      
      {/* Main content area with bottom padding for navigation */}
      <main 
        id="main-content" 
        className="flex-1 pb-[calc(49px+env(safe-area-inset-bottom))]"
        role="main"
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

