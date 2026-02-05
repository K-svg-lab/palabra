/**
 * Settings page
 * User preferences and app configuration
 */

'use client';

import { useState } from 'react';
import { Database, Tag, Bell, User, CloudOff } from 'lucide-react';
import { ImportExportPanel } from '@/components/features/import-export-panel';
import { TagManagement } from '@/components/features/tag-management';
import { NotificationSettings } from '@/components/features/notification-settings';
import { AccountSettings } from '@/components/features/account-settings';
import { OfflineSettings } from '@/components/features/offline-settings';
import { AppHeader } from '@/components/ui/app-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';

/**
 * Settings page component
 * Allows users to configure app preferences and manage data
 * 
 * @returns Settings page
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'tags' | 'data' | 'offline'>('account');
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
      <AppHeader
        icon="⚙️"
        title="Settings"
        subtitle="Manage your preferences and data"
        showProfile={true}
      />

      {/* Tabs - Phase 16.4 Enhanced */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 max-w-7xl mx-auto flex justify-center overflow-x-auto">
          <SegmentedControl
            tabs={[
              { id: 'account', label: 'Account', icon: <User className="h-4 w-4" /> },
              { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
              { id: 'tags', label: 'Tags', icon: <Tag className="h-4 w-4" /> },
              { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
              { id: 'offline', label: 'Offline', icon: <CloudOff className="h-4 w-4" /> },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
          />
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
        
        {activeTab === 'offline' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <OfflineSettings />
          </div>
        )}
      </div>
    </div>
  );
}

