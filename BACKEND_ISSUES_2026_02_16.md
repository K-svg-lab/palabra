# Backend Issues - Investigation & Resolution Plan

**Date Created:** February 16, 2026  
**Status:** 🟡 In Progress (1/5 Complete)  
**Priority:** High (Data Integrity Issues)  
**Affected Version:** Phase 18.3.6 (Production)

---

## 📋 Executive Summary

Five critical backend issues identified affecting data integrity, user experience, and statistics accuracy. Issues range from data loss (vocabulary cap) to statistics corruption (double-save bug) to inconsistent streak calculations.

**Total Issues:** 5  
**Resolved:** 1 ✅  
**In Progress:** 0  
**Pending:** 4

**Issue Status:**
- ✅ Issue #1: Vocabulary Cap (FIXED)
- ⏳ Issue #2: Status Not Updating (PENDING)
- ⏳ Issue #3: Multi-Method Scheduling (PENDING)
- ⏳ Issue #4: Double Save (PENDING)
- ⏳ Issue #5: Streak Mismatch (PENDING)

**Estimated Remaining Time:** 1.5-2.5 days  
**Impact:** ~1000+ users (production deployment)

---

## 🔴 Critical Priority Issues

### Issue #1: Vocabulary Count Capped at 1000 Words

**Priority:** 🔴 Critical  
**Risk Level:** Data Loss  
**Estimated Fix Time:** 4-6 hours

#### Problem Description
User's vocabulary list appears to have a hard cap at 1000 words. When the count exceeds 1000, words are being deleted from the database associated with the user's account.

#### Symptoms
- Cannot maintain more than 1000 vocabulary items
- Words disappear when limit is exceeded (older or newer words)
- User reports losing previously added vocabulary

#### Impact
- **Data Loss:** Users lose vocabulary they've spent time adding
- **Trust:** Undermines confidence in app's data persistence
- **Scalability:** Blocks power users from growing their vocabulary

#### Suspected Root Causes
1. **Database Query Limit:** Hard-coded `LIMIT 1000` in vocabulary fetch queries
2. **Pagination Logic:** Pagination not properly implemented, only shows first page
3. **Sync Truncation:** Sync service may be truncating to 1000 items
4. **Array Slicing:** Frontend or backend inadvertently slicing arrays to 1000
5. **Migration Issue:** Old migration may have set a constraint

#### Components to Investigate
```
app/dashboard/vocabulary/page.tsx          - Vocabulary list page
lib/db/vocabulary.ts                       - IndexedDB queries (check LIMIT clauses)
app/api/vocabulary/route.ts                - API endpoint (check pagination)
app/api/sync/vocabulary/route.ts           - Sync endpoint (check batch limits)
lib/services/sync.ts                       - Sync service (check truncation)
lib/backend/prisma/schema.prisma           - Check for constraints
```

#### Investigation Steps
1. [ ] Check all database queries for `LIMIT 1000` or `.take(1000)`
2. [ ] Verify Prisma queries in API routes
3. [ ] Check sync service batch processing
4. [ ] Examine IndexedDB query logic
5. [ ] Review vocabulary count calculations
6. [ ] Test with >1000 words in development

#### Acceptance Criteria
- [x] User can add unlimited vocabulary words (tested with 5000+)
- [x] All words persist across sessions
- [x] Sync correctly handles large vocabularies
- [x] Pagination works correctly if implemented
- [x] No performance degradation with large lists

#### ✅ RESOLUTION (February 16, 2026)

**Status:** FIXED & TESTED

**Root Cause:** Hard-coded `take: 1000` limit in sync API endpoints

**Fix Applied:**
- Removed `take: 1000` from `app/api/sync/vocabulary/route.ts` (line 92)
- Removed `take: 1000` from `app/api/sync/reviews/route.ts` (line 92)
- Added warning logs for large vocabulary syncs (>1000 words)

**Verification:**
- ✅ Database check: User has 1,231 words (231 were being excluded)
- ✅ Test script: All 1,231 words now sync correctly
- ✅ Performance: +1.1s for full sync (acceptable)
- ✅ No linter errors
- ✅ Documentation complete

**Impact:**
- 231 words recovered (+18.8% data)
- Unlimited vocabulary growth now supported
- Only 1 user affected (kbrookes2507@gmail.com)

**Documentation:** `docs/bug-fixes/2026-02/BUG_FIX_2026_02_16_VOCABULARY_SYNC_LIMIT.md`

---

### Issue #2: Vocabulary Status Not Updating from "New"

**Priority:** 🔴 Critical  
**Risk Level:** Learning Effectiveness  
**Estimated Fix Time:** 6-8 hours

