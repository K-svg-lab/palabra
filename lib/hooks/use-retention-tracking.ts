/**
 * Retention Tracking Hook (Phase 18.1.2)
 * 
 * Automatically tracks user activity and updates retention milestones.
 * Runs periodically in the background (every 5 minutes).
 * 
 * Features:
 * - Tracks user activity timestamps
 * - Updates retention milestones (Day 1, 7, 30, 90)
 * - Initializes UserCohort on first use
 * - Lightweight and non-blocking
 * 
 * Usage:
 * ```tsx
 * // In app layout or dashboard
 * useRetentionTracking();
 * ```
 * 
 * @see lib/services/retention-analytics.ts
 */

'use client';

import { useEffect, useRef } from 'react';

const TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TRACKING_KEY = 'palabra_last_activity_tracked';

/**
 * Track user activity for retention analytics
 * Automatically pings server every 5 minutes to update retention milestones
 */
export function useRetentionTracking(userId?: string) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track if user is authenticated
    if (!userId) {
      return;
    }

    // Track activity immediately
    trackActivity(userId);

    // Set up periodic tracking
    intervalRef.current = setInterval(() => {
      trackActivity(userId);
    }, TRACKING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
}

/**
 * Track a single activity event
 * Called when user performs significant actions (reviews, adds words)
 */
export async function trackActivityEvent(
  action: 'review' | 'word_added' | 'session_started' | 'session_completed'
): Promise<void> {
  try {
    // Get user from session
    const response = await fetch('/api/auth/me');
    if (!response.ok) return;

    const data = await response.json();
    if (!data.user) return;

    const userId = data.user.id;

    // Send activity event to server
    await fetch('/api/analytics/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action,
        timestamp: new Date().toISOString(),
      }),
    });

    // Update last tracked timestamp
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRACKING_KEY, Date.now().toString());
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('[Retention] Activity tracking error:', error);
  }
}

/**
 * Internal: Track activity to server
 */
async function trackActivity(userId: string): Promise<void> {
  try {
    // Check if we've tracked recently (avoid duplicate requests)
    const lastTracked = getLastTrackedTime();
    const now = Date.now();

    if (lastTracked && now - lastTracked < TRACKING_INTERVAL) {
      return; // Already tracked recently
    }

    // Send activity ping to server
    const response = await fetch('/api/analytics/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'heartbeat',
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      // Update last tracked timestamp
      if (typeof window !== 'undefined') {
        localStorage.setItem(TRACKING_KEY, now.toString());
      }
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('[Retention] Activity tracking error:', error);
  }
}

/**
 * Get the last time activity was tracked
 */
function getLastTrackedTime(): number | null {
  if (typeof window === 'undefined') return null;

  const lastTracked = localStorage.getItem(TRACKING_KEY);
  return lastTracked ? parseInt(lastTracked, 10) : null;
}

/**
 * Reset tracking (useful for testing)
 */
export function resetRetentionTracking(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TRACKING_KEY);
}
