# Bug Fix: Stats Auto-Refresh for Cross-Device Sync
**Date**: January 22, 2026  
**Status**: ✅ RESOLVED

## Problem Summary

**Issue**: After completing reviews on a mobile device, the stats (cards reviewed, cards due, accuracy) were correctly saved to the server database but did not automatically update on desktop devices. The desktop UI required a hard refresh to display the updated stats.

**Critical Observation**: New vocabulary words were syncing and auto-updating correctly, but stats were not.

## Root Cause Analysis

The bug had **two interconnected root causes**:

### 1. Missing React Query Hook for Stats
- **Problem**: The `useTodayStats()` React Query hook had been removed from the codebase
- **Impact**: The homepage was using manual `useState` management instead of React Query
- **Why This Breaks Auto-Refresh**: 
  - React Query automatically refetches data when the cache is invalidated
  - Manual `useState` has no mechanism to detect when IndexedDB data changes from sync
  - Vocabulary worked because it still had React Query integration intact

### 2. Missing Timestamp Tracking
- **Problem**: The `updatedAt` field was removed from `DailyStats` interface and Prisma schema
- **Impact**: The sync logic couldn't determine which stats were actually modified
- **Why This Causes Stale Data**:
  - Without timestamps, sync uploaded ALL of today's stats on every sync
  - Desktop with 0 cards reviewed would overwrite mobile's fresh stats (5 cards reviewed)
  - Last-write-wins strategy without timestamps causes data corruption

## Solution Implemented

### 1. Restored React Query Integration
**Files Modified**:
- `lib/hooks/use-vocabulary.ts` - Re-added `useTodayStats()` hook with 30-second auto-refetch
- `app/(dashboard)/page.tsx` - Updated to use `useTodayStats()` instead of manual state

**Key Changes**:
```typescript
// NEW: React Query hook with automatic refetch
export function useTodayStats() {
  return useQuery({
    queryKey: ['stats', 'today'],
    queryFn: async () => {
      const [storedStats, actualNewWords, dueCount] = await Promise.all([
        getTodayStats(),
        getActualNewWordsAddedToday(),
        getDueForReviewCount(),
      ]);
      
      return {
        stats: { ...storedStats, newWordsAdded: actualNewWords },
        dueCount,
      };
    },
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
}
```

### 2. Restored Timestamp Tracking
**Files Modified**:
- `lib/types/vocabulary.ts` - Added `updatedAt?: number` to `DailyStats` interface
- `lib/db/stats.ts` - Updated `saveStats()` to automatically set `updatedAt` timestamp
- `lib/backend/prisma/schema.prisma` - Added `updatedAt DateTime` field to `DailyStats` model
- `lib/services/sync.ts` - Fixed stats collection logic to check timestamps
- `app/api/sync/stats/route.ts` - Updated to preserve and send `updatedAt` timestamps

**Key Changes**:
```typescript
// Client-side: Always set timestamp when saving locally
export async function saveStats(stats: DailyStats, preserveTimestamp = false): Promise<DailyStats> {
  const statsWithTimestamp = {
    ...stats,
    updatedAt: preserveTimestamp && stats.updatedAt ? stats.updatedAt : Date.now(),
  };
  // ... save to IndexedDB
}

// Sync logic: Only upload stats modified since last sync
if (!lastSyncTime) {
  shouldInclude = true; // First sync
} else if (stat.updatedAt) {
  shouldInclude = stat.updatedAt > lastSyncTime.getTime(); // Modified since last sync
} else {
  shouldInclude = stat.date === todayDateStr; // Legacy fallback
}
```

### 3. Restored Cache Invalidation
**Files Modified**:
- `lib/services/sync.ts` - Updated to invalidate `['stats']` query key in addition to vocabulary

**Key Change**:
```typescript
// Invalidate both vocabulary AND stats query caches
await this.queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
await this.queryClient.invalidateQueries({ queryKey: ['vocabulary', 'stats'] });
await this.queryClient.invalidateQueries({ queryKey: ['stats'] }); // NEW
```

### 4. Browser Compatibility Fix
**Files Modified**:
- `lib/utils/uuid.ts` - Re-created UUID utility with browser fallback
- Multiple files - Replaced `crypto.randomUUID()` with `generateUUID()`

**Reason**: `crypto.randomUUID()` is not available in older mobile browsers (Safari < 15.4)

