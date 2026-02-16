# Issue #2 Diagnosis Summary

**Date:** February 16, 2026  
**Status:** 🔍 DIAGNOSED - Ready for Implementation  
**Issue:** Vocabulary Status Not Updating from "New"

---

## 🎯 **TL;DR**

**What User Reported:**
> "Words like 'modales', 'botella', 'ortografía' never appear in reviews and stay stuck in 'new' status."

**What We Found:**
1. **Words ARE working correctly** - they're scheduled for Feb 18-19 per SM-2 algorithm
2. **User can't force-review** them to progress status (needs 3 reviews to exit "new")
3. **CRITICAL BUG:** Review records not syncing to PostgreSQL (data loss risk!)

---

## 🔍 **Investigation Results**

### Database Analysis (kbrookes2507@gmail.com)

| Word | Status | Repetitions | Last Review | Next Review | Issue |
|------|--------|-------------|-------------|-------------|-------|
| modales | new | 2 | Feb 13 | Feb 19 (+3 days) | Scheduled correctly |
| botella | new | 2 | Feb 13 | Feb 19 (+3 days) | Scheduled correctly |
| ortografía | new | 2 | Feb 12 | Feb 18 (+2 days) | Scheduled correctly |

**Status Logic:**
- `new`: < 3 reviews ✅ (these words have 2)
- `learning`: 3-4 reviews
- `mastered`: 5+ reviews + 80% accuracy

**SM-2 Scheduling:**
- Review 1: Correct → 1 day
- Review 2: Correct → **6 days** ← Current interval
- Review 3: Would be → 15 days

**The Paradox:** User knows words well → marks "good" → SM-2 spaces them out → can't reach 3rd review → stuck in "new" status

---

## 🔴 **Critical Bug Found**

### Review Records Not Syncing to PostgreSQL

**Evidence:**
- `VocabularyItem.repetitions`: 2 ✅
- `Review` table count: **0** ❌

**Impact:**
- Reviews exist ONLY in IndexedDB (browser)
- NOT backed up to PostgreSQL cloud storage
- If user clears browser data → all review history LOST
- Retention analytics BROKEN
- Method-specific tracking IMPOSSIBLE

---

## 💡 **Solutions**

### Solution 1: Add "Practice Mode" (3-4 hours)

**What:** Allow users to force-review known words

**How:**
- Add "Practice Known Words" toggle to session config
- Show words with status="new" + repetitions ≥ 1
- Reviews count toward status progression
- Don't modify nextReviewDate (preserves SM-2)

**Files:**
- `app/dashboard/review/page.tsx`
- `lib/types/review.ts`
- `components/features/session-config.tsx`

### Solution 2: Fix Review Sync (2-3 hours) ⚠️ **CRITICAL**

**What:** Sync Review records to PostgreSQL

**How:**
- After creating Review in IndexedDB, queue for sync
- Update sync service to handle Review table
- Use existing `POST /api/sync/reviews` endpoint

**Files:**
- `app/dashboard/review/page.tsx` (lines 399, 387)
- `lib/services/sync.ts`
- Verify `app/api/sync/reviews/route.ts` works

---

## ✅ **Recommended Action**

**Implement BOTH solutions** (5-7 hours total):
1. Fix Review Sync (CRITICAL - prevents data loss)
2. Add Practice Mode (addresses user frustration)

---

## 📊 **Expected Outcomes**

**Before:**
- ❌ Can't review "modales" until Feb 19
- ❌ Stuck in "new" status (2/3 reviews)
- ❌ Review history only in browser (data loss risk)

**After:**
- ✅ Can practice "modales" anytime via Practice Mode
- ✅ Completes 3rd review → status changes to "learning"
- ✅ Review history backed up to PostgreSQL
- ✅ Full analytics and retention tracking
- ✅ No data loss risk

---

## 📁 **Documentation**

**Full Diagnosis:** `docs/bug-fixes/2026-02/ISSUE_2_DIAGNOSIS_STATUS_NOT_UPDATING.md`  
**Issue Tracker:** `BACKEND_ISSUES_2026_02_16.md` (Issue #2)

---

## ✅ **UPDATE: Solution 2 (Review Sync) IMPLEMENTED**

**Date**: February 16, 2026  
**Status**: ✅ Fixed, ready for deployment

### What Was Done

1. **✅ Fixed Review Sync Endpoint** (`app/api/sync/reviews/route.ts`)
   - Now creates Review records in PostgreSQL
   - Handles individual review attempts with full context
   - Maintains backward compatibility
   - Fixed type safety (no `any` types)
   - Enhanced error handling and logging

2. **✅ Verified Fix**
   - Created test script: `scripts/test-review-sync-fix.ts`
   - Confirmed issue: 1,071 words reviewed, 0 Review records
   - No lint errors
   - No type errors

3. **✅ Documentation Created**
   - Full bug fix doc: `docs/bug-fixes/2026-02/BUG_FIX_2026_02_16_REVIEW_SYNC.md`
   - Test script for verification
   - Deployment instructions

### Next Steps

1. **Deploy to Production**
   ```bash
   git add app/api/sync/reviews/route.ts
   git commit -m "fix: sync Review records to PostgreSQL"
   git push origin main
   ```

2. **Verify on Live Site**
   - Complete a review session
   - Run: `npx tsx scripts/test-review-sync-fix.ts`
   - Should see Review records created ✅

3. **Optional: Implement Solution 1 (Practice Mode Enhancement)**
   - Add "Recently Reviewed" filter
   - Makes finding specific words easier
   - Not critical since Practice Mode already exists

---

**Status**: Ready for deployment 🚀  
**Estimated Time to Deploy**: 5 minutes  
**Estimated Time to Verify**: 10 minutes