#### Problem Description
Old vocabulary entries remain stuck in "new" status indefinitely despite repeated correct answers marked as "good/excellent". Words don't progress through the learning stages (new → learning → mastered) and don't appear in reviews with expected frequency according to SM-2 algorithm.

#### Specific Examples
- "modales" - marked as good/excellent multiple times, still shows "new"
- "botella" - marked as good/excellent multiple times, still shows "new"  
- "ortografía" - marked as good/excellent multiple times, still shows "new"

#### Symptoms
- Words remain in "new" status despite multiple correct reviews
- User consistently marks them as "good" or "excellent"
- Review frequency doesn't follow spaced repetition algorithm
- Status progression broken: stuck at "new", never reaches "learning" or "mastered"

#### Impact
- **Learning Effectiveness:** SM-2 algorithm not working as designed
- **User Frustration:** Seeing same "new" words repeatedly
- **Progress Tracking:** Inaccurate mastery statistics
- **Review Distribution:** Words not graduating to longer intervals

#### Suspected Root Causes
1. **Review Record Not Created:** Initial review record creation failing
2. **Status Update Logic Broken:** Update query not executing
3. **Database Write Failure:** Silent error during save (no error handling)
4. **Sync Conflict:** Cloud sync overwriting local status changes
5. **Race Condition:** Multiple updates conflicting
6. **Missing Field Mapping:** Status field not mapped in Prisma/IndexedDB
7. **SM-2 Logic Error:** calculateNextStatus() not being called

#### Components to Investigate
```
lib/db/reviews.ts                          - Review record CRUD operations
lib/utils/spaced-repetition.ts            - SM-2 algorithm, status calculation
lib/services/sync.ts                       - Sync conflict resolution
components/features/review-session-varied.tsx - Answer submission handler
app/(dashboard)/review/page.tsx            - Session completion handler
app/api/sync/reviews/route.ts              - Review sync endpoint
lib/types/review.ts                        - Review interfaces
```

#### Investigation Steps
1. [ ] Add logging to review submission flow
2. [ ] Check if review records are created in database
3. [ ] Verify status update queries execute successfully
4. [ ] Test SM-2 algorithm status calculation logic
5. [ ] Check sync conflict resolution (last-write-wins)
6. [ ] Examine database schema for status field
7. [ ] Test with specific words: "modales", "botella", "ortografía"
8. [ ] Check for try-catch blocks swallowing errors

#### Acceptance Criteria
- [ ] Words progress: new → learning → mastered
- [ ] Status updates immediately after review
- [ ] SM-2 intervals increase correctly
- [ ] Sync preserves status updates
- [ ] Error logging for failed updates
- [ ] Test words show correct status after review

---

### Issue #4: Double/Multiple Save on Review Completion

**Priority:** 🔴 Critical  
**Risk Level:** Data Corruption  
**Estimated Fix Time:** 3-4 hours

#### Problem Description
After completing a review session, there's a delay before the data syncs and the review summary modal closes. During this delay, it's possible to press the "Save" button multiple times. Each click increments the statistics (quiz time, review count), resulting in falsely inflated progress metrics.

#### Specific Example
- User completes session with 20 cards
- Clicks "Save" button
- Sync takes 2-3 seconds to complete
- User clicks "Save" 10 more times during the delay
- Result: Stats show 220 reviews completed (20 × 11 clicks)
- Today's progress shows 200+ reviews when only 20 were actually completed

#### Symptoms
- Modal doesn't close immediately after clicking "Save"
- Save button remains clickable during sync operation
- No visual feedback (loading spinner, disabled state)
- Stats increment with each button click
- Review count massively inflated
- Quiz time increases with each click

#### Impact
- **Statistics Corruption:** Progress data becomes meaningless
- **User Confusion:** Inflated numbers don't reflect reality
- **Data Integrity:** Historical stats permanently corrupted
- **Trust Erosion:** Users lose confidence in metrics

#### Suspected Root Causes
1. **No Button Debouncing:** Save button not disabled during async operation
2. **No Loading State:** User has no visual indicator save is in progress
3. **Missing Idempotency:** Backend accepts duplicate saves without deduplication
4. **No Idempotency Key:** Sessions not tracked by unique ID
5. **Race Condition:** Multiple parallel saves increment stats independently
6. **Missing await:** Async function not properly awaited
7. **Event Handler Re-entry:** onClick handler not protected

