# Bug Fix: Gender Incorrectly Assigned to Non-Noun Parts of Speech

**Date:** February 2, 2026  
**Issue:** Verbs and other non-noun parts of speech were being assigned gender (e.g., "comer" showing as "masculine")  
**Status:** ✅ RESOLVED

---

## Problem Description

The gender field was being populated for verbs, adjectives, adverbs, prepositions, and other non-noun parts of speech. In Spanish grammar, **only nouns have grammatical gender** - all other parts of speech should not have gender assigned.

### Examples of Affected Words
- **comer** (verb - to eat) → incorrectly showed **masculine** ❌
- **hablar** (verb - to speak) → incorrectly showed **masculine** ❌
- **rojo** (adjective - red) → incorrectly showed **masculine** ❌
- All other non-noun words ending in consonants or "-o"

---

## Root Cause

The code only excluded **adjectives** from gender assignment but failed to exclude **verbs** and all other non-noun parts of speech:

```typescript
// OLD CODE - Only excluded adjectives
const gender = partOfSpeech === 'adjective' ? undefined : inferGenderFromWord(word);
```

This meant:
- Adjectives → no gender ✓
- Verbs → assigned gender ❌ (e.g., "comer" ends in "r" → masculine)
- Adverbs → assigned gender ❌
- Prepositions → assigned gender ❌
- All other non-nouns → assigned gender ❌

### Debug Evidence

From runtime logs (`debug.log`):

**Before Fix:**
```json
{"word":"comer","partOfSpeech":"verb","gender":"masculine","skippedGender":false}
```
- Verb "comer" → assigned `"masculine"` gender ❌

**After Fix:**
```json
{"word":"beber","partOfSpeech":"verb","assignedGender":false}
{"word":"desprecio","partOfSpeech":"noun","gender":"masculine","assignedGender":true}
```
- Verb "beber" → no gender assigned ✓
- Noun "desprecio" → assigned `"masculine"` gender ✓

---

## Solution

Inverted the logic to **only assign gender when the part of speech is explicitly a noun**:

```typescript
// NEW CODE - Only assign gender to nouns
const gender = partOfSpeech === 'noun' ? inferGenderFromWord(word) : undefined;
```

This ensures:
- ✅ **Nouns** → gender assigned (masculine/feminine)
- ✅ **Verbs** → no gender
- ✅ **Adjectives** → no gender
- ✅ **Adverbs** → no gender
- ✅ **Pronouns** → no gender
- ✅ **Prepositions** → no gender
- ✅ **Conjunctions** → no gender
- ✅ **Interjections** → no gender

### Changes Made

Modified 4 locations in `lib/services/dictionary.ts`:

1. **Line 66** - Fallback 404 path
2. **Line 84** - Wiktionary success path
3. **Line 100** - Error fallback path
4. **Line 433** - `extractGender()` function

All now use the pattern:
```typescript
const gender = partOfSpeech === 'noun' ? /* get gender */ : undefined;
```

---

## Files Modified

- `lib/services/dictionary.ts`
  - `lookupWord()` function (3 locations)
  - `extractGender()` function (1 location)

---

## Testing

### Manual Verification
✅ **comer** (verb) → Gender: — (empty/undefined)  
✅ **hablar** (verb) → Gender: — (empty/undefined)  
✅ **rojo** (adjective) → Gender: — (empty/undefined)  
✅ **casa** (noun) → Gender: Feminine  
✅ **reloj** (noun) → Gender: Masculine  
✅ **desprecio** (noun) → Gender: Masculine

### Log Verification
Multiple verbs tested (beber, tomar, sacar, amar, despreciar):
- All showed `assignedGender: false` ✓
- All had no `gender` field (undefined) ✓

One noun tested (desprecio):
- Showed `assignedGender: true` ✓
- Had `gender: "masculine"` ✓

---

## Impact

This fix ensures grammatical correctness of the vocabulary data:
- **Prevents incorrect gender metadata** for non-nouns
- **Maintains accurate gender assignment** for nouns
- **Improves data quality** and linguistic accuracy
- **Better user experience** with correct default values

---

## Related Fixes

This is the second gender-related fix in this session:
1. **Consonant-ending nouns** (2026-02-02) - Fixed missing masculine gender for words like "reloj"
2. **Non-noun gender assignment** (2026-02-02) - **This fix** - Removed incorrect gender for verbs, adjectives, etc.

---

## Deployment Notes

- **No environment variables required**
- **No database migrations needed**
- **Change is backwards compatible**
- Existing vocabulary entries are not affected (this only impacts new word lookups)

---

**Why This Matters:**

In Spanish (and most Romance languages), grammatical gender is a property **only of nouns**. Verbs, adjectives, adverbs, and other parts of speech do not have inherent gender. While adjectives may change form to agree with the noun they modify (e.g., "rojo" → "roja"), the adjective itself has no fixed gender.

This fix ensures the app correctly represents Spanish grammatical rules.
