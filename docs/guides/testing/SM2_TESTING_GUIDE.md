# SM-2 Algorithm Testing Guide

**Created:** January 19, 2026  
**Purpose:** Verify spaced repetition algorithm works correctly without waiting for days

---

## Quick Access

**Debug Panel URL:** `http://localhost:3000/debug-sm2`

**Password:** `Reaper789` (default) or custom password set in `NEXT_PUBLIC_DEBUG_PASSWORD`

Simply navigate to this URL while the dev server is running to access the SM-2 debug panel.

**Note:** The debug panel is password-protected. See `DEBUG_PANEL_SETUP.md` for full authentication details.

---

## What This Tool Does

The SM-2 Debug Panel allows you to:

1. **View SM-2 Parameters in Real-Time**
   - Ease factor, interval, repetition count for each word
   - Review history and accuracy
   - Next review date calculations

2. **Simulate Time Passing**
   - Fast-forward days/weeks/months without waiting
   - See which words become due for review
   - Test long-term scheduling behavior

3. **Test Different Ratings**
   - Preview what happens if you answer "easy", "good", "hard", or "forgot"
   - Apply test reviews and see immediate updates
   - Verify status transitions (new → learning → mastered)

4. **Inspect Review Schedule**
   - See exactly when each word is scheduled for review
   - Verify intervals match SM-2 algorithm specs
   - Compare expected vs actual behavior

---

## How to Use the Debug Panel

### Step 1: Start Dev Server

```bash
cd palabra
npm run dev
```

### Step 2: Access Debug Panel

Navigate to: `http://localhost:3000/debug-sm2`

Enter password: `Reaper789` (default)

### Step 3: Select a Word

Click on any vocabulary word in the left panel to view its SM-2 parameters.

### Step 4: Analyze Current State

The right panel shows:
- **Current SM-2 Parameters:** ease factor, interval, repetition, accuracy
- **Schedule Preview:** what will happen with each rating
- **Timestamps:** creation date, last review, next review

### Step 5: Test Review Scenarios

Click "Test This" next to any rating (easy/good/hard/forgot) to:
1. Apply the SM-2 algorithm with that rating
2. Update the word's status
3. Schedule the next review
4. See immediate results

### Step 6: Simulate Time Passing

Use the "Time Simulation" control to fast-forward:
- Enter number of days to simulate (e.g., 7 for one week)
- Words that become due will show "🔴 Due now"
- Test if the scheduling works correctly over time

---

## Testing Scenarios

### Test 1: Verify Initial Review Timing

**Current Behavior Issue:** Words are available **immediately** after creation, not the next day.

**To Test:**
1. Add a new word in the main app
2. Refresh the debug panel
3. Check "Next Review" timestamp
4. **Expected (per docs):** Should be ~24 hours after creation
5. **Actual:** Shows as "Available immediately"

**Code Location:** `palabra/lib/utils/spaced-repetition.ts:255`
```typescript
nextReviewDate: initialReviewDate, // Currently set to NOW
```

**Recommendation:** If first review should be "day after", change to:
```typescript
nextReviewDate: calculateNextReviewDate(1, initialReviewDate), // 1 day later
```

---

### Test 2: Verify First Review → 1 Day Interval

**Expected Behavior:** After first review, next review should be in 1 day.

**To Test:**
1. Select a word that has never been reviewed
2. Click "Test This" next to "Good"
3. Verify in the updated parameters:
   - `Interval: 1 day`
   - `Repetition: 1`
   - `Next review: Tomorrow` (or +1 day from simulated time)

**Success Criteria:**
- ✅ Interval = 1 day
- ✅ Next review date = current date + 1 day

---

### Test 3: Verify Second Review → 6 Day Interval

**Expected Behavior:** After second review, next review should be in 6 days.

**To Test:**
1. Continue with word from Test 2 (repetition = 1)
2. Simulate +1 day forward
3. Click "Test This" next to "Good" again
4. Verify:
   - `Interval: 6 days`
   - `Repetition: 2`
   - `Next review: In 6 days`

**Success Criteria:**
- ✅ Interval = 6 days
- ✅ Next review date = current date + 6 days

---

### Test 4: Verify Third+ Review → Ease Factor Multiplication