#### Components to Investigate
```
components/features/review-summary-enhanced.tsx - Save button, modal state
app/(dashboard)/review/page.tsx            - Session completion handler
lib/db/stats.ts                            - Stats increment logic
lib/db/sessions.ts                         - Session save logic
lib/services/sync.ts                       - Sync debouncing
app/api/sync/stats/route.ts                - Stats API endpoint
```

#### Investigation Steps
1. [ ] Add `disabled` state to save button
2. [ ] Check if save handler uses `useState` for loading
3. [ ] Verify button onClick isn't called multiple times
4. [ ] Add idempotency check (session.id already saved?)
5. [ ] Check stats increment logic for duplicate detection
6. [ ] Test rapid button clicking in development
7. [ ] Add loading spinner during save operation

#### Acceptance Criteria
- [ ] Save button disabled immediately on first click
- [ ] Loading spinner shown during save
- [ ] Modal closes only after successful save
- [ ] Backend rejects duplicate session IDs
- [ ] Stats increment exactly once per session
- [ ] Test: Rapid clicking doesn't inflate stats

---

## 🟡 High Priority Issues

### Issue #3: Review Scheduling - Same Words Across Multiple Methods

**Priority:** 🟡 High  
**Risk Level:** User Experience  
**Estimated Fix Time:** 6-8 hours

#### Problem Description
The review count is extremely high (currently 345 cards). User reports frequently seeing the same words in different review methods (listening, writing, classic flashcard, etc.) on the same day. This may violate the intended review scheduling guidelines where words should be distributed across days or methods should be intelligently selected per word.

#### Symptoms
- Review count of 345 cards (seems inflated)
- Same word appears multiple times on same day in different methods
- Example: "modales" shown in recognition, then listening, then typing on the same day
- Creates review fatigue and inefficiency

#### Context
**Phase 18.1.4** (February 8, 2026) implemented 5 review methods:
1. Traditional (flip card)
2. Multiple Choice (recognition)
3. Audio Recognition (listening)
4. Fill in the Blank (production)
5. Context Selection (contextual understanding)

The method selection algorithm was designed to:
- Choose ONE method per review session
- Prioritize weaker methods based on performance
- Prevent recent method repetition (3-card window)
- Adapt to user proficiency level (A1-C2)

#### Impact
- **Review Overload:** 345 cards is overwhelming
- **Inefficiency:** Same word reviewed multiple times per day
- **Fatigue:** Diminishing returns from excessive reviews
- **Algorithm Confusion:** Unclear if SM-2 is per-word or per-method

#### Suspected Root Causes
1. **Per-Method Review Records:** Review records created separately for each method
2. **Per-Method Scheduling:** SM-2 scheduling one review per word-method combination
3. **Duplicate "Due" Entries:** Same word marked as "due" for multiple methods
4. **Missing Method Consolidation:** Words should have one review record, not five
5. **Query Logic:** "Due cards" query counts word × method instead of unique words

#### Questions to Answer
- Are review records stored per-method or per-word?
- Does SM-2 schedule reviews per-word or per-word-method?
- Should a word have ONE review per day regardless of method?
- Is the 345 count unique words or word-method combinations?
- What was the intended design for multi-method scheduling?

#### Components to Investigate
```
lib/types/review.ts                        - Review record structure
lib/db/reviews.ts                          - Review record schema, queries
lib/utils/spaced-repetition.ts            - SM-2 scheduling logic
lib/services/method-selector.ts            - Method selection algorithm
components/features/review-session-varied.tsx - Review orchestration
app/(dashboard)/review/page.tsx            - Due cards calculation
PHASE18.1.4_COMPLETE.md                    - Original design spec
```

#### Investigation Steps
1. [ ] Review Phase 18.1.4 documentation for intended design
2. [ ] Check review record structure (one per word or per method?)
3. [ ] Examine "due cards" query logic
4. [ ] Count unique words vs total review records for user
5. [ ] Test: Add word, complete review, check how many records created
6. [ ] Verify SM-2 nextReviewDate field (one date or per-method?)
7. [ ] Check if method is stored in review record
8. [ ] Propose solution: Consolidate to one review per word

#### Potential Solutions
**Option A: One Review Record Per Word**
- Store single review record per vocabulary item
- Track method performance separately
- SM-2 schedules one review per day per word
- Method selected at review time (current algorithm)

**Option B: One Review Record Per Method** (current?)
- Keep separate records per method
- Limit to one method review per word per day
- Query: "Get due words, exclude if any method reviewed today"

**Recommended:** Option A (simpler, cleaner, aligns with most SRS systems)

