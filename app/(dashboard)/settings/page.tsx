/**
 * Settings page
 * User preferences and app configuration
 */

'use client';

import { useState } from 'react';
import { Database, Tag, Bell, User } from 'lucide-react';
import { ImportExportPanel } from '@/components/features/import-export-panel';
import { TagManagement } from '@/components/features/tag-management';
import { NotificationSettings } from '@/components/features/notification-settings';
import { AccountSettings } from '@/components/features/account-settings';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';

/**
 * Settings page component
 * Allows users to configure app preferences and manage data
 * 
 * @returns Settings page
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'tags' | 'data'>('account');
  const { refetch } = useVocabulary();
  
  const handleDataChanged = () => {
    refetch();
  };
  
  const handleTagsChanged = () => {
    refetch();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your preferences and data
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'account'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="font-medium">Account</span>
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="font-medium">Notifications</span>
            </button>
            
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'tags'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Tag className="h-4 w-4" />
              <span className="font-medium">Tags</span>
            </button>
            
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'data'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Database className="h-4 w-4" />
              <span className="font-medium">Import/Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <AccountSettings onAuthChanged={() => refetch()} />
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <NotificationSettings onPreferencesChanged={() => refetch()} />
          </div>
        )}
        
        {activeTab === 'tags' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <TagManagement onTagsChanged={handleTagsChanged} />
          </div>
        )}
        
        {activeTab === 'data' && (
          <ImportExportPanel onDataChanged={handleDataChanged} />
        )}
      </div>
    </div>
  );
}

