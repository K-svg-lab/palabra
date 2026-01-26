# Bug Fix: Empty Stats Overwriting Server Data After Browser Clear

**Date**: January 26, 2026  
**Status**: ✅ RESOLVED  
**Severity**: Critical (Data Loss)  
**Commit**: `a151086`

---

## Problem Statement

Users reported that dashboard statistics (cards reviewed, accuracy) were reset to 0 after clearing browser history on their mobile device, and this reset propagated to all other devices via sync.

### User Report (January 24, 2026)

> "I have just completed reviewing 160 cards today on my mobile app. These cards are not recorded on my desktop app or the website. I have just done a hard refresh on my desktop browser and now the dashboard data have reset back to 0 except for words added which is correct."

### Observed Behavior

1. User completes reviews on mobile (e.g., 5 cards, 80% accuracy)
2. Stats briefly appear on mobile dashboard
3. User clears browser history → mobile data resets to 0
4. After sync, desktop also shows 0 cards reviewed, 0% accuracy
5. **Result**: Complete data loss across all devices

---

## Root Cause Analysis

### The Bug Flow

```
1. User clears browser history
   ↓
2. IndexedDB is wiped → Fresh database created
   ↓
3. getTodayStats() auto-creates empty stats:
   {
     date: '2026-01-26',
     cardsReviewed: 0,
     sessionsCompleted: 0,
     timeSpent: 0,
     updatedAt: 1769430489327  ← NEW TIMESTAMP
   }
   ↓
4. Sync runs with lastSyncTime: null (first sync)
   ↓
5. collectLocalChanges() includes ALL stats (including empty ones)
   ↓
6. Empty stats uploaded to server with newest timestamp
   ↓
7. Server's "Last-Write-Wins" conflict resolution:
   - Compares timestamps
   - Empty stats (1769430489327) > Real stats (1769430427693)
   - Empty stats WIN → Overwrite real data
   ↓
8. Desktop syncs → Downloads empty stats → Data lost everywhere
```

### Why This Happened

**Design Flaw**: The sync system had no concept of "empty stats" vs "real stats." It treated freshly created empty stats (from a wiped database) the same as legitimate stat updates.

**Key Code Problem** (Before Fix):
```typescript
// In collectLocalChanges() - lib/services/sync.ts
if (!lastSyncTime) {
  // First sync - include all stats
  shouldInclude = true;  // ❌ INCLUDES EMPTY STATS!
}
```

---

## The Fix

### Solution Strategy

**Core Principle**: Never upload "empty" stats (stats with no actual activity) when `lastSyncTime` is null.

### Implementation

```typescript
// In collectLocalChanges() - lib/services/sync.ts

// CRITICAL: Never upload "empty" stats (fresh stats with no activity)
// These are created automatically when getTodayStats() runs on a fresh database
// Uploading them would overwrite real stats from other devices
const isEmpty = (stat.cardsReviewed || 0) === 0 && 
                (stat.sessionsCompleted || 0) === 0 && 
                (stat.timeSpent || 0) === 0;

if (isEmpty && !lastSyncTime) {
  // Fresh database with empty stats - don't upload, only download from server
  shouldInclude = false;
} else if (!lastSyncTime) {
  // First sync with actual data - include stats that have activity
  shouldInclude = true;
} else if (stat.updatedAt) {
  // Has updatedAt timestamp - check if modified since last sync
  shouldInclude = stat.updatedAt > lastSyncTime.getTime();
}
```

### Logic Flow After Fix

```
1. User clears browser history
   ↓
2. IndexedDB wiped → Fresh database created
   ↓
3. getTodayStats() creates empty stats with new timestamp
   ↓
4. Sync runs with lastSyncTime: null
   ↓
5. collectLocalChanges() evaluates stats:
   - isEmpty check: cardsReviewed=0, sessionsCompleted=0, timeSpent=0 → TRUE
   - lastSyncTime is null → TRUE
   - shouldInclude = FALSE ✅
   ↓
6. No empty stats uploaded (0 stats in sync payload)
   ↓
7. Server returns real stats (cardsReviewed: 5, accuracy: 0.8)
   ↓
8. Real stats downloaded and applied to IndexedDB
   ↓
9. Result: Data correctly restored from server! 🎉
```

---

## Testing & Verification

### Test Method

Simulated the exact scenario on localhost by deleting IndexedDB in Chrome DevTools.

### Test Steps

1. Complete a review session (5 cards, 80% accuracy)
2. Verify stats sync to server
3. Delete `palabra-db` from Application → IndexedDB
4. Refresh page (triggers fresh database + first sync)
5. Verify stats restored from server (not reset to 0)

### Debug Log Evidence

**Before the fix:**
- Empty stats were uploaded to server
- Server data overwritten with zeros
- Data loss across all devices

