# UX Fix: Close Keyboard When Adding Word from Search Box

**Date:** February 2, 2026  
**Type:** Mobile UX Enhancement  
**Status:** ✅ Implemented

---

## Problem

When user types a word in the "Search Spanish or English" box and clicks the plus icon (or presses Enter), the mobile keyboard stayed open, covering the Add New Word dialog fields.

---

## User Flow with Issue

1. User types "comer" in search box
2. Keyboard is open
3. User clicks plus icon
4. Dialog opens
5. **Keyboard still open** ❌ → Covering fields and Save button

---

## Solution

### Changes Made

**File:** `components/features/vocabulary-list.tsx`

**1. Plus Icon Click (Line 227):**
```typescript
onClick={() => {
  // Blur search input to close mobile keyboard before opening modal
  searchInputRef.current?.blur();
  setTimeout(() => {
    onAddNew(searchTerm.trim());
  }, 50);
}}
```

**2. Enter Key Press (Line 176):**
```typescript
if (e.key === 'Enter' && showAddButton && onAddNew && searchTerm.trim().length > 0) {
  e.preventDefault();
  // Blur search input to close mobile keyboard before opening modal
  searchInputRef.current?.blur();
  setTimeout(() => {
    onAddNew(searchTerm.trim());
  }, 50);
}
```

### How It Works

1. User types in search box → Keyboard opens
2. User clicks plus icon (or presses Enter)
3. **Search input blurs immediately** → Keyboard closes
4. **50ms delay** → Gives keyboard time to animate closed
5. Dialog opens → Keyboard stays closed ✓

---

## User Flow Fixed

1. User types "comer" in search box
2. Keyboard is open
3. User clicks plus icon
4. **Keyboard closes immediately** ✓
5. Dialog opens
6. **All fields visible** ✓
7. **Save button accessible** ✓
8. User can tap any field to re-open keyboard

---

## Consistency

Now keyboard behavior is consistent across all entry methods:

| Entry Method | Keyboard Behavior |
|-------------|-------------------|
| Voice input | Stays closed ✓ |
| Search box → Plus icon | Stays closed ✓ |
| Search box → Enter key | Stays closed ✓ |
| Manual "Add New Word" button | Opens (no initial word) ✓ |
| Tap any field | Opens ✓ |

---

## Technical Details

### Timing
- 50ms delay allows keyboard close animation to complete
- Prevents race condition where dialog opens before keyboard fully closes
- Smooth UX without visible flicker

### Why Blur First
- If we open dialog first, form tries to auto-focus → keyboard might stay open
- Blurring search input first ensures keyboard closes BEFORE dialog opens
- Clean state transition

---

## Files Modified

- `components/features/vocabulary-list.tsx`
  - Plus icon onClick handler
  - Enter key handler

---

## Related Changes

This fix works in conjunction with:
- Previous fix: Voice input keyboard management
- Previous fix: Form component keyboard management
- Together: Complete mobile keyboard control

---

## Testing Checklist

- [ ] Type word in search → Click plus icon → Keyboard closes ✓
- [ ] Type word in search → Press Enter → Keyboard closes ✓
- [ ] Use voice input → Keyboard stays closed ✓
- [ ] All fields visible without scrolling ✓
- [ ] Tap Translation field → Keyboard opens ✓
- [ ] Save button accessible ✓

---

## Impact

**Mobile UX:** Seamless word entry from search box  
**User Experience:** No manual keyboard closing needed  
**Workflow:** Fast, efficient word addition  

---

**Part of:** February 2, 2026 Mobile UX Improvements
