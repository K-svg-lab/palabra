# Deployment: Progress Page Data Fixes
**Date:** 2026-02-18  
**Branch:** main  
**Status:** ✅ Production Ready

---

## Summary

Three data accuracy fixes on the Progress page, plus a build configuration fix.

---

## Changes

### 1. Fix: Charts Showing No Data (`app/dashboard/progress/page.tsx`)
**Root cause:** After the Phase 18 Issue #5 fix changed `getRecentStats(7)` to `getRecentStats(90)`, the returned array is sorted oldest → newest. The subsequent `slice(0, 7)` was therefore selecting the 7 *oldest* records (from ~90 days ago), not the most recent week. `prepareReviewsChartData` and `prepareAccuracyChartData` build their own date range from today and found no matching entries, producing a flat zero line.  
**Fix:** Pass the full 90-day array to `setRecentStats`. Both chart functions handle their own date windowing internally.

### 2. Fix: Vocabulary Mastery Ring Incorrect Colour Proportions (`components/features/mastery-ring.tsx`)
**Root cause:** Each SVG circle used `strokeDasharray = "segLen circumference"`, making the SVG dash pattern period `segLen + C` instead of `C`. This caused the `strokeDashoffset = C - startArc` positioning formula to land each segment at the wrong arc position, so the last-drawn circle (green/Mastered) appeared to cover most of the ring.  
**Fix:** Changed gap to `circumference - segmentLength` so period = `C`, making the offset formula exact. Each segment now occupies precisely its proportional arc: blue (New), purple (Learning), green (Mastered).

### 3. Fix: Overall Accuracy Showing 100% (`app/dashboard/progress/page.tsx`)
**Root cause:** `calculateOverallAccuracy(reviews)` computed `sum(correctCount) / sum(totalReviews)` from `ReviewRecord` data. Due to a data integrity issue (likely a migration that did not backfill `incorrectCount`), `incorrectCount` is 0 across all records, meaning `correctCount === totalReviews` → 100%.  
**Fix:** Replaced with `getOverallAccuracy()` from `lib/db/stats.ts`, which was already present but unused. It computes a cards-reviewed-weighted average of `DailyStats.accuracyRate` across all time — the same data source as the accuracy graph.

### 4. Fix: Build Failure — Script TypeScript Errors (`tsconfig.json`)
**Root cause:** Utility scripts in `scripts/` were included in the Next.js TypeScript check and contained type errors unrelated to the app.  
**Fix:** Added `"scripts"` to `tsconfig.json` `exclude` array.

---

## Files Modified

| File | Change |
|------|--------|
| `app/dashboard/progress/page.tsx` | Chart data fix; overall accuracy source swap; new `getOverallAccuracy` import; removed unused `calculateOverallAccuracy` import |
| `components/features/mastery-ring.tsx` | SVG dash pattern period fix for correct segment proportions |
| `tsconfig.json` | Exclude `scripts/` from TypeScript build |

---

## Build Verification

```
✓ Compiled successfully in 9.2s
✓ TypeScript: No errors
✓ Static pages generated: 54/54
✓ Exit code: 0
```

---

## Post-Deployment Checks

- [ ] Progress page charts show correct weekly data
- [ ] Vocabulary Mastery ring shows three colour segments proportional to New/Learning/Mastered counts
- [ ] Overall Accuracy stat matches the accuracy range shown in the Accuracy Rate chart
- [ ] No console errors
