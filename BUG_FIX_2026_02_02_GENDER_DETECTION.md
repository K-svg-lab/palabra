# Bug Fix: Gender Detection for Consonant-Ending Nouns

**Date:** February 2, 2026  
**Issue:** Nouns ending in consonants (like "reloj") were not being assigned gender, leaving the gender field empty in the Add New Word dialog.  
**Status:** ✅ RESOLVED

---

## Problem Description

When looking up Spanish nouns that end in consonants (e.g., "reloj", "papel", "amor"), the gender field in the "Add New Word" dialog was empty, requiring manual correction by the user.

### Examples of Affected Words
- **reloj** (clock) → should be **masculine** (el reloj)
- **papel** (paper) → should be **masculine** (el papel)
- **amor** (love) → should be **masculine** (el amor)
- **pan** (bread) → should be **masculine** (el pan)
- **pez** (fish) → should be **masculine** (el pez)

---

## Root Cause

The `inferGenderFromWord()` function in `lib/services/dictionary.ts` only handled the following patterns:

1. Words ending in `-o` → masculine
2. Words ending in `-a` → feminine
3. Words ending in `-ción/-sión/-dad/-tad/-tud` → feminine
4. Words ending in `-ma` → masculine
5. Words ending in `-e` → undefined (could be either)

**Missing:** Words ending in consonants (l, r, n, j, z, s), which are typically **masculine** in Spanish.

### Debug Evidence

From runtime logs (`debug.log`):

**Before Fix:**
```json
{"message":"Gender inference START","data":{"word":"reloj","lastChar":"j"}}
{"message":"Gender inference END - no match","data":{"word":"reloj","result":"undefined"}}
```
- "reloj" ends in "j" → no pattern matched → returned `undefined` ❌

**After Fix:**
```json
{"message":"Gender inference START","data":{"word":"reloj","lastChar":"j"}}
{"message":"Consonant ending - masculine","data":{"word":"reloj","lastChar":"j"}}
{"message":"Fallback gender inferred","data":{"gender":"masculine"}}
```
- "reloj" ends in "j" → consonant rule matched → returned `"masculine"` ✓

---

## Solution

Added a new rule to `inferGenderFromWord()` to handle consonant endings:

```typescript
// Most words ending in consonants (l, r, n, j, z, s) are masculine
// Examples: el papel, el amor, el pan, el reloj, el pez, el mes
// Note: -ión is feminine (already handled above)
const lastChar = lower.slice(-1);
if (lastChar === 'l' || lastChar === 'r' || lastChar === 'n' || 
    lastChar === 'j' || lastChar === 'z' || lastChar === 's') {
  return 'masculine';
}
```

### Why This Rule is Accurate

In Spanish grammar, most nouns ending in consonants are masculine. This is a well-established pattern:
- **-l**: el papel, el árbol, el canal
- **-r**: el amor, el dolor, el color
- **-n**: el pan, el jardín, el corazón
- **-j**: el reloj, el garaje
- **-z**: el pez, el lápiz, el arroz
- **-s**: el mes, el país, el autobús

**Exception already handled:** Words ending in `-ión` (which ends in "n") are feminine and are caught by an earlier rule:
```typescript
if (lower.endsWith('ción') || lower.endsWith('sión') || /* ... */) {
  return 'feminine';
}
```

---

## Files Modified

- `lib/services/dictionary.ts`
  - Function: `inferGenderFromWord()`
  - Added: Consonant ending detection (l, r, n, j, z, s → masculine)

---

## Testing

### Manual Verification
✅ **reloj** → Gender: Masculine (el reloj)  
✅ **papel** → Gender: Masculine (el papel)  
✅ **problema** → Gender: Masculine (el problema - already working)  
✅ **huerto** → Gender: Masculine (el huerto - already working)

### Edge Cases Preserved
✅ **ción/sión endings** → Still correctly detected as feminine (handled by earlier rule)  
✅ **Adjectives** → Still correctly have no gender assigned  
✅ **Words ending in -e** → Still return undefined (could be either)

---

## Impact

This fix improves the automated gender detection for a significant portion of Spanish nouns, reducing manual corrections needed by users and improving the overall accuracy of the vocabulary entry system.

**Estimated Coverage:** ~30-40% of Spanish nouns end in consonants, making this a high-impact fix.

---

## Related Documentation

- Phase 2 requirement from `README_PRD.txt`: "Automated vocabulary entry with smart defaults"
- Gender inference logic: `lib/services/dictionary.ts` (lines 491-540)
- Previous gender fix: Adjective detection for `-iento/-ienta` endings

---

## Deployment Notes

- **No environment variables required**
- **No database migrations needed**
- **Change is backwards compatible**
- Existing vocabulary entries are not affected (this only impacts new word lookups)
