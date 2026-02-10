# Bug Fix: Review Quiz Ignoring Direction Setting

**Date**: February 9, 2026  
**Reported By**: User  
**Severity**: Medium  
**Status**: 🔍 Investigating

---

## 🐛 Bug Description

The review quiz appears to always operate in ES→EN (Spanish to English) direction, regardless of the user's direction selection in the "Configure Study Session" menu.

### Expected Behavior

When a user selects:
- **ES → EN**: Show Spanish word, expect English translation
- **EN → ES**: Show English word, expect Spanish translation  
- **Mixed**: Randomly alternate between both directions per card

### Actual Behavior

The quiz always shows Spanish word and expects English translation (ES→EN), even when EN→ES or Mixed is selected in configuration.

---

## 📊 User Impact

- **Affected Users**: Any user attempting to practice English→Spanish (productive recall)
- **Workaround**: None currently available
- **Severity Justification**: Medium - Blocks a core feature (bidirectional practice) but doesn't break the app

---

## 🔍 Investigation Findings

### Code Analysis

**Configuration Saving** ✅ WORKING
- `session-config.tsx` lines 43, 134-145: Direction is correctly saved to config
- `use-review-preferences.ts`: Direction persists to localStorage

**Configuration Passing** ✅ WORKING  
- `review/page.tsx`: Config is passed to `ReviewSessionVaried` component
- `review-session-varied.tsx` line 75-77: Direction is read from config

**Direction Application** ✅ WORKING (in code)
- `review-session-varied.tsx` lines 453, 465, 478, 500: Direction is passed to all review methods
- All review method components accept and use `direction` prop

**Potential Issues** 🔍 Need Testing:

1. **Audio Recognition Exception**: `AudioRecognitionReview` doesn't receive direction prop (line 490) - this is intentional as audio is always Spanish listening comprehension

2. **Mixed Mode Logic**: Lines 150-155 randomize direction for each card in mixed mode - verify this is working

3. **Default Config Override**: `DEFAULT_SESSION_CONFIG` sets `direction: 'spanish-to-english'` - could be overriding user selection if preferences aren't loading properly

---

## 🧪 Reproduction Steps

1. Navigate to Review page
2. Click "Configure & Start Session"
3. Select **EN → ES** (English to Spanish)
4. Click "Start Session"
5. **Expected**: First card shows English word, expects Spanish answer
6. **Actual**: First card shows Spanish word, expects English answer (ES→EN)

---

## 🔬 Testing Checklist

To diagnose the exact issue:

- [ ] **Test 1**: Add console.log in `review-session-varied.tsx` line 76 to verify config.direction value
- [ ] **Test 2**: Add console.log in each review method component to verify received direction prop
- [ ] **Test 3**: Check localStorage in browser DevTools for saved preferences
- [ ] **Test 4**: Test all three directions (ES→EN, EN→ES, Mixed)
- [ ] **Test 5**: Test across all 5 review methods (Traditional, Fill-Blank, Multiple Choice, Audio, Context Selection)
- [ ] **Test 6**: Verify Mixed mode randomizes correctly

---

## 🛠️ Proposed Solution

### Option A: Fix Preferences Loading (if that's the issue)

```typescript
// In review/page.tsx, add logging to verify preferences loading:
console.log('[Review Page] Loaded preferences:', preferences);
console.log('[Review Page] Session config:', sessionConfig);
```

### Option B: Add Visual Direction Indicator

While fixing the bug, also improve UX by adding a direction indicator in the session header:

```tsx
{/* In review-session-varied.tsx header section */}
<div className="flex items-center gap-2 text-sm text-text-secondary">
  <span className="hidden sm:inline">
    {currentDirection === 'spanish-to-english' ? 'ES → EN' : 'EN → ES'}
  </span>
  <span className="font-semibold text-accent">
    {results.length + 1} / {processedWords.length}
  </span>
</div>
```

### Option C: Add Quick Direction Toggle

For power users, add a quick toggle button in the main review screen (not just config):

```tsx
{/* Quick direction switcher (outside session) */}
<button 
  onClick={() => {/* toggle direction */}}
  className="..."
>
  🔄 {direction === 'spanish-to-english' ? 'ES→EN' : 'EN→ES'}
</button>
```

---

## 📝 Related Issues

- Phase 8 introduced bidirectional flashcards (documented as working)
- Phase 18.1.4 implemented varied review methods (should respect direction)
- `PHASE8_DIRECTIONAL_ACCURACY.md` documents direction-aware accuracy tracking

---

## ✅ Acceptance Criteria for Fix

- [ ] EN→ES direction shows English word first
- [ ] Mixed mode randomizes direction per card
- [ ] Direction preference persists across sessions
- [ ] All 5 review methods respect direction setting
- [ ] Visual indicator shows current direction during session
- [ ] User can see/change direction without navigating away from review page

---

## 📚 Documentation Updates Needed

- [ ] Update Phase 18 task completion docs if direction wasn't tested
- [ ] Add direction indicators to review flow screenshots
- [ ] Document direction behavior for each review method (especially Audio)

---

## 🔗 Related Files

- `components/features/review-session-varied.tsx` - Main session orchestrator
- `components/features/session-config.tsx` - Configuration UI
- `lib/hooks/use-review-preferences.ts` - Preference persistence
- `lib/types/review.ts` - DEFAULT_SESSION_CONFIG
- `components/features/review-methods/*.tsx` - All 5 review methods

---

**Next Steps:**
1. Run reproduction steps with console logging
2. Identify root cause (preferences loading? config passing? component logic?)
3. Implement fix
4. Add automated tests to prevent regression
5. Consider UX improvements (visual indicator, quick toggle)