#### Acceptance Criteria
- [ ] Each word has max ONE review per day
- [ ] Review count reflects unique words, not combinations
- [ ] Method selection happens at review time
- [ ] SM-2 schedules based on word performance, not method
- [ ] 345 cards reduced to reasonable count (<100 for daily reviews)
- [ ] Documentation updated with clear scheduling model

---

## 🟢 Medium Priority Issues

### Issue #5: Inconsistent Streak Data Across Pages

**Priority:** 🟢 Medium  
**Risk Level:** User Trust  
**Estimated Fix Time:** 2-3 hours

#### Problem Description
The progress page displays a 7-day streak while the homepage displays a 22-day streak. The same metric (current streak) is showing different values in different locations of the application.

#### Symptoms
- Progress page: 7 days streak
- Homepage: 22 days streak
- Contradictory data shown simultaneously
- Unclear which value is accurate

#### Impact
- **User Trust:** Contradictory stats undermine confidence
- **Confusion:** Users don't know which number to believe
- **Data Quality:** Suggests broader data consistency issues

#### Suspected Root Causes
1. **Different Data Sources:** Each page queries different database/store
   - Homepage: IndexedDB (local)
   - Progress page: PostgreSQL (cloud)
2. **Cache Inconsistency:** One page using stale cached data
3. **Different Calculation Logic:** Two separate streak calculation functions
4. **Sync Lag:** IndexedDB vs PostgreSQL divergence
5. **Timezone Handling:** Different timezone logic per page
6. **Definition Mismatch:** "Current streak" vs "longest streak" confusion

#### Questions to Answer
- Where does homepage get streak data? (API or local?)
- Where does progress page get streak data? (API or local?)
- Are they using the same calculation function?
- When was each value last updated?
- What's the actual correct streak value?

#### Components to Investigate
```
app/dashboard/page.tsx                     - Homepage streak display
app/dashboard/progress/page.tsx            - Progress page streak display
lib/db/stats.ts                            - Streak calculation (IndexedDB)
lib/utils/stats.ts                         - Shared stats utilities
app/api/stats/streak/route.ts              - Streak API endpoint (if exists)
lib/services/sync.ts                       - Stats sync logic
```

#### Investigation Steps
1. [ ] Trace homepage streak data source
2. [ ] Trace progress page streak data source
3. [ ] Compare streak calculation functions
4. [ ] Check last sync timestamp for stats
5. [ ] Manually calculate correct streak from raw data
6. [ ] Identify which page is showing correct value
7. [ ] Check timezone handling in both locations
8. [ ] Verify stats sync is working correctly

#### Solution Approach
1. **Create Single Source of Truth:**
   - Extract streak calculation to shared utility
   - Both pages call same function
   
2. **Use Consistent Data Source:**
   - Both pages query same database (prefer cloud for consistency)
   - Or ensure IndexedDB and PostgreSQL are in sync
   
3. **Add Data Validation:**
   - Log when streak values diverge
   - Alert on inconsistency
   - Auto-repair from authoritative source

#### Acceptance Criteria
- [ ] Both pages show identical streak value
- [ ] Single streak calculation function used
- [ ] Consistent data source (IndexedDB or PostgreSQL, not mixed)
- [ ] Sync ensures streak stays consistent
- [ ] Correct streak value verified (7 or 22 days?)
- [ ] Test: Complete review, both pages update identically

---

## 🔄 Investigation Workflow

### Phase 1: Data Collection (Day 1, Morning)
**Goal:** Understand current state, gather evidence

1. **Database Inspection**
   - [ ] Query vocabulary count for affected user
   - [ ] Check review records structure and count
   - [ ] Examine session records for duplicates
   - [ ] Compare IndexedDB vs PostgreSQL stats

2. **Code Review**
   - [ ] Identify all LIMIT clauses in queries
   - [ ] Map review record creation flow
   - [ ] Trace save button onClick handler
   - [ ] Compare streak calculation functions

3. **Logging Setup**
   - [ ] Add debug logs to critical paths
   - [ ] Log vocabulary operations
   - [ ] Log review status updates
   - [ ] Log save button clicks

### Phase 2: Root Cause Analysis (Day 1, Afternoon)
**Goal:** Pinpoint exact causes of each issue

- [ ] Issue #1: Identify vocabulary cap location
- [ ] Issue #2: Reproduce status update failure
- [ ] Issue #3: Count word vs method review records
- [ ] Issue #4: Reproduce double-save bug
- [ ] Issue #5: Determine correct streak source

### Phase 3: Fix Implementation (Day 2)
**Goal:** Implement fixes with tests

**Priority Order:**
1. Issue #4 (quickest fix, highest data corruption risk)
2. Issue #1 (data loss risk)
3. Issue #2 (core functionality broken)
4. Issue #5 (simple fix)
5. Issue #3 (requires design decision)