## Technical Details

### Database Schema Update
```prisma
model DailyStats {
  // ... existing fields ...
  updatedAt DateTime @default(now()) @updatedAt  // NEW FIELD
}
```

### React Query Flow
1. Mobile completes review → Stats saved to local IndexedDB with `updatedAt = Date.now()`
2. Mobile sync uploads stats with timestamp → Server saves with preserved timestamp
3. Desktop sync downloads new stats → Saves to IndexedDB with `preserveTimestamp = true`
4. Sync service invalidates React Query cache → `useTodayStats()` automatically refetches
5. Desktop UI updates within 30 seconds without manual refresh

## Files Modified

### Core Logic (10 files):
1. `lib/types/vocabulary.ts` - Added `updatedAt` to DailyStats interface
2. `lib/db/stats.ts` - Updated saveStats() with timestamp tracking
3. `lib/hooks/use-vocabulary.ts` - Re-added useTodayStats() hook
4. `lib/services/sync.ts` - Fixed timestamp-based sync logic + cache invalidation
5. `lib/utils/uuid.ts` - Created UUID utility with browser fallback
6. `app/(dashboard)/page.tsx` - Updated to use React Query hook
7. `app/(dashboard)/review/page.tsx` - Updated to use generateUUID()
8. `app/api/sync/stats/route.ts` - Updated to preserve timestamps
9. `lib/backend/prisma/schema.prisma` - Added updatedAt field to DailyStats
10. `lib/utils/spaced-repetition.ts` - Updated to use generateUUID()

## Verification

### Test Procedure:
1. Desktop browser: Sign in and view stats
2. Mobile browser: Sign in (same account) and complete 5 reviews
3. Desktop browser: Wait 30-60 seconds WITHOUT refreshing
4. **Expected**: Stats auto-update (cards reviewed +5, cards due -5, accuracy updates)
5. **Result**: ✅ Stats auto-updated successfully

### Evidence:
- User confirmed: "This has fixed the bug."
- No hard refresh required
- Stats update automatically within 30-60 seconds
- Vocabulary sync still working (confirmed throughout testing)

## Deployment Notes

### Build Errors Fixed:
1. **Error 1**: Missing `updatedAt` field in Prisma schema
   - **Fix**: Added field to schema and regenerated Prisma Client
   
2. **Error 2**: TypeScript error - `lastSyncTime` possibly null
   - **Fix**: Added null check in debug code: `stat.updatedAt && lastSyncTime ? ... : null`

### Final Deployment:
- **Commits**: 
  - `0eeca88` - Fix stats auto-refresh: restore React Query + timestamp tracking
  - `0e0cca3` - Fix: Add updatedAt field to DailyStats schema
  - `35b053d` - Fix TypeScript error: Handle null lastSyncTime
  - `9579064` - Final deployment commit
- **Platform**: Vercel (automatic deployment via GitHub)
- **Build Status**: ✅ SUCCESS
- **Production URL**: https://palabra.vercel.app

## Prevention Strategy

### Why This Happened:
Critical fixes from a previous session were inadvertently reverted, removing:
- The React Query hook for stats
- Timestamp tracking for modification detection
- Proper cache invalidation

### Future Prevention:
1. **Document Critical Architecture**: React Query hooks are ESSENTIAL for cross-device sync
2. **Test Cross-Device Sync**: Always test stats updates without hard refresh
3. **Preserve Timestamps**: Never remove `updatedAt` fields - they prevent stale data overwrites
4. **Code Review**: Verify React Query integration remains intact for real-time features

## Related Documentation

- `BUG_FIX_2026_01_21_RECALL_PROGRESS.md` - Previous sync issues (deletion persistence)
- `PHASE12_DEPLOYMENT.md` - Cross-device sync architecture
- `BUG_FIX_2026_01_22_SYNC_COMPLETE.md` - Initial fix documentation (with debug logs)

## Summary

**The Fix**: Restored React Query + timestamp tracking that had been accidentally removed.

**Why It Works**:
- React Query automatically refetches when cache is invalidated after sync
- Timestamps prevent stale data from overwriting fresh data
- 30-second auto-refetch ensures UI stays up-to-date

**Result**: Stats now auto-update across devices within 30-60 seconds, matching the behavior of vocabulary sync. No hard refresh required. ✅
