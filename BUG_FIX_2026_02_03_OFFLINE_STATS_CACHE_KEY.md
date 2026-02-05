# Bug Fix: Offline Stats Not Updating Dashboard Immediately

**Date:** 2026-02-03  
**Status:** ✅ FIXED  
**Severity:** High - User-facing offline functionality broken  

---

## Problem

Dashboard did not automatically update the "cards reviewed" count immediately after completing an offline review session. The stats only appeared after:
1. Going back online, OR
2. Manually refreshing the page

**User Experience Impact:**
- User completes 5 reviews offline
- Clicks "Continue to Home"
- Dashboard still shows old count (e.g., 30 instead of 35)
- Creates confusion about whether reviews were saved

---

## Root Cause

**React Query cache key mismatch** between the refetch operation and the hook:

```typescript
// useTodayStats hook uses:
queryKey: ['stats', 'today']

// But refetchQueries was targeting:
queryKey: ['stats']  // ❌ WRONG - different cache entry!
```

This meant `refetchQueries()` was updating a cache entry that nothing was listening to, while the dashboard continued reading from the `['stats', 'today']` cache entry which remained stale.

---

## Investigation Process

### Evidence Collection
Used runtime instrumentation to track the data flow:

1. **IndexedDB Update** ✅ Working correctly
   ```
   [DEBUG-H2] Stats after session update 
   {cardsReviewed: 35, updatedAt: 1770124821046}
   ```

2. **refetchQueries Execution** ✅ Completed successfully
   ```
   [DEBUG-H6] Stats after refetchQueries completes 
   {cardsReviewed: 35, updatedAt: 1770124821046}
   ```

3. **Dashboard Display** ❌ Showing stale data
   ```
   [DEBUG-H3/H5] Dashboard stats displayed 
   {cardsReviewed: 25, updatedAt: 1770124010733}  // OLD timestamp!
   ```

### Key Discovery
The timestamps revealed the issue:
- `refetchQueries` completed with fresh data (timestamp: `1770124821046`)
- Dashboard rendered with stale data (timestamp: `1770124010733`)
- This indicated the dashboard was reading from a **different cache entry**

---

## Solution

### Code Changes

**File:** `app/(dashboard)/review/page.tsx`

```typescript
// BEFORE (incorrect)
await queryClient.refetchQueries({ queryKey: ['stats'] });

// AFTER (correct)
await queryClient.refetchQueries({ queryKey: ['stats', 'today'] });
```

### Why This Works

1. `useTodayStats` hook subscribes to `['stats', 'today']`
2. `refetchQueries` now targets the **same** cache entry
3. React Query notifies all subscribers (including the dashboard)
4. Dashboard re-renders immediately with fresh data

---

## Verification

### Test Results (2026-02-03)

**Scenario:** Complete 5-card review session offline

**Before Fix:**
- Local stats: 35 cards ✅
- Dashboard display: 30 cards (stale) ❌

**After Fix:**
- Local stats: 35 cards ✅
- Dashboard display: 35 cards ✅
- Immediate update (no delay)
- Timestamps match across all logs

### Console Log Evidence
```
[DEBUG-H2] Stats after session update {cardsReviewed: 35}
[DEBUG-H6] Stats after refetchQueries {cardsReviewed: 35}
📊 Today's stats updated: reviewed=35, accuracy=77.1%
[DEBUG-H3/H5] Dashboard stats displayed {cardsReviewed: 35}
```

All timestamps: `1770124821046` (consistent across all operations)

---

## Related Issues

### Previous Attempts
1. **First attempt:** Used `invalidateQueries` instead of `refetchQueries`
   - **Result:** Failed - only marked cache as stale, didn't force immediate refetch
   
2. **Second attempt:** Added 100ms delay after `refetchQueries`
   - **Result:** Failed - didn't solve the timing issue because the wrong cache was being updated
   
3. **Third attempt:** Corrected the query key
   - **Result:** SUCCESS ✅

### Why invalidateQueries Wasn't Enough
- `invalidateQueries`: Marks cache as stale, refetch happens on next access
- `refetchQueries`: Forces immediate refetch, perfect for offline scenarios
- **Both require the correct query key to work!**

---

## Technical Context

### React Query Cache Structure
```
QueryCache
├── ['stats'] ← refetchQueries was updating this (nobody listening)
└── ['stats', 'today'] ← useTodayStats reads from here (was stale)
```

### Fix Impact
- ✅ Offline stats update immediately
- ✅ No artificial delays needed
- ✅ Works across all devices
- ✅ Maintains sync integrity

---

## Lessons Learned

1. **Always verify query keys match** between hooks and cache operations
2. **Use runtime logging** to track data flow across cache boundaries  
3. **Timestamp comparison** is critical for detecting stale data issues
4. **Query key specificity matters** - `['stats']` ≠ `['stats', 'today']`

---

## Files Modified

1. `app/(dashboard)/review/page.tsx` - Fixed query key in refetchQueries
2. `app/(dashboard)/page.tsx` - Removed debug logs
3. `lib/hooks/use-vocabulary.ts` - Removed debug logs

---

## Deployment

- **Commit:** `a694515`
- **Branch:** `main`
- **Deployed:** 2026-02-03
- **Vercel:** Auto-deployed via GitHub push

---

## Summary

**Problem:** Dashboard didn't update stats after offline review sessions  
**Cause:** React Query cache key mismatch (`['stats']` vs `['stats', 'today']`)  
**Fix:** Corrected query key to match `useTodayStats` hook  
**Result:** Dashboard now updates instantly after offline sessions ✅