**After the fix:**
```json
// Line 248: Empty stats correctly identified
{
  "date": "2026-01-26",
  "cardsReviewed": 0,
  "isEmpty": true,
  "shouldInclude": false  ← ✅ NOT UPLOADED
}

// Line 249: Upload count
{
  "statsToSync": 0,  ← ✅ NO EMPTY STATS
  "totalStatsEvaluated": 1
}

// Lines 251-253: Server returns real data
{
  "serverStatsCount": 13,
  "serverStats": [{
    "date": "2026-01-26",
    "cardsReviewed": 5,  ← ✅ CORRECT DATA
    "updatedAt": 1769430427693
  }]
}

// Line 280: Final result
{
  "storedStats": {
    "cardsReviewed": 5,  ← ✅ DATA RESTORED!
    "accuracyRate": 0.8
  }
}
```

---

## Files Modified

### Core Fix
- **`palabra/lib/services/sync.ts`**
  - Added `isEmpty` check in `collectLocalChanges()`
  - Prevents empty stats upload during first sync
  - Optimized `lastSyncTime` calculation

### Cleanup (Debug Instrumentation Removed)
- **`palabra/lib/db/stats.ts`** - Removed debug logs
- **`palabra/app/(dashboard)/review/page.tsx`** - Removed debug logs
- **`palabra/app/api/sync/stats/route.ts`** - Removed debug logs  
- **`palabra/lib/hooks/use-vocabulary.ts`** - Removed debug logs

---

## Impact Assessment

### Severity
**Critical** - Complete data loss for affected users

### Affected Users
Users who clear browser data (browser history, cookies, site data)

### User Impact
- ✅ **Before Fix**: Stats reset to 0 after clearing browser data
- ✅ **After Fix**: Stats correctly restored from server

### Deployment
- **Environment**: Production
- **URL**: https://palabra.vercel.app
- **Deployment Date**: January 26, 2026
- **Auto-deploy**: Triggered via GitHub push

---

## Related Issues & Previous Fixes

### Related Bug Fixes
1. **`BUG_FIX_2026_01_21_RECALL_PROGRESS.md`** - Review progress persistence
2. **`BUG_FIX_2026_01_22_STATS_AUTO_REFRESH.md`** - Stats UI auto-update
3. **`BUG_FIX_2026_01_22_SYNC_COMPLETE.md`** - Stats sync with `updatedAt` timestamps

### Architecture Context
- See `BACKEND_INFRASTRUCTURE.md` for sync architecture
- See `BUG_REPORTS.md` for complete bug history

---

## Lessons Learned

### Key Insights

1. **Empty Data is Different from No Data**
   - Empty stats (auto-created on fresh DB) should not be treated as legitimate updates
   - Need to distinguish between "user has no activity" vs "database was just initialized"

2. **First Sync is Special**
   - `lastSyncTime: null` indicates either:
     - Truly first sync ever (legitimate empty state)
     - Database was wiped (should only download, never upload)
   - Need additional heuristics to distinguish these cases

3. **Timestamps Alone Are Insufficient**
   - Just checking `updatedAt > lastSyncTime` is not enough
   - Must also check if data is meaningful (has actual activity)

### Design Improvements

**Current Fix** (Tactical):
- Filter out empty stats during first sync
- Simple and effective for this specific case

**Future Enhancement** (Strategic):
- Consider adding `createdAt` separate from `updatedAt`
- Track if stats were "user-modified" vs "system-generated"
- Implement "sync generation" counters to detect database wipes

---

## Verification Checklist

- [x] Bug reproduced locally (delete IndexedDB)
- [x] Fix verified with debug logs (empty stats not uploaded)
- [x] Stats correctly restored from server after DB clear
- [x] No regression in normal sync flow
- [x] All debug instrumentation removed
- [x] Code committed with detailed message
- [x] Deployed to production via GitHub push
- [x] Bug documented in `BUG_REPORTS.md`
- [x] Dedicated bug fix documentation created

---

## Commit Details

```
commit a151086
Author: Kalvin Brookes
Date: January 26, 2026

Fix: Prevent empty stats from overwriting server data after browser clear

Root Cause:
When users cleared browser history/IndexedDB, fresh empty stats (cardsReviewed=0) 
were created with new timestamps and uploaded to the server, overwriting real data 
from other devices.

Solution:
Never upload "empty" stats (stats with no actual activity: cardsReviewed=0, 
sessionsCompleted=0, timeSpent=0) during first sync when lastSyncTime is null. 
This ensures fresh databases only download from server, never overwrite.
```

---

**Status**: ✅ **RESOLVED**  
**Production URL**: https://palabra.vercel.app  
**Monitoring**: Verify no user reports of data loss after clearing browser data

---

*Last Updated: January 26, 2026*
