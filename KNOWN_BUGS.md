# Known Bugs & Issues

**Last Updated:** 2026-02-08

This document tracks known bugs, issues, and inconsistencies that require future attention.

---

## 🐛 Active Bugs

### 1. Inconsistent Hover Transition Behavior (Priority: Low, UX Polish)

**Status:** ✅ RESOLVED  
**Reported:** 2026-02-08  
**Resolved:** 2026-02-09
**Severity:** Low (UX polish issue, not functional)

#### Description
Hover transitions on interactive buttons are inconsistent across the application. The "Start Review" button and "Add New Word" card have instant "jumping" animations on hover, while insight cards transition smoothly.

#### Expected Behavior
All interactive cards and buttons should smoothly scale up over 300ms when hovered, with a gentle ease-out curve - matching the behavior of insight cards.

#### Current Behavior
- ✅ **Insight Cards**: Smooth 300ms transition (working correctly)
- ❌ **Start Review Button** (Activity Ring): Instant jump to scaled state
- ❌ **Add New Word Card**: Instant jump to scaled state

#### Technical Details

**Working Component (Insight Cards):**
```tsx
// components/features/insight-card.tsx
className="transform hover:scale-[1.02] transition-all duration-300"
```

**Non-Working Components:**
```tsx
// components/features/activity-ring.tsx (Start Review button)
className="transform hover:scale-105 active:scale-95 transition-all duration-300"

// components/ui/action-card.tsx (Add New Word card)
className="transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
```

**Browser Inspection Results:**
When inspecting the Start Review button in DevTools:
- `transition-duration: 0.3s` ✅ (correct)
- `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` ❌ (default, not ease-out)
- `transition-property: opacity` ❌ (should be transform, box-shadow)

**Root Cause:**
The Tailwind classes are being compiled, but something in the CSS cascade or specificity is preventing the transition from applying to the `transform` property. Multiple approaches were attempted:
1. `transition-transform transition-shadow` - Only last property applied
2. `transition-[transform,box-shadow]` - Arbitrary values broke all transitions
3. `transition duration-300 ease-out` - Still jumping
4. `transition-all duration-300` - Matching insights exactly, still jumping

#### Attempted Fixes
1. ✅ Verified dev server was running and compiling changes
2. ✅ Hard browser refresh to clear cache (Cmd+Shift+R)
3. ✅ Used `transition-all` to transition all properties
4. ✅ Removed `ease-out` to match working components exactly
5. ✅ Verified no linter errors
6. ✅ Checked compiled CSS in browser DevTools
7. ❌ Transitions still jumping despite identical syntax to working components

#### Files Affected
- `components/features/activity-ring.tsx` (ActivityRingWithCTA component)
- `components/ui/action-card.tsx` (ActionCard component)
- `components/features/insight-card.tsx` (Working correctly as reference)

#### Steps to Reproduce
1. Navigate to `http://localhost:3000` (dashboard homepage)
2. Hover over the circular "Start Review" button (inside activity ring)
3. Hover over the "Add New Word" blue card
4. Observe instant "jump" instead of smooth scale transition
5. Compare with insights cards lower on page (these work correctly)

#### Workaround
None currently. The buttons are fully functional, just lack smooth animation polish.

#### Resolution (2026-02-09)

**Root Cause #1 - Animation Conflict:**
The `animate-pulse-subtle` animation in `app/globals.css` (lines 508-521) was continuously animating the `transform` property on the circular "Start Review" button. This conflicted with the hover `transform: scale()` transition, causing instant jumps instead of smooth animations.

**Fix #1:**
Modified `animate-pulse-subtle` to only animate `box-shadow` (glow effect), removing `transform: scale()` from the keyframes:
```css
@keyframes pulse-subtle {
  0%, 100% {
    box-shadow: 0 10px 40px -12px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 12px 48px -12px rgba(102, 126, 234, 0.5);
  }
}
```

**Root Cause #2 - Global CSS Override:**
The global `a` tag rule in `app/globals.css` (line 166) set `transition: color var(--transition-fast)`, which overrode the `transition-all` Tailwind classes on ActionCard components (which use `<Link>` components that render as `<a>` tags).

**Fix #2:**
Modified the selector to only apply to links without custom transition classes:
```css
a:not([class*="transition"]) {
  text-decoration: none;
  transition: color var(--transition-fast);
}
```

**Result:**
All buttons now have smooth, Apple-like 300ms transitions matching the insight cards. The hover behavior scales smoothly with proper easing.

#### Related Screenshots
Evidence saved in `/assets/` folder:
- `Screenshot_2026-02-08_at_23.00.25` - Start Review button DevTools (transition properties)
- `Screenshot_2026-02-08_at_23.00.57` - Add New Word button DevTools (transition properties)

---

## 📋 Tracking Information

### Bug Priority Levels
- **Critical**: Breaks core functionality, immediate fix required
- **High**: Significant UX impact, fix in next sprint
- **Medium**: Noticeable but workaround exists
- **Low**: Polish issue, fix when convenient

### Status Definitions
- **Unresolved**: Known issue, no fix implemented
- **In Progress**: Actively being worked on
- **Resolved**: Fix implemented and deployed
- **Wontfix**: Issue documented but not planned for resolution

---

## 📝 Notes for Developers

When encountering new bugs:
1. Add to this document immediately with full details
2. Include reproduction steps
3. Document all attempted fixes (even failed ones)
4. Include browser/environment information
5. Add screenshots or error logs if available
6. Link to related GitHub issues or PRs

This document serves as institutional knowledge to prevent duplicate debugging efforts.
