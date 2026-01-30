/**
 * Offline Indicator Component
 * Shows network status and pending queue count in header
 */

'use client';

import { CloudOff, Cloud, WifiOff } from 'lucide-react';
import { useOnlineStatusOnly } from '@/lib/hooks/use-online-status';
import { useOfflineQueueCount } from '@/lib/hooks/use-offline-queue';

export function OfflineIndicator() {
  const isOnline = useOnlineStatusOnly();
  const queueCount = useOfflineQueueCount();

  // Don't show anything if online and no queued items
  if (isOnline && queueCount === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Network Status Icon */}
      <div
        className="relative cursor-help"
        title={
          isOnline
            ? queueCount > 0
              ? `Online - ${queueCount} change${queueCount > 1 ? 's' : ''} syncing`
              : 'Online'
            : 'Offline - Changes will sync when online'
        }
      >
        {isOnline ? (
          <Cloud
            className={`h-5 w-5 ${
              queueCount > 0 ? 'text-orange-500' : 'text-green-500'
            }`}
          />
        ) : (
          <CloudOff className="h-5 w-5 text-gray-400" />
        )}

        {/* Queue Count Badge */}
        {queueCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white"
            style={{ lineHeight: '16px' }}
          >
            {queueCount > 99 ? '99+' : queueCount}
          </span>
        )}
      </div>

      {/* Offline Text (mobile only) */}
      {!isOnline && (
        <span className="text-xs text-gray-500 sm:hidden">Offline</span>
      )}
    </div>
  );
}

/**
 * Simple offline badge for smaller contexts
 */
export function OfflineBadge() {
  const isOnline = useOnlineStatusOnly();

  if (isOnline) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  );
}
