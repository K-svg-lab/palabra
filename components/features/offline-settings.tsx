/**
 * Offline Settings Component
 * Manage offline mode configuration and queue
 */

'use client';

import { useState, useEffect } from 'react';
import { CloudOff, RefreshCw, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useOnlineStatusOnly } from '@/lib/hooks/use-online-status';
import { useOfflineQueueStatus, useOfflineQueueItems } from '@/lib/hooks/use-offline-queue';
import { getOfflineQueueService } from '@/lib/services/offline-queue';
import { getOfflineCacheService } from '@/lib/services/offline-cache';
import { getSyncService } from '@/lib/services/sync';

export function OfflineSettings() {
  const isOnline = useOnlineStatusOnly();
  const queueStatus = useOfflineQueueStatus();
  const { items: queueItems, loading: queueLoading } = useOfflineQueueItems();
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Load cache stats
  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const cacheService = getOfflineCacheService();
      const stats = await cacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      const cacheService = getOfflineCacheService();
      await cacheService.refreshCache();
      await loadCacheStats();
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      alert('Failed to refresh cache. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline. Please check your connection.');
      return;
    }

    setSyncing(true);
    try {
      const syncService = getSyncService();
      await syncService.sync('incremental');
      await loadCacheStats();
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to clear the offline queue? Pending changes will be lost.')) {
      return;
    }

    setClearing(true);
    try {
      const queueService = getOfflineQueueService();
      await queueService.clearAll();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      alert('Failed to clear queue. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const queueService = getOfflineQueueService();
      await queueService.retryAllFailed();
    } catch (error) {
      console.error('Failed to retry:', error);
      alert('Failed to retry operations. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const queueService = getOfflineQueueService();
      await queueService.deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'add_vocabulary':
        return 'Add Word';
      case 'update_vocabulary':
        return 'Update Word';
      case 'delete_vocabulary':
        return 'Delete Word';
      case 'submit_review':
        return 'Submit Review';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Offline Mode</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage offline functionality and sync queue
        </p>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border-2 ${
        isOnline 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Online</p>
                <p className="text-sm text-green-700 dark:text-green-300">Connected to the internet</p>
              </div>
            </>
          ) : (
            <>
              <CloudOff className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Offline</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Changes will sync when back online</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cache Stats */}
      {cacheStats && (
        <div className="space-y-3">
          <h3 className="font-medium">Vocabulary Cache</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Words</p>
              <p className="text-2xl font-semibold">{cacheStats.totalVocabulary}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Cached Offline</p>
              <p className="text-2xl font-semibold">{cacheStats.cachedVocabulary}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Due for Review</p>
              <p className="text-2xl font-semibold">{cacheStats.dueForReview}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Cache Size</p>
              <p className="text-2xl font-semibold">{cacheStats.cacheSize}</p>
            </div>
          </div>
          <button
            onClick={handleRefreshCache}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Cache'}
          </button>
        </div>
      )}

      {/* Queue Status */}
      <div className="space-y-3">
        <h3 className="font-medium">Sync Queue</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">Pending</p>
            <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">{queueStatus.pending}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Syncing</p>
            <p className="text-xl font-semibold">{queueStatus.syncing}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">Failed</p>
            <p className="text-xl font-semibold text-red-900 dark:text-red-100">{queueStatus.failed}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300">Completed</p>
            <p className="text-xl font-semibold text-green-900 dark:text-green-100">{queueStatus.completed}</p>
          </div>
        </div>

        {/* Queue Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSyncNow}
            disabled={!isOnline || syncing || queueStatus.pending === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          {queueStatus.failed > 0 && (
            <button
              onClick={handleRetryFailed}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Retry Failed
            </button>
          )}
          {queueStatus.total > 0 && (
            <button
              onClick={handleClearQueue}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Queue Items */}
      {queueItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Queued Operations</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{getOperationTypeLabel(item.type)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      {item.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.error}</p>
                      )}
                    </div>
                  </div>
                  {item.status === 'failed' && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">About Offline Mode</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Continue learning even without internet</li>
              <li>Review vocabulary and record progress</li>
              <li>Add new words (manual entry only)</li>
              <li>Changes sync automatically when online</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
