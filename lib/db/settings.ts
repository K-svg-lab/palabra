/**
 * Settings database operations
 * Manages user preferences and app settings
 */

import { getDB } from './schema';
import type { NotificationPreferences } from '@/lib/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/types/notifications';

const SETTINGS_KEYS = {
  NOTIFICATIONS: 'notification_preferences',
} as const;

/**
 * Gets notification preferences from the database
 * Returns default preferences if none exist
 * 
 * @returns Promise resolving to notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const db = await getDB();
    const setting = await db.get('settings', SETTINGS_KEYS.NOTIFICATIONS);
    
    if (!setting) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
    
    return setting.value as NotificationPreferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Saves notification preferences to the database
 * 
 * @param preferences - The notification preferences to save
 * @returns Promise resolving when saved
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', {
      key: SETTINGS_KEYS.NOTIFICATIONS,
      value: preferences,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
}

/**
 * Updates specific notification preference fields
 * 
 * @param updates - Partial notification preferences to update
 * @returns Promise resolving to updated preferences
 */
export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const currentPrefs = await getNotificationPreferences();
    const updatedPrefs = { ...currentPrefs, ...updates };
    await saveNotificationPreferences(updatedPrefs);
    return updatedPrefs;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Resets notification preferences to defaults
 * 
 * @returns Promise resolving when reset
 */
export async function resetNotificationPreferences(): Promise<void> {
  try {
    await saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    throw error;
  }
}

