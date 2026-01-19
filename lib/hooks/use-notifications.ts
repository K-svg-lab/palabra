/**
 * Notifications hook
 * Provides notification-related utilities and state
 */

import { useState, useEffect, useCallback } from 'react';
import {
  updateBadge,
  clearBadge,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  scheduleDailyReminder,
} from '@/lib/services/notifications';
import type { NotificationPermissionState } from '@/lib/types/notifications';

/**
 * Hook for managing notifications
 * 
 * @returns Notification utilities and state
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const refreshBadge = useCallback(async () => {
    await updateBadge();
  }, []);

  const removeBadge = useCallback(async () => {
    await clearBadge();
  }, []);

  const scheduleReminder = useCallback(async () => {
    await scheduleDailyReminder();
  }, []);

  return {
    permission,
    isSupported,
    requestPermission,
    refreshBadge,
    removeBadge,
    scheduleReminder,
  };
}

