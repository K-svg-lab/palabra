/**
 * Notification Provider
 * Initializes notification system and manages notification state
 */

'use client';

import { useEffect } from 'react';
import { initializeNotifications, updateBadge } from '@/lib/services/notifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification provider component
 * Sets up notifications on app load
 * 
 * @param props - Component props
 * @returns Provider wrapper
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  useEffect(() => {
    // Initialize notifications when app loads
    const init = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    init();

    // Update badge every 5 minutes
    const badgeInterval = setInterval(() => {
      updateBadge().catch(console.error);
    }, 5 * 60 * 1000);

    // Update badge when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateBadge().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(badgeInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}

