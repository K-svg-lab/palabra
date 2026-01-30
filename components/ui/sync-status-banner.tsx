/**
 * Sync Status Banner Component
 * Shows sync progress when coming back online
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useOfflineQueueStatus } from '@/lib/hooks/use-offline-queue';
import { useOnlineStatusOnly } from '@/lib/hooks/use-online-status';

export function SyncStatusBanner() {
  const isOnline = useOnlineStatusOnly();
  const queueStatus = useOfflineQueueStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Track offline state
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    }

    // Show banner when coming back online with pending items
    if (isOnline && wasOffline && (queueStatus.pending > 0 || queueStatus.syncing > 0)) {
      setShowBanner(true);
      setSyncComplete(false);
      setDismissed(false);
    }

    // Hide banner when sync is complete
    if (isOnline && wasOffline && queueStatus.pending === 0 && queueStatus.syncing === 0) {
      if (showBanner && !syncComplete) {
        setSyncComplete(true);
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
          setSyncComplete(false);
        }, 3000);
      }
    }
  }, [isOnline, queueStatus, wasOffline, showBanner, syncComplete]);

  if (!showBanner || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    setWasOffline(false);
    setSyncComplete(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-2">
      <div className="w-full max-w-md animate-slide-down">
        {syncComplete ? (
          // Success state
          <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 p-3 shadow-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Sync complete
                </p>
                <p className="text-xs text-green-700">
                  All changes synced successfully
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-green-700 hover:text-green-900"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : queueStatus.failed > 0 ? (
          // Error state
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 shadow-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Sync failed
                </p>
                <p className="text-xs text-red-700">
                  {queueStatus.failed} change{queueStatus.failed > 1 ? 's' : ''} couldn't sync
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-red-700 hover:text-red-900"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Syncing state
          <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3 shadow-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Syncing changes...
                </p>
                <p className="text-xs text-blue-700">
                  {queueStatus.pending + queueStatus.syncing} change
                  {queueStatus.pending + queueStatus.syncing > 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-blue-700 hover:text-blue-900"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
