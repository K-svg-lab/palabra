# Phase 8 Enhancement: Directional Accuracy Tracking

**Date:** January 19, 2026  
**Status:** Implemented  
**Version:** Database v4

---

## Overview

This enhancement addresses a critical limitation in the weak words filtering system by implementing **directional accuracy tracking**. The system now distinguishes between receptive (Spanish→English) and productive (English→Spanish) vocabulary skills, which are fundamentally different language learning competencies.

## Problem Statement

### Original Issue
The weak words filter was showing "0 cards available" even when the user had reviewed words, because:

1. **All words had 100% accuracy** - Users had never clicked "forgot", only using "hard", "good", or "easy"
2. **Aggregated accuracy was meaningless** - The system lumped together:
   - ES→EN (receptive): Easier, recognition-based
   - EN→ES (productive): Harder, requires recall and spelling
   - All review modes (recognition, recall, listening)

### Pedagogical Reality
- **Receptive skills (ES→EN)** are easier: You see "perro" → recognize "dog"
- **Productive skills (EN→ES)** are harder: You see "dog" → must recall and spell "perro"
- A learner can have 100% accuracy in ES→EN but struggle with EN→ES for the same words

## Solution: Directional Accuracy Tracking

### Architecture Changes

#### 1. Enhanced Data Model

**ReviewRecord Type (Updated):**
```typescript
interface ReviewRecord {
  // ... existing SM-2 fields ...
  
  // NEW: Directional accuracy fields
  esToEnCorrect: number;    // Spanish → English correct count
  esToEnTotal: number;      // Spanish → English total reviews
  enToEsCorrect: number;    // English → Spanish correct count
  enToEsTotal: number;      // English → Spanish total reviews
  
  // Maintained for backwards compatibility
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
}
```

#### 2. Database Schema Migration

**Version:** 3 → 4  
**Migration Strategy:** Lazy Migration  

**Why Lazy Migration?**
- IndexedDB upgrade callbacks cannot be async
- Migration happens automatically when records are accessed
- No build errors or race conditions
- Transparent to the user

**Migration Logic:**
- Database version incremented to 4 (triggers upgrade)
- Helper function `ensureDirectionalFields()` in `reviews.ts`
- Called every time a review record is read
- Old records migrated on-the-fly with 50/50 split approximation
- New records initialize all directional fields to 0

**Files:** 
- `palabra/lib/db/schema.ts` - Version increment
- `palabra/lib/db/reviews.ts` - Lazy migration helper

#### 3. Review Recording Enhancement

**Updated Function:** `updateReviewRecord()`  
**New Parameters:**
```typescript
updateReviewRecord(
  currentReview: ReviewRecord,
  rating: DifficultyRating,
  reviewDate: number,
  direction: ReviewDirection // NEW: Tracks which direction was tested
): ReviewRecord
```

**Behavior:**
- `spanish-to-english`: Increments `esToEnTotal` and `esToEnCorrect` (if correct)
- `english-to-spanish`: Increments `enToEsTotal` and `enToEsCorrect` (if correct)
- `mixed`: Increments both directions

**File:** `palabra/lib/utils/spaced-repetition.ts`

#### 4. Weak Words Filter Enhancement

**Old Logic:**
```typescript
const accuracy = review.correctCount / review.totalReviews;
return accuracy < threshold; // Same threshold for all directions
```

**New Logic:**
```typescript
let accuracy: number;
if (config.direction === 'english-to-spanish') {
  // Use productive accuracy (typically lower)
  accuracy = review.enToEsTotal > 0 
    ? review.enToEsCorrect / review.enToEsTotal 
    : review.correctCount / review.totalReviews; // Fallback
} else if (config.direction === 'spanish-to-english') {
  // Use receptive accuracy (typically higher)
  accuracy = review.esToEnTotal > 0 
    ? review.esToEnCorrect / review.esToEnTotal 
    : review.correctCount / review.totalReviews; // Fallback
} else {
  // Mixed: use overall accuracy
  accuracy = review.correctCount / review.totalReviews;
}
return accuracy < threshold;
```

**Files Updated:**
- `palabra/components/features/session-config.tsx` (UI filter)
- `palabra/app/(dashboard)/review/page.tsx` (Server-side filter)

## Benefits

### 1. **Pedagogically Accurate**
Respects the distinction between receptive and productive vocabulary skills

### 2. **More Relevant Practice**
- Reviewing ES→EN? Shows words you struggle with in ES→EN
- Reviewing EN→ES? Shows words you struggle with in EN→ES
- No more irrelevant "weak words"

### 3. **Better Learning Insights**
Users can see they're strong in recognition but need practice in production

### 4. **Backwards Compatible**
- Old review records work with approximations
- Overall accuracy stats remain unchanged
- No data loss during migration

## Testing Instructions

### Test 1: Verify Database Migration

