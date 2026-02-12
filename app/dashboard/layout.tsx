/**
 * Dashboard layout
 * Provides consistent structure for all dashboard pages with bottom navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layouts/bottom-nav';
import { SkipLink } from '@/components/shared/skip-link';
import { SyncStatusBanner } from '@/components/ui/sync-status-banner';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { useRetentionTracking } from '@/lib/hooks/use-retention-tracking';
import { useDataPreload } from '@/lib/hooks/use-data-preload';

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
  
  // Initialize online status tracking (triggers sync when online)
  useOnlineStatus();

  // Phase 18.1.2: Initialize retention tracking (tracks user activity)
  useRetentionTracking(user?.id);

  // Phase 18: Pre-hydrate vocabulary data after login for immediate offline capability
  // This ensures IndexedDB has data even if user hasn't visited vocabulary page yet
  // TEMPORARILY DISABLED: Causing infinite loading issue, needs investigation
  // useDataPreload(user?.id, { enabled: true, delay: 2000 });

  useEffect(() => {
    // Check authentication status for retention tracking
    let cancelled = false;
    const timeoutMs = 8000;

    async function checkAuth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch('/api/auth/me', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        if (!cancelled) console.log('Not authenticated');
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content link for accessibility */}
      <SkipLink />
      
      {/* Sync status banner */}
      <SyncStatusBanner />
      
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

