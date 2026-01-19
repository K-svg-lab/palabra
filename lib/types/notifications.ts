/**
 * Notification types and interfaces
 * Defines the structure for push notifications and user preferences
 */

/**
 * Notification preference settings
 */
export interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format (24-hour)
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0-6 (Sunday-Saturday)
  showBadge: boolean;
  reminderMessage: string;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dailyReminder: true,
  reminderTime: '09:00',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  frequency: 'daily',
  customDays: [1, 2, 3, 4, 5], // Monday-Friday
  showBadge: true,
  reminderMessage: '📚 Time to review your Spanish vocabulary!',
};

/**
 * Notification permission state
 */
export type NotificationPermissionState = 
  | 'default'
  | 'granted'
  | 'denied';

/**
 * Scheduled notification data
 */
export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number; // timestamp
  badge?: number;
  icon?: string;
  tag?: string;
}

/**
 * Notification action types
 */
export type NotificationActionType = 
  | 'REVIEW_NOW'
  | 'REMIND_LATER'
  | 'DISMISS';

/**
 * Notification payload for service worker
 */
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    dueCount?: number;
  };
  actions?: Array<{
    action: NotificationActionType;
    title: string;
  }>;
}

