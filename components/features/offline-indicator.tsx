/**
 * Offline Indicator Component
 * Shows network status and sync state
 */

'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getSyncService } from '@/lib/services/sync';

/**
 * Offline Indicator Component
 */
export function OfflineIndicator() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted (client-side only)
    setMounted(true);
    
    // Initialize online status
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check sync status
    const checkSyncStatus = async () => {
      try {
        const syncService = getSyncService();
        const state = await syncService.getState();
        
        setIsSyncing(state.isSyncing);
        setLastSyncTime(state.lastSyncTime);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };
    
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  /**
   * Handle manual sync
   */
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const syncService = getSyncService();
      await syncService.sync('incremental');
      const state = await syncService.getState();
      setLastSyncTime(state.lastSyncTime);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Format last sync time
   */
  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  // Don't render anything until client-side hydration is complete
  // This prevents hydration mismatches between server and client
  if (!mounted) {
    return null;
  }
  
  // Don't show if online and synced recently
  if (isOnline && !isSyncing && lastSyncTime && Date.now() - lastSyncTime.getTime() < 300000) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer
          transition-all duration-300
          ${isOnline 
            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
            : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
          }
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Status Icon */}
        {isSyncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-orange-600" />
        )}
        
        {/* Status Text */}
        <span className="text-sm font-medium">
          {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {/* Details Popover */}
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Offline</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Sync Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sync</span>
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Syncing</span>
                  </>
                ) : lastSyncTime ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {formatLastSync(lastSyncTime)}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Not synced</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Sync Button */}
            {isOnline && !isSyncing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSync();
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </button>
            )}
            
            {/* Offline Message */}
            {!isOnline && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  Changes will sync automatically when you're back online.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
