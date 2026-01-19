# Bug Reports

This document tracks all bugs identified and resolved across development sessions.

---

# Session: PWA Caching & Data Sync Issues

## Session Date: January 19-20, 2026

This document tracks all bugs identified and resolved during the PWA caching, deployment updates, and multi-device synchronization session.

---

## Bug #1: Deployments Not Reflected Until Hard Refresh

**Status**: ✅ RESOLVED

**Reported**: 2026-01-19  
**Fixed**: 2026-01-20

### Description
Changes deployed to Vercel were not visible on the mobile/desktop PWA app until Chrome was hard refreshed. Users had to manually clear cache or hard refresh to see new features like the recall typing review mode.

### Root Cause
Service worker was using `staleWhileRevalidate` strategy for HTML pages, serving cached HTML even when new deployment was available. Cache version was static (`v2`), not invalidating on new deployments.

### Solution
1. Changed HTML page strategy from `staleWhileRevalidate` to `networkFirstStrategy` - always fetch latest HTML from network first
2. Updated `CACHE_VERSION` to `v3-20260119` with date-based versioning for cache busting
3. Implemented aggressive cache deletion in `activate` event - delete ALL old cache versions
4. Added client notification system - SW sends `SW_UPDATED` message to all clients after activation
5. Implemented auto-reload in `pwa.ts` - when new SW detected, automatically reload page after 1 second

### Code Changes
**Files Modified:**
- `public/sw.js`: Changed HTML fetch strategy, updated cache version, added client notifications
- `palabra/lib/utils/pwa.ts`: Added auto-reload on SW update, added message listener for `SW_UPDATED`

### Verification
**Hypothesis ID**: H1, H5  
**Debug Logs**: Confirmed SW cache version change, network-first strategy, and auto-reload trigger

---

## Bug #2: Vocabulary Sync Discrepancies Between Devices

**Status**: ✅ RESOLVED

**Reported**: 2026-01-19  
**Fixed**: 2026-01-20

### Description
Vocabulary word counts showed discrepancies between mobile PWA and website. For example, mobile showed 13 words in "learning" section while website showed 10. After syncing, counts did not update in UI until manual page refresh.

### Root Cause
The `CloudSyncService` performed bidirectional sync between IndexedDB and backend, but did not invalidate React Query cache after completion. UI continued showing stale data from cached queries even though IndexedDB was updated.

### Solution
1. Modified `CloudSyncService` to accept a `QueryClient` instance via `setQueryClient()` method
2. After successful sync, explicitly call `queryClient.invalidateQueries(['vocabulary'])` and `queryClient.invalidateQueries(['vocabulary', 'stats'])`
3. Registered `QueryClient` with sync service in `QueryProvider` component during initialization
4. Added instrumentation to verify cache invalidation is called with `hasQueryClient: true`

### Code Changes
**Files Modified:**
- `palabra/lib/services/sync.ts`: Added `QueryClient` field, `setQueryClient()` method, cache invalidation after sync
- `palabra/lib/providers/query-provider.tsx`: Register QueryClient with sync service on mount

### Verification
**Hypothesis ID**: H2  
**Debug Logs**: Confirmed `"Sync complete - invalidating query cache"` with `hasQueryClient: true`

---

## Bug #3: "Words Added Today" Stat Inaccurate Across Devices

**Status**: ✅ RESOLVED

**Reported**: 2026-01-19  
**Fixed**: 2026-01-20

### Description
The "Words added today" statistic showed incorrect counts (e.g., 6 words when ~20 were actually added yesterday). Count was inconsistent between devices and did not reflect words added on other devices after sync.

### Root Cause
The `newWordsAdded` stat was only incremented when words were added *locally* on a device. When words created on another device were synced in via `CloudSyncService`, the counter was not updated. This meant each device only counted words added directly on that device, not the true total for the day.

### Solution
1. Created new function `getActualNewWordsAddedToday()` in `stats.ts` that calculates the count by filtering all vocabulary words where `createdAt` matches today's date
2. Modified Home page (`page.tsx`) and Progress page (`progress/page.tsx`) to call this function and use the actual count instead of the stored counter
3. Added console log `"Stats correction: stored=X, actual=Y"` to show the difference and verify the fix

### Code Changes
**Files Modified:**
- `palabra/lib/db/stats.ts`: Added `getActualNewWordsAddedToday()` function
- `palabra/app/(dashboard)/page.tsx`: Use actual count from `getActualNewWordsAddedToday()`
- `palabra/app/(dashboard)/progress/page.tsx`: Use actual count from `getActualNewWordsAddedToday()`

