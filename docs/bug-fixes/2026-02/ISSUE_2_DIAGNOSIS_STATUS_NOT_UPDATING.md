# Issue #2 Diagnosis: Vocabulary Status Not Updating

**Date**: February 16, 2026  
**Reporter**: kalvin (kbrookes2507@gmail.com)  
**Status**: 🔴 Root Cause Identified  
**Priority**: High  

---

## 📋 **Problem Statement**

User reports that old vocabulary entries like "modales", "botella", and "ortografía" that they know very well:
1. ✅ **Never appear in review sessions** (CONFIRMED)
2. ❌ ~~Are stuck in "new" status~~ (**STATUS IS CORRECT** - requires 3+ reviews)
3. ❌ ~~Don't respond to being marked as "good" or "excellent"~~ (**ALGORITHM WORKING AS DESIGNED**)

### User's Clarification
> "The words botella and modales **never appear**."

This changes the investigation from "status not updating" to "**words not appearing in reviews**".

---

## 🔍 **Investigation Results**

### Database Analysis

#### Problem Words Data (Feb 16, 2026, 09:23 UTC)

| Word | Reps | Last Review | Next Review | Days Until Due | Status | Issue |
|------|------|------------|-------------|----------------|--------|-------|
| modales | 2 | Feb 13 | **Feb 19** | +3 days | new | ✅ Correct |
| botella | 2 | Feb 13 | **Feb 19** | +3 days | new | ✅ Correct |
| ortografía | 2 | Feb 12 | **Feb 18** | +2 days | new | ✅ Correct |

**Finding**: These words ARE NOT due for review yet. They're scheduled for the future per SM-2 algorithm.

#### SM-2 Scheduling Behavior

When user marks words as "good" or "excellent":

```
Repetition 0 → 1: Interval = 1 day   (appears next day)
Repetition 1 → 2: Interval = 6 days  ← Current state for problem words
Repetition 2 → 3: Interval = 15 days (if they could review them)
```

**Status Calculation** (`determineVocabularyStatus`):
- `new`: < 3 total reviews ← **Problem words are here (2 reviews)**
- `learning`: 3-4 reviews OR accuracy < 80%
- `mastered`: 5+ consecutive reviews AND accuracy ≥ 80%

### Critical Data Mismatch

🔴 **Review Records Missing in PostgreSQL:**

| Location | VocabularyItem.repetitions | Review Table Count |
|----------|---------------------------|-------------------|
| PostgreSQL | 2 | **0** ❌ |
| Expected | 2 | **2** ✅ |

**Impact**:
- Reviews exist in IndexedDB (browser) ✅
- Reviews NOT synced to PostgreSQL ❌
- Could cause data loss if IndexedDB is cleared
- Affects retention analytics and method-specific tracking

### Overall Review Status

- **Total active words**: 1,231
- **Words due now**: 449 (36.5%)
- **Words scheduled for future**: 782 (63.5%)
- **User reports**: 345 cards to review (close to 449, but implies same words repeating)

---

## 🎯 **Root Causes**

### Primary Issue: User Expectation vs. SM-2 Algorithm

**What the user expects**:
- Review familiar words frequently until they're marked as "mastered"
- Words they know well should progress quickly through statuses

**What SM-2 does**:
- Spaces out reviews based on performance (correct = longer intervals)
- Good performance = longer wait = slower status progression
- **By design**: "modales" won't appear again until Feb 19

**Paradox**: 
- User knows word well → marks as "good" → interval increases → can't review again soon → stays in "new" status longer

### Secondary Issue: Review Records Not Syncing

**Code Analysis**:

Review completion flow (`app/dashboard/review/page.tsx:369-400`):

```typescript
// ✅ Creates/updates Review in IndexedDB
const existingReview = await getReviewByVocabId(result.vocabularyId);
if (existingReview) {
  await updateReviewRecordDB(updatedReview); // IndexedDB only
} else {
  await createReviewRecord(updatedReview);   // IndexedDB only
}
```

**Problem**: Review records are saved to IndexedDB but NOT queued for sync to PostgreSQL.

**Evidence**:
- VocabularyItem in PostgreSQL has `repetitions=2` (synced somehow)
- Review table in PostgreSQL has `count=0` (never synced)

---

## 💡 **Proposed Solutions**

### Solution 1: Add "Practice Mode" for Known Words (Recommended)

**Concept**: Allow users to force-review words they want to practice, regardless of scheduling.

**Implementation**:
1. Add "Practice Known Words" button to review configuration
2. Filter to show only words with status="new" but repetitions ≥ 1
3. Allow user to complete reviews and progress status
4. Don't modify nextReviewDate (keeps SM-2 scheduling intact)

