/**
 * Notification service
 * Handles push notifications, permission requests, and scheduling
 */

import type {
  NotificationPermissionState,
  NotificationPayload,
  NotificationPreferences,
  ScheduledNotification,
} from '@/lib/types/notifications';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/db/settings';
import { getDueForReviewCount } from '@/lib/db/reviews';

/**
 * Checks if the browser supports notifications
 * 
 * @returns True if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Checks if service workers are supported
 * 
 * @returns True if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Gets the current notification permission state
 * 
 * @returns The notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests notification permission from the user
 * 
 * @returns Promise resolving to the permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Registers the service worker
 * 
 * @returns Promise resolving to the service worker registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Sends a notification
 * 
 * @param payload - The notification payload
 * @returns Promise resolving when notification is sent
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const permission = getNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  if (!isServiceWorkerSupported()) {
    // Fallback to basic notification
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag,
      data: payload.data,
    });
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Use any type for options as service worker notification options
    // have more properties than the standard NotificationOptions type
    const options: any = {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag || 'palabra-notification',
      data: payload.data,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };
    
    // Add actions if provided (only supported in service worker notifications)
    if (payload.actions) {
      options.actions = payload.actions;
    }
    
    await registration.showNotification(payload.title, options);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Schedules a notification for later
 * 
 * @param notification - The scheduled notification data
 * @returns Promise resolving when scheduled
 */
export async function scheduleNotification(
  notification: ScheduledNotification
): Promise<void> {
  // Store in localStorage for now
  // In a production app, this would use the Notifications API with service workers
  try {
    const scheduled = getScheduledNotifications();
    scheduled.push(notification);
    localStorage.setItem('scheduled_notifications', JSON.stringify(scheduled));
    
    // Set a timeout to show the notification
    const delay = notification.scheduledTime - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        sendNotification({
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge ? String(notification.badge) : undefined,
          tag: notification.tag,
        });
      }, delay);
    }
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

/**
 * Gets all scheduled notifications
 * 
 * @returns Array of scheduled notifications
 */
export function getScheduledNotifications(): ScheduledNotification[] {
  try {
    const stored = localStorage.getItem('scheduled_notifications');
    if (!stored) return [];
    return JSON.parse(stored) as ScheduledNotification[];
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Cancels a scheduled notification
 * 
 * @param notificationId - The notification ID to cancel
 */
export function cancelScheduledNotification(notificationId: string): void {
  try {
    const scheduled = getScheduledNotifications();
    const filtered = scheduled.filter(n => n.id !== notificationId);
    localStorage.setItem('scheduled_notifications', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error canceling scheduled notification:', error);
  }
}

/**
 * Checks if it's currently quiet hours
 * 
 * @param preferences - The notification preferences
 * @returns True if it's currently quiet hours
 */
export function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const { quietHoursStart, quietHoursEnd } = preferences;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime < quietHoursEnd;
  }
  
  // Handle same-day quiet hours (e.g., 13:00 to 15:00)
  return currentTime >= quietHoursStart && currentTime < quietHoursEnd;
}

/**
 * Checks if notifications should be sent today
 * 
 * @param preferences - The notification preferences
 * @returns True if notifications should be sent today
 */
export function shouldNotifyToday(preferences: NotificationPreferences): boolean {
  if (!preferences.enabled || !preferences.dailyReminder) {
    return false;
  }

  const today = new Date().getDay(); // 0-6 (Sunday-Saturday)

  if (preferences.frequency === 'daily') {
    return true;
  }

  if (preferences.frequency === 'weekdays') {
    return today >= 1 && today <= 5;
  }

  if (preferences.frequency === 'custom' && preferences.customDays) {
    return preferences.customDays.includes(today);
  }

  return false;
}

/**
 * Schedules the daily review reminder
 * 
 * @returns Promise resolving when reminder is scheduled
 */
export async function scheduleDailyReminder(): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!shouldNotifyToday(preferences)) {
      return;
    }

    if (isQuietHours(preferences)) {
      // Schedule for when quiet hours end
      const [hours, minutes] = preferences.quietHoursEnd.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      if (scheduledTime.getTime() <= Date.now()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await scheduleNotification({
        id: `daily-reminder-${scheduledTime.getTime()}`,
        title: 'Palabra',
        body: preferences.reminderMessage,
        scheduledTime: scheduledTime.getTime(),
      });
      return;
    }

    // Schedule for the reminder time
    const [hours, minutes] = preferences.reminderTime.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    if (scheduledTime.getTime() <= Date.now()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const dueCount = await getDueForReviewCount();
    
    await scheduleNotification({
      id: `daily-reminder-${scheduledTime.getTime()}`,
      title: 'Palabra - Review Time! 📚',
      body: dueCount > 0
        ? `You have ${dueCount} word${dueCount === 1 ? '' : 's'} due for review!`
        : preferences.reminderMessage,
      scheduledTime: scheduledTime.getTime(),
      badge: dueCount,
    });
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}

/**
 * Updates the app badge with the number of pending reviews
 * 
 * @returns Promise resolving when badge is updated
 */
export async function updateBadge(): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!preferences.showBadge) {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }
      return;
    }

    const dueCount = await getDueForReviewCount();
    
    if ('setAppBadge' in navigator) {
      if (dueCount > 0) {
        await (navigator as any).setAppBadge(dueCount);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

/**
 * Clears the app badge
 */
export async function clearBadge(): Promise<void> {
  try {
    if ('clearAppBadge' in navigator) {
      await (navigator as any).clearAppBadge();
    }
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

/**
 * Initializes the notification system
 * Registers service worker and sets up initial state
 * 
 * @returns Promise resolving when initialized
 */
export async function initializeNotifications(): Promise<void> {
  try {
    if (!isNotificationSupported() || !isServiceWorkerSupported()) {
      console.warn('Notifications not fully supported');
      return;
    }

    // Register service worker
    await registerServiceWorker();

    // Update badge
    await updateBadge();

    // Schedule daily reminder if preferences allow
    const preferences = await getNotificationPreferences();
    if (preferences.enabled) {
      await scheduleDailyReminder();
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}