**Expected Behavior:** After third review, interval = previous interval × ease factor.

**To Test:**
1. Continue with word from Test 3 (repetition = 2, interval = 6)
2. Note current ease factor (likely 2.5)
3. Simulate +6 days forward
4. Click "Test This" next to "Good"
5. Verify:
   - `Interval: 15 days` (6 × 2.5 = 15)
   - `Repetition: 3`

**Success Criteria:**
- ✅ Interval = previous interval × ease factor (rounded)
- ✅ Ease factor remains at 2.5 (no change for "good")

---

### Test 5: Verify "Easy" Bonus

**Expected Behavior:** "Easy" rating adds +0.15 to ease factor and +30% to interval.

**To Test:**
1. Select any word with repetition ≥ 2
2. Note current ease factor (e.g., 2.5)
3. Click "Test This" next to "Easy"
4. Verify:
   - Ease factor increased by ~0.15
   - Interval is ~30% longer than "good" would give

**Success Criteria:**
- ✅ Ease factor: previous + 0.15
- ✅ Interval: (previous × ease factor) × 1.3

---

### Test 6: Verify "Hard" Penalty

**Expected Behavior:** "Hard" rating subtracts -0.15 from ease factor and -20% from interval.

**To Test:**
1. Select any word with repetition ≥ 2
2. Note current ease factor
3. Click "Test This" next to "Hard"
4. Verify:
   - Ease factor decreased by 0.15
   - Interval is ~20% shorter than "good" would give

**Success Criteria:**
- ✅ Ease factor: previous - 0.15 (minimum 1.3)
- ✅ Interval: (previous × ease factor) × 0.8

---

### Test 7: Verify "Forgot" Reset

**Expected Behavior:** "Forgot" resets interval to 1 day and repetition to 0.

**To Test:**
1. Select any word with repetition > 0
2. Click "Test This" next to "Forgot"
3. Verify:
   - `Interval: 1 day` (reset)
   - `Repetition: 0` (reset)
   - Ease factor decreased by 0.2
   - Incorrect count increased by 1

**Success Criteria:**
- ✅ Interval = 1 day (reset)
- ✅ Repetition = 0 (reset)
- ✅ Ease factor: previous - 0.2 (minimum 1.3)

---

### Test 8: Verify Status Transitions

**Expected Behavior:**
- **New:** < 3 total reviews
- **Learning:** 3+ reviews but < 5 repetitions OR < 80% accuracy
- **Mastered:** 5+ consecutive correct reviews AND ≥ 80% accuracy

**To Test:**
1. Start with a new word (status: "new")
2. Complete 2 reviews with "good" → Should stay "new"
3. Complete 3rd review with "good" → Should change to "learning"
4. Complete 4th and 5th reviews with "good" → Should change to "mastered"

**Success Criteria:**
- ✅ Status changes from "new" to "learning" after 3rd review
- ✅ Status changes from "learning" to "mastered" after 5th consecutive correct review

---

### Test 9: Verify Long-Term Scheduling

**Expected Behavior:** Intervals should grow exponentially up to 365 days max.

**To Test:**
1. Select a mastered word
2. Simulate multiple reviews with "good" rating
3. Track interval growth:
   - Review 3: ~15 days
   - Review 4: ~37 days (15 × 2.5)
   - Review 5: ~92 days
   - Review 6: ~230 days
   - Review 7+: ~365 days (capped at maximum)

**Success Criteria:**
- ✅ Intervals grow exponentially
- ✅ Maximum interval caps at 365 days

---

### Test 10: Verify Time Simulation Accuracy

**Expected Behavior:** Simulating time forward should correctly determine which words are due.

**To Test:**
1. Note which words are due now (red indicator)
2. Note upcoming review dates for several words
3. Simulate +7 days forward
4. Verify that words scheduled within 7 days now show as due

**Success Criteria:**
- ✅ Words with `nextReviewDate ≤ simulatedNow` show as "Due now"
- ✅ Date arithmetic is correct (no off-by-one errors)

---

## Common Issues to Check

### Issue 1: Initial Review Timing

**Problem:** Words available immediately instead of "day after" creation.

**Location:** `palabra/lib/utils/spaced-repetition.ts:255`