### Verification
**Hypothesis ID**: H6_stats  
**Debug Logs**: Confirmed `"Calculated actual words added today from vocabulary"` with correct count and sample words showing `createdAt` timestamps

---

## Bug #4: No Manual Refresh Mechanism for Mobile PWA

**Status**: ✅ RESOLVED

**Reported**: 2026-01-19  
**Fixed**: 2026-01-20

### Description
Users had no way to manually trigger a refresh to sync data or clear caches on mobile PWA. Standard pull-to-refresh gesture was not implemented.

### Root Cause
No pull-to-refresh functionality implemented in the PWA. Users relied on automatic sync which may not happen immediately, or had to close and reopen the app.

### Solution
1. Created new custom hook `usePullToRefresh` in `palabra/lib/hooks/use-pull-to-refresh.ts`
2. Hook detects touch gestures (touchstart, touchmove, touchend) when user pulls down from top
3. On pull-to-refresh trigger:
   - Runs `CloudSyncService.sync('incremental')` to fetch latest data
   - Calls `queryClient.invalidateQueries()` to refresh all UI data
   - Sends `FORCE_REFRESH` message to service worker to clear caches
4. Integrated hook in Home and Progress pages with visual "Refreshing..." indicator
5. Service worker handles `FORCE_REFRESH` message by clearing all caches and notifying client

### Code Changes
**Files Modified:**
- `palabra/lib/hooks/use-pull-to-refresh.ts`: New file - custom pull-to-refresh hook
- `palabra/app/(dashboard)/page.tsx`: Integrated `usePullToRefresh` hook with visual indicator
- `palabra/app/(dashboard)/progress/page.tsx`: Integrated `usePullToRefresh` hook with visual indicator
- `public/sw.js`: Added `FORCE_REFRESH` message handler to clear caches

### Verification
**Hypothesis ID**: H3  
**Testing**: Pull-down gesture on mobile triggers sync, cache clear, and UI refresh

---

## Summary Statistics

**Total Bugs Reported**: 4  
**Total Bugs Resolved**: 4  
**Resolution Rate**: 100%