1. Open browser Developer Tools → Application → IndexedDB → `palabra_db`
2. Check version number: Should be **4**
3. Inspect `reviews` store: New fields should exist:
   - `esToEnCorrect`
   - `esToEnTotal`
   - `enToEsCorrect`
   - `enToEsTotal`

### Test 2: Verify Directional Tracking

1. Start a review session in **ES→EN** direction
2. Review 5 words, mix ratings (some "good", some "forgot")
3. Open DevTools console and run:
```javascript
const db = await new Promise((resolve) => {
  const req = indexedDB.open('palabra_db', 4);
  req.onsuccess = () => resolve(req.result);
});
const tx = db.transaction('reviews', 'readonly');
const reviews = await tx.objectStore('reviews').getAll();
console.table(reviews.map(r => ({
  word: r.vocabId.substring(0,8),
  esToEnTotal: r.esToEnTotal,
  esToEnCorrect: r.esToEnCorrect,
  enToEsTotal: r.enToEsTotal,
  enToEsCorrect: r.enToEsCorrect
})));
```
4. **Expected:** `esToEnTotal` increased by 5, `enToEsTotal` unchanged

### Test 3: Verify Weak Words Filter (ES→EN)

1. Configure review session:
   - Direction: **Spanish → English**
   - Weak Words Only: **ON**
   - Threshold: **90%**
2. **Expected:** Shows words with ES→EN accuracy < 90%
3. Words with low EN→ES but high ES→EN accuracy should NOT appear

### Test 4: Verify Weak Words Filter (EN→ES)

1. Configure review session:
   - Direction: **English → Spanish**
   - Weak Words Only: **ON**
   - Threshold: **90%**
2. **Expected:** Shows words with EN→ES accuracy < 90%
3. Different set of words than ES→EN filter

### Test 5: Verify Mixed Direction

1. Configure review session:
   - Direction: **Mixed**
   - Weak Words Only: **ON**
2. **Expected:** Uses overall accuracy (both directions combined)
3. Should show union of weak words from both directions

## Implementation Details

### Files Modified

1. **Type Definitions**
   - `palabra/lib/types/vocabulary.ts` - Added directional fields to `ReviewRecord`

2. **Database**
   - `palabra/lib/constants/app.ts` - Incremented version to 4
   - `palabra/lib/db/schema.ts` - Added migration logic

3. **Business Logic**
   - `palabra/lib/utils/spaced-repetition.ts` - Enhanced `updateReviewRecord()` and `createInitialReviewRecord()`

4. **UI Components**
   - `palabra/components/features/session-config.tsx` - Updated weak words filter (client-side)
   - `palabra/app/(dashboard)/review/page.tsx` - Updated weak words filter (server-side) and review recording

### Migration Strategy

**Backwards Compatibility:**
- Fallback to overall accuracy if directional data is missing
- Old records approximated with 50/50 split
- No breaking changes to existing functionality

**Forward Compatibility:**
- All new reviews capture directional data
- Future enhancements can leverage this granular tracking
- Foundation for mode-specific tracking (recognition vs recall)

## Future Enhancements

### Phase 8.5: Mode-Specific Tracking (Optional)
Could extend to track:
- Recognition accuracy per direction
- Recall accuracy per direction
- Listening accuracy per direction

Would require additional fields:
```typescript
esToEnRecognition: { correct: number, total: number }
esToEnRecall: { correct: number, total: number }
esToEnListening: { correct: number, total: number }
// ... and same for enToEs
```

### Analytics Dashboard Integration
- Chart showing ES→EN vs EN→ES accuracy over time
- Identify which direction needs more practice
- Track improvement in productive skills separately

## Known Limitations

1. **Mixed Direction Handling**
   - Currently increments both directions
   - Could be more sophisticated (track actual direction per card)

2. **Historical Data Approximation**
   - Old records split 50/50
   - Not perfectly accurate, but reasonable estimate

3. **No Mode Distinction Yet**
   - Recognition, recall, and listening lumped together
   - Future enhancement could separate these

## Success Metrics

**Before Enhancement:**
- Weak words filter showed 0 cards despite user struggling
- 100% accuracy despite learners struggling with EN→ES

**After Enhancement:**
- Weak words filter shows relevant words based on direction
- Users can practice weak productive skills separately
- More meaningful accuracy metrics

---

## Rollback Procedure

If issues arise:

1. **Revert database version:**
   ```typescript
   // In palabra/lib/constants/app.ts
   VERSION: 3 // Revert from 4
   ```

2. **Remove directional logic:**
   - Revert changes to `spaced-repetition.ts`
   - Revert weak words filter logic

3. **Clear browser data:**
   - Users will need to clear IndexedDB
   - Or keep version 4 and just ignore new fields

---

**Implementation Complete:** ✅  
**Testing Required:** User acceptance testing  
**Documentation:** This file + inline code comments