**Fix:** Change `nextReviewDate: initialReviewDate` to `nextReviewDate: calculateNextReviewDate(1, initialReviewDate)`

---

### Issue 2: Status Not Updating

**Problem:** Word status doesn't transition from "new" to "learning" to "mastered".

**Check:**
- Review count is incrementing
- Repetition count is incrementing (and not resetting incorrectly)
- Status determination logic in `determineVocabularyStatus()` is correct

**Location:** `palabra/lib/utils/spaced-repetition.ts:286-303`

---

### Issue 3: Intervals Not Growing

**Problem:** Intervals stay at 1 or 6 days, never grow exponentially.

**Check:**
- Repetition count is > 2
- Ease factor is being applied correctly
- Interval calculation uses previous interval, not a hardcoded value

**Location:** `palabra/lib/utils/spaced-repetition.ts:49-95`

---

### Issue 4: Ease Factor Stuck

**Problem:** Ease factor never changes from 2.5.

**Check:**
- Rating is being passed correctly to `calculateEaseFactor()`
- Switch statement handles all ratings
- No rounding/precision issues

**Location:** `palabra/lib/utils/spaced-repetition.ts:112-136`

---

## Database Inspection (Alternative Method)

If you prefer to inspect the database directly without the UI:

### Open Browser DevTools

1. Press F12 to open DevTools
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Navigate to IndexedDB → palabra-db

### Inspect Review Records

```javascript
// In browser console:
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('palabra-db');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const tx = db.transaction('reviews', 'readonly');
const store = tx.objectStore('reviews');
const reviews = await new Promise((resolve) => {
  const request = store.getAll();
  request.onsuccess = () => resolve(request.result);
});

console.table(reviews.map(r => ({
  word: r.vocabId.substring(0, 8),
  interval: r.interval,
  easeFactor: r.easeFactor,
  repetition: r.repetition,
  totalReviews: r.totalReviews,
  nextReview: new Date(r.nextReviewDate).toLocaleString()
})));
```

This will print a table of all review records with key SM-2 parameters.

---

## Expected SM-2 Behavior Summary

| Review # | Interval Calculation | Typical Interval (with EF=2.5) |
|----------|---------------------|-------------------------------|
| 1st      | Fixed: 1 day        | 1 day                         |
| 2nd      | Fixed: 6 days       | 6 days                        |
| 3rd      | 6 × 2.5 = 15       | 15 days                       |
| 4th      | 15 × 2.5 = 37.5    | 38 days                       |
| 5th      | 38 × 2.5 = 95      | 95 days                       |
| 6th      | 95 × 2.5 = 237.5   | 238 days                      |
| 7th+     | Capped at max      | 365 days (maximum)            |

**Notes:**
- "Easy" rating: +30% interval, +0.15 ease factor
- "Hard" rating: -20% interval, -0.15 ease factor
- "Forgot" rating: Reset to 1 day, -0.2 ease factor, repetition = 0

---

## Reporting Issues

If you find discrepancies between expected and actual behavior:

1. **Document the test case:** Which scenario failed?
2. **Capture the parameters:** Screenshot or note the SM-2 values
3. **Note the timestamps:** When was word created, reviewed, next scheduled?
4. **Check the code:** Reference the line numbers in this guide
5. **Update debug report:** Follow the format in `DEBUG_SESSION_2026_01_19.md`

---

## Security & Access

The debug panel is **password-protected** to prevent unauthorized access:

- **Default Password:** `debug2026`
- **Custom Password:** Set `NEXT_PUBLIC_DEBUG_PASSWORD` in environment variables
- **Session-based:** Authentication persists during browser session
- **Auto-logout:** Clears on browser close
- **Exit button:** Top-right corner for manual logout

See `DEBUG_PANEL_SETUP.md` for complete security documentation.

## Cleanup

After testing, you can:
- Keep the debug panel for future verification (recommended)
- Password protection prevents accidental user access
- Access it anytime via `/debug-sm2` route with password

The debug panel does NOT interfere with production builds and is kept isolated for developer use.

---

**Next Steps:**

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/debug-sm2`
3. Run through Tests 1-10 above
4. Document any failures in a new debug session file
5. Fix issues with runtime evidence (following debug mode protocol)

---

*Last Updated: January 19, 2026*