### Bug Categories
- **PWA/Caching Issues**: 1 (Bug #1)
- **Data Sync Issues**: 2 (Bugs #2, #3)
- **UX/Mobile Features**: 1 (Bug #4)

### Files Modified
1. `public/sw.js` - Service worker caching strategies and cache invalidation
2. `palabra/lib/utils/pwa.ts` - Auto-reload on SW update, client-side PWA utilities
3. `palabra/lib/services/sync.ts` - Query cache invalidation after sync
4. `palabra/lib/providers/query-provider.tsx` - QueryClient registration with sync service
5. `palabra/lib/db/stats.ts` - Accurate daily stats calculation from timestamps
6. `palabra/app/(dashboard)/page.tsx` - Stats correction and pull-to-refresh
7. `palabra/app/(dashboard)/progress/page.tsx` - Stats correction and pull-to-refresh
8. `palabra/lib/hooks/use-pull-to-refresh.ts` - New custom hook for pull-to-refresh

---

## Testing Notes

All bugs were verified fixed through:
1. Runtime debug logging with NDJSON format to `.cursor/debug.log`
2. Hypotheses-driven debugging with instrumentation
3. User confirmation after each fix with log analysis
4. Multi-device testing (localhost on laptop, verification flow for mobile PWA)

### Debug Hypotheses
- **H1**: HTML pages cached aggressively by service worker
- **H2**: Sync service not invalidating React Query cache
- **H3**: No pull-to-refresh mechanism
- **H4**: refetchOnWindowFocus not triggering in PWA context
- **H5**: Service worker update mechanism not auto-reloading
- **H6_stats**: Daily stats counter only increments for local additions

---

## Lessons Learned

1. **Service Worker Strategies**: Use `networkFirstStrategy` for HTML pages to ensure deployments are immediately visible
2. **Cache Invalidation**: After any data sync operation, explicitly invalidate all affected query caches
3. **Cross-Device Stats**: For statistics that aggregate data across devices, calculate from source data (timestamps) rather than maintaining separate counters
4. **PWA UX**: Implement pull-to-refresh for mobile PWAs to give users manual control over data sync
5. **Auto-Updates**: PWA service workers should auto-reload the app on update for seamless deployment experience

---

*Last Updated: January 20, 2026*

---

# Session: Listening Review Mode

## Session Date: January 19, 2026

This document tracks all bugs identified and resolved during the listening review mode refinement session.

---

## Bug #1: Auto-advance too fast after incorrect answers

**Status**: ✅ RESOLVED

**Reported**: Initial request  
**Fixed**: Session start

### Description
When a user entered an incorrect word, the corrected version appeared but the review toggled to the next vocab word too quickly (4.5s delay), preventing user reflection.

### Root Cause
Fixed timeout delay was insufficient for users to process their mistakes.

### Solution
Removed automatic advancement entirely. Implemented user-controlled progression via:
- On-screen "Continue →" button
- Enter key press

### Code Changes
- `flashcard-enhanced.tsx`: Added `onContinue` prop and manual continue button
- `review-session-enhanced.tsx`: Implemented `handleContinue` callback
- `review/page.tsx`: Removed `setTimeout` for auto-advancement

---

## Bug #2: No auto-play on new vocabulary cards

**Status**: ✅ RESOLVED

**Reported**: Initial request  
**Fixed**: Session start

### Description
When a new vocabulary card opened, the voice-over did not play automatically. Users had to click the speaker icon first.

### Root Cause
No automatic audio playback logic in listening mode when card appeared.

### Solution
Added `useEffect` hook to trigger audio playback when new card appears in listening mode, with proper voice loading handling.

### Code Changes
- `flashcard-enhanced.tsx`: Added auto-play effect with dependency on `[word.id, mode]`
- Implemented voice loading wait logic to handle first card properly
- Added cleanup function to prevent double playback

---

## Bug #3: Mechanical voice quality

**Status**: ✅ RESOLVED

**Reported**: Initial request  
**Fixed**: Session start

### Description
The TTS voice used for word playback was too mechanical and difficult to understand.

### Root Cause
Browser was using default/first available voice without prioritizing higher-quality options.

### Solution
Implemented intelligent voice selection that prioritizes higher-quality Spanish TTS voices based on name patterns and adjusted playback rate for clarity.

### Code Changes
- `audio.ts`: Added `selectBestSpanishVoice()` function
- Prioritization order: Google > Microsoft/Edge > Apple voices
- Adjusted `utterance.rate` from 0.9 to 0.85 for clearer pronunciation

---

## Bug #4: Insufficient spelling tolerance

**Status**: ✅ RESOLVED

**Reported**: Initial request  
**Fixed**: Session mid-point

### Description
The spelling checker was too strict in listening mode, marking very similar spellings as incorrect (e.g., "dispersado" marked wrong when correct).

### Root Cause
Similarity thresholds were too high for listening mode (0.85/0.95 correct, 0.70 close).

### Solution
Lowered similarity thresholds specifically for listening mode:
- `CORRECT_THRESHOLD`: 0.95 → 0.70
- `CLOSE_THRESHOLD`: 0.70 → 0.55
- Made articles optional in listening mode

### Code Changes
- `answer-checker.ts`: Modified `checkAnswer()` and `checkSpanishAnswer()` to accept `isListeningMode` parameter
- Adjusted thresholds conditionally based on mode
- `flashcard-enhanced.tsx`: Pass `isListeningMode` flag to answer checking functions

---

## Bug #5: Exact correct answers marked as incorrect

**Status**: ✅ RESOLVED

**Reported**: Mid-session  
**Fixed**: Mid-session

### Description
When typing the exact Spanish word shown in the answer, it was still classified as incorrect in listening mode.

### Root Cause
The answer checking logic was comparing the Spanish user input against the English translation instead of the Spanish word. The `direction` check was not accounting for listening mode, where users always hear and type Spanish regardless of direction setting.

### Solution
Modified `handleSubmitAnswer` to explicitly check Spanish input against Spanish word when in listening mode.

### Code Changes
```typescript
// In listening mode, user always hears and types Spanish
if (isListeningMode) {
  result = checkSpanishAnswer(userAnswer, word.spanishWord, isListeningMode);
}
```

---

## Bug #6: Voice plays twice on first card

**Status**: ✅ RESOLVED

**Reported**: Mid-session  
**Fixed**: Late session

### Description
On the first card of a listening review session, the audio would play twice in rapid succession.

### Root Cause
The auto-play `useEffect` was running multiple times due to unstable dependencies in the dependency array:
- `word.spanishWord` (string value, unstable reference)
- `onAudioPlay` (function, unstable reference)

These caused re-renders which triggered the effect multiple times.

### Solution
Reduced dependency array to only stable primitives: `[word.id, mode]`
- Added `cancelled` flag in cleanup to prevent race conditions
- Added `speechSynthesis.cancel()` in cleanup to stop ongoing speech

### Code Changes
- `flashcard-enhanced.tsx`: Modified auto-play effect dependency array
- Added `// eslint-disable-next-line react-hooks/exhaustive-deps` comment
- Implemented cancellation token pattern

---

## Bug #7: Second Enter press not triggering next card

**Status**: ✅ RESOLVED

**Reported**: Mid-session  
**Fixed**: Late session

### Description
After submitting an answer with Enter, pressing Enter again did not advance to the next card as expected.

### Root Cause
The input field was disabled after answer submission, causing it to lose focus. Keyboard events had nowhere to go, so the Enter key press was not being captured.

The container had `tabIndex={-1}` which prevented it from receiving keyboard focus.

### Solution
1. Changed container `tabIndex` from `-1` to `0` (allows keyboard focus)
2. Added `ref={containerRef}` to container div
3. Added `style={{ outline: 'none' }}` to prevent focus ring
4. After answer submission, programmatically focus the container with `containerRef.current.focus()`

### Code Changes
- `flashcard-enhanced.tsx`: 
  - Added `containerRef` useRef
  - Modified listening and recall mode containers to use `tabIndex={0}`
  - Added focus logic in `handleSubmitAnswer()`

---

## Bug #8: Layout shift from feedback box

**Status**: ✅ RESOLVED

**Reported**: Mid-session  
**Fixed**: Mid-session

### Description
When a correct answer was submitted, a green "Perfect!" feedback box appeared below the input, causing the layout to shift.

### Root Cause
The feedback box was only rendered conditionally for correct answers, changing the height of the content area.

### Solution
Hide the explicit feedback box for correct answers, retaining only the checkmark icon within the input field. The "Continue" button now occupies that space consistently.

### Code Changes
- `flashcard-enhanced.tsx`: Modified rendering logic to only show detailed feedback for incorrect answers

---

## Bug #9: Runtime TypeError with JSON.stringify

**Status**: ✅ RESOLVED

**Reported**: Late session  
**Fixed**: Late session

### Description
Runtime error: "Converting circular structure to JSON" when logging keyboard events.

### Root Cause
Debug logging attempted to serialize `e.target` (a DOM element) which contains circular references.

### Solution
Changed logging from `e.target` to `e.target.tagName` (string value only).

### Code Changes
- `flashcard-enhanced.tsx`: Modified debug log data structure in `onKeyDown` handler

---

## Bug #10: Infinite audio loop

**Status**: ✅ RESOLVED

**Reported**: Late session  
**Fixed**: Late session

### Description
Audio played on repeat endlessly and did not stop even when cycling to the next card.

### Root Cause
Same as Bug #6 - unstable dependencies (`word.spanishWord`, `onAudioPlay`) in the auto-play effect's dependency array caused infinite re-renders.

### Solution
Same fix as Bug #6 - reduced dependency array to `[word.id, mode]`.

### Code Changes
- Same as Bug #6

---

## Summary Statistics

**Total Bugs Reported**: 10  
**Total Bugs Resolved**: 10  
**Resolution Rate**: 100%

### Bug Categories
- **UX/Timing Issues**: 2 (Bugs #1, #2)
- **Audio Quality**: 1 (Bug #3)
- **Logic Errors**: 2 (Bugs #4, #5)
- **React Lifecycle Issues**: 3 (Bugs #6, #7, #10)
- **UI/Layout Issues**: 1 (Bug #8)
- **Runtime Errors**: 1 (Bug #9)

### Files Modified
1. `palabra/components/features/flashcard-enhanced.tsx` - Primary component with most fixes
2. `palabra/components/features/review-session-enhanced.tsx` - Manual continuation logic
3. `palabra/app/(dashboard)/review/page.tsx` - Removed auto-advance timer
4. `palabra/lib/services/audio.ts` - Voice selection improvements
5. `palabra/lib/utils/answer-checker.ts` - Spelling tolerance adjustments

---

## Testing Notes

All bugs were verified fixed through:
1. Runtime debug logging with NDJSON format
2. User confirmation after each fix
3. Multiple card progression cycles (3-5 cards per test)
4. Browser console monitoring

---

## Lessons Learned

1. **React Dependencies**: Always use stable primitives in dependency arrays. Avoid functions and objects unless memoized.
2. **Focus Management**: Disabled inputs cannot receive keyboard events. Use container-level focus management.
3. **Audio APIs**: Browser TTS voices may not load immediately. Implement proper loading detection.
4. **User Testing**: Fixed delays are insufficient - user-controlled progression is superior for learning applications.
5. **Debug Mode**: Runtime logging is essential for diagnosing React lifecycle and async issues.

---

*Last Updated: January 19, 2026*