**Benefits**:
- ✅ Respects SM-2 for long-term retention
- ✅ Allows user to "graduate" known words out of "new" status
- ✅ Doesn't break spaced repetition effectiveness

**Files to modify**:
- `app/dashboard/review/page.tsx`: Add practice mode option
- `lib/types/review.ts`: Add `practiceKnownWords` to `StudySessionConfig`
- `components/features/session-config.tsx`: Add UI toggle

### Solution 2: Adjust Status Thresholds

**Concept**: Lower the threshold for "learning" status from 3 reviews to 2 reviews for words with high accuracy.

**Current Logic**:
```typescript
if (review.totalReviews < 3) {
  return 'new';
}
```

**Proposed Logic**:
```typescript
// Allow progression to "learning" after 2 reviews if high accuracy
if (review.totalReviews < 2) {
  return 'new';
} else if (review.totalReviews === 2 && accuracy >= 90) {
  return 'learning'; // Fast-track high performers
} else if (review.totalReviews < 3) {
  return 'new';
}
```

**Benefits**:
- ✅ Rewards excellent performance
- ✅ No UI changes needed
- ⚠️ Still requires waiting for scheduled review

### Solution 3: Fix Review Sync to PostgreSQL

**Concept**: Ensure Review records are properly synced to PostgreSQL.

**Current Issue**: Reviews saved to IndexedDB but not queued for cloud sync.

**Implementation**:
1. After creating/updating Review in IndexedDB, queue for sync:

```typescript
await createReviewRecord(updatedReview);
// ADD THIS:
await offlineQueueService.queueOperation({
  type: 'CREATE_REVIEW',
  tableName: 'reviews',
  data: updatedReview,
  timestamp: Date.now(),
});
```

2. Update sync service to handle Review table syncing
3. Add Review sync endpoint: `POST /api/sync/reviews`

**Benefits**:
- ✅ Fixes data integrity issue
- ✅ Enables retention analytics
- ✅ Prevents data loss

**Files to modify**:
- `app/dashboard/review/page.tsx`: Queue review sync operations
- `lib/services/sync.ts`: Add Review sync logic
- `app/api/sync/reviews/route.ts`: Create Review sync endpoint (already exists!)

---

## 🧪 **Verification Steps**

After implementing fixes:

1. **Test Practice Mode**:
   - Start review with "Practice Known Words" enabled
   - Verify "modales", "botella", "ortografía" appear
   - Complete 1 review for each
   - Verify status changes from "new" → "learning"

2. **Test Review Sync**:
   - Complete 5 reviews
   - Check IndexedDB: 5 Review records ✅
   - Trigger sync
   - Check PostgreSQL: 5 Review records ✅
   - Verify `VocabularyItem.repetitions` matches `Review.count`

3. **Test Status Progression**:
   - Add new word
   - Review with "excellent" 3 times
   - Verify status: new → learning → (mastered after 5)

---

## 📊 **Impact Analysis**

### Current State
- ❌ User frustrated: can't progress familiar words
- ❌ Data integrity compromised: Review records missing
- ❌ Analytics incomplete: can't track method-specific performance
- ⚠️ Risk of data loss if IndexedDB cleared

### After Fix (Solution 1 + 3)
- ✅ User can practice known words anytime
- ✅ Data fully synced to PostgreSQL
- ✅ Complete retention analytics
- ✅ No risk of data loss
- ✅ SM-2 effectiveness preserved

---

## 🚀 **Implementation Priority**

### High Priority (Do First)
1. **Fix Review Sync** (Solution 3) - 2-3 hours
   - Critical data integrity issue
   - Required for analytics

### Medium Priority (Do Next)
2. **Add Practice Mode** (Solution 1) - 3-4 hours
   - Addresses user's primary concern
   - Enhances UX without breaking SM-2

### Low Priority (Optional)
3. **Adjust Status Thresholds** (Solution 2) - 1 hour
   - Minor improvement
   - Consider after user feedback on Practice Mode

---

## 📝 **Related Issues**

This investigation revealed that Issue #3 (same words in different review methods on same day) may also be related to the large backlog of due words (449 words due, but user reports 345 cards to review).

**Next Investigation**: Check if review method selection algorithm is correctly spacing out words across different methods vs. showing same word in multiple methods on same day.

---

## 🔗 **References**

- SM-2 Algorithm: `lib/utils/spaced-repetition.ts`
- Review Flow: `app/dashboard/review/page.tsx`
- Status Determination: `determineVocabularyStatus()` (line 376-393)
- Sync Service: `lib/services/sync.ts`
- Review Sync Endpoint: `app/api/sync/reviews/route.ts` (exists but not fully utilized)

---

**Status**: Ready for implementation  
**Estimated Time**: 5-7 hours for Solutions 1 + 3  
**Testing Time**: 2 hours  
**Total**: 7-9 hours