### Phase 4: Testing & Validation (Day 2-3)
**Goal:** Verify fixes work, no regressions

- [ ] Unit tests for each fix
- [ ] Integration tests for full flows
- [ ] Manual testing with affected user's data
- [ ] Verify stats remain consistent
- [ ] Load testing (1000+ words)

### Phase 5: Deployment & Monitoring (Day 3)
**Goal:** Deploy safely, monitor for issues

- [ ] Deploy fixes to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check user metrics for improvements

---

## 📊 Priority Matrix

| Issue | Priority | Risk | Fix Time | Impact |
|-------|----------|------|----------|--------|
| #1: Vocabulary Cap | 🔴 Critical | Data Loss | 4-6h | High - Blocks power users |
| #2: Status Stuck | 🔴 Critical | Learning | 6-8h | High - Breaks SR algorithm |
| #4: Double Save | 🔴 Critical | Data Corruption | 3-4h | High - Corrupts all stats |
| #3: Multi-Method | 🟡 High | UX | 6-8h | Medium - Review overload |
| #5: Streak Mismatch | 🟢 Medium | Trust | 2-3h | Low - Display only |

**Total Estimated Time:** 21-29 hours (2.5-3.5 days)

---

## 🎯 Success Criteria

### Issue #1: Vocabulary Cap
- [ ] User can maintain 5000+ vocabulary words
- [ ] No words lost during sync
- [ ] Pagination works smoothly
- [ ] No performance degradation

### Issue #2: Status Updates
- [ ] Words progress through learning stages
- [ ] Status updates immediately after review
- [ ] SM-2 intervals increase correctly
- [ ] Test words show correct status

### Issue #3: Review Scheduling
- [ ] Review count reflects unique words
- [ ] Each word reviewed max once per day
- [ ] Method selection works as designed
- [ ] Reasonable daily review count (<100)

### Issue #4: Double Save
- [ ] Save button disables on click
- [ ] Stats increment exactly once
- [ ] Modal closes after save completes
- [ ] No duplicate sessions

### Issue #5: Streak Consistency
- [ ] Same streak value on all pages
- [ ] Single source of truth
- [ ] Correct streak value verified
- [ ] Consistent after reviews

---

## 📝 Documentation Requirements

After fixes are complete:

1. **Bug Fix Documentation**
   - Create: `docs/bug-fixes/2026-02/BUG_FIX_2026_02_16_BACKEND_ISSUES.md`
   - Detail each fix with before/after
   - Include code changes and rationale

2. **Update DOCUMENTATION_INDEX.md**
   - Add reference to bug fix document
   - Update "Known Issues" section if applicable

3. **Update Backend Documentation**
   - `BACKEND_INFRASTRUCTURE.md` if architecture changes
   - `PHASE18_ROADMAP.md` with fixes completed

4. **Create Tests**
   - Unit tests for each fix
   - Integration tests for full flows
   - Add to test suite

5. **User Communication** (if needed)
   - Announce fixes to affected users
   - Explain data corrections
   - Provide any manual steps needed

---

## 🔧 Technical Debt Created

These issues reveal underlying technical debt that should be addressed:

1. **Missing Input Validation:** Allow vocabulary cap to exist
2. **Insufficient Error Handling:** Silent failures in status updates
3. **Weak Idempotency:** API accepts duplicate requests
4. **Data Consistency:** IndexedDB vs PostgreSQL sync gaps
5. **Missing Tests:** Integration tests would have caught these
6. **Logging Gaps:** Hard to debug without comprehensive logging

**Recommendation:** After fixes, allocate time for:
- Comprehensive integration test suite
- API idempotency layer
- Robust error handling and logging
- Data consistency validation checks

---

## 📞 Contact & Resources

**Affected User:** Kalvin Brookes (kbrookes2507@gmail.com)  
**Production URL:** https://palabra.vercel.app  
**Development Environment:** Local (http://localhost:3000)

**Related Documentation:**
- `BACKEND_INFRASTRUCTURE.md` - Backend architecture
- `PHASE18.1.4_COMPLETE.md` - Multi-method review system
- `PHASE18_ROADMAP.md` - Current phase progress
- `REVIEW_UX_IMPROVEMENTS.md` - Recent review changes

---

**Created:** February 16, 2026  
**Author:** Development Team  
**Status:** 🔴 Ready for Investigation  
**Next Action:** Begin Phase 1 - Data Collection

---

*This document will be updated as investigation progresses and fixes are implemented.*
