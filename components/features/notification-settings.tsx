/**
 * Notification Settings Component
 * Manages notification preferences and permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Moon, Calendar, MessageSquare } from 'lucide-react';
import type { NotificationPreferences } from '@/lib/types/notifications';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/db/settings';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  scheduleDailyReminder,
  updateBadge,
  sendNotification,
} from '@/lib/services/notifications';

interface NotificationSettingsProps {
  onPreferencesChanged?: () => void;
}

/**
 * Notification settings component
 * Allows users to configure notification preferences
 * 
 * @param props - Component props
 * @returns Notification settings UI
 */
export function NotificationSettings({ onPreferencesChanged }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPermission();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = () => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    } else {
      setPermission('denied');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === 'granted' && preferences) {
        await updatePreference({ enabled: true });
        await scheduleDailyReminder();
        await updateBadge();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const updatePreference = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setSaving(true);
      const updated = { ...preferences, ...updates };
      await saveNotificationPreferences(updated);
      setPreferences(updated);
      
      // Re-schedule reminders if settings changed
      if (updates.enabled !== undefined || updates.reminderTime !== undefined) {
        await scheduleDailyReminder();
      }
      
      // Update badge if setting changed
      if (updates.showBadge !== undefined) {
        await updateBadge();
      }
      
      onPreferencesChanged?.();
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestingNotification(true);
      await sendNotification({
        title: 'Palabra - Test Notification',
        body: 'This is a test notification. Your notifications are working! 🎉',
        icon: '/icon-192.png',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setTestingNotification(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const notSupported = !isNotificationSupported();
  const permissionDenied = permission === 'denied';
  const permissionGranted = permission === 'granted';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Notifications & Reminders
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Stay on track with daily reminders and review notifications
        </p>
      </div>

      {/* Not Supported Warning */}
      {notSupported && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-3">
            <BellOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                Notifications Not Supported
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request */}
      {!notSupported && !permissionGranted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-base font-medium text-blue-900 dark:text-blue-200 mb-2">
                Enable Notifications
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                {permissionDenied 
                  ? "You've previously denied notification permissions. Please enable them in your browser settings to receive reminders."
                  : "Allow notifications to receive daily reminders and stay consistent with your vocabulary practice."}
              </p>
              {!permissionDenied && (
                <button
                  onClick={handleRequestPermission}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable Notifications
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings (only show if permission granted) */}
      {permissionGranted && (
        <>
          {/* Master Toggle */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Enable Notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive review reminders
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => updatePreference({ enabled: e.target.checked })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Reminder Settings */}
          {preferences.enabled && (
            <div className="space-y-4">
              {/* Daily Reminder Toggle */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Daily Reminder
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get reminded to review
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.dailyReminder}
                      onChange={(e) => updatePreference({ dailyReminder: e.target.checked })}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {preferences.dailyReminder && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Reminder Time */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock className="h-4 w-4" />
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={preferences.reminderTime}
                        onChange={(e) => updatePreference({ reminderTime: e.target.value })}
                        disabled={saving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="h-4 w-4" />
                        Frequency
                      </label>
                      <select
                        value={preferences.frequency}
                        onChange={(e) => updatePreference({ 
                          frequency: e.target.value as 'daily' | 'weekdays' | 'custom' 
                        })}
                        disabled={saving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="daily">Every day</option>
                        <option value="weekdays">Weekdays only</option>
                        <option value="custom">Custom days</option>
                      </select>
                    </div>

                    {/* Custom Days */}
                    {preferences.frequency === 'custom' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Select Days
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <button
                              key={day}
                              onClick={() => {
                                const days = preferences.customDays || [];
                                const newDays = days.includes(index)
                                  ? days.filter(d => d !== index)
                                  : [...days, index].sort();
                                updatePreference({ customDays: newDays });
                              }}
                              disabled={saving}
                              className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                                preferences.customDays?.includes(index)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quiet Hours */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Quiet Hours
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No notifications during these hours
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.quietHoursEnabled}
                      onChange={(e) => updatePreference({ quietHoursEnabled: e.target.checked })}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {preferences.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) => updatePreference({ quietHoursStart: e.target.value })}
                        disabled={saving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) => updatePreference({ quietHoursEnd: e.target.value })}
                        disabled={saving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Badge Indicator */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                        5
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Show Badge Count
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Display pending reviews on app icon
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showBadge}
                      onChange={(e) => updatePreference({ showBadge: e.target.checked })}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Custom Message */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Reminder Message
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Customize your notification message
                    </p>
                    <textarea
                      value={preferences.reminderMessage}
                      onChange={(e) => updatePreference({ reminderMessage: e.target.value })}
                      disabled={saving}
                      rows={2}
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter your custom reminder message..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {preferences.reminderMessage.length}/100 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Notification */}
              <button
                onClick={handleTestNotification}
                disabled={testingNotification || saving}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingNotification ? 'Sending...' : 'Send Test Notification'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

