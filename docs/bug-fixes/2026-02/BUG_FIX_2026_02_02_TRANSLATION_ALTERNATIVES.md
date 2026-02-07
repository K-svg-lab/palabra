# Bug Fix: Translation Alternative Quality Improvements
**Date:** February 2, 2026  
**Status:** ✅ Complete

## Issues Fixed

### 1. Example Sentence Not Updating on Second Lookup
**Problem:** When performing a second lookup in the Add New Word dialog without closing it, the example sentence fields were not updating with new data, even though all other fields (translation, gender, part of speech) refreshed correctly.

**Root Cause:** The `handleLookup()` function was calling `setValue()` to update translation/gender/partOfSpeech fields, but not the example sentence fields (`exampleSpanish` and `exampleEnglish`). React Hook Form retained old values because the inputs used `defaultValue` which only sets initial values and doesn't react to prop changes.

**Fix:** Added `setValue()` calls for both example sentence fields when new lookup data arrives in:
- `handleLookup()` function (manual lookups)
- Initial auto-lookup `useEffect` (dialog opens with initialWord)

**Files Modified:**
- `components/features/vocabulary-entry-form-enhanced.tsx`

---

### 2. Alternative Translations Quality Issues
**Problems:**
1. Gerund forms shown instead of infinitive ("selecting" instead of "select")
2. Junk/fragment translations ("br", "line")
3. Unnecessary prepositions ("kidnap to", "to process")
4. Pronouns in alternatives ("you return", "you")
5. Duplicate translations (alternative same as primary)
6. Wrong Part of Speech (verbs showing noun alternatives)
7. Offensive translations for regional words (e.g., "coger")

**Root Causes:**
- No gerund-to-infinitive normalization
- No minimum length filter for words
- No preposition stripping (leading "to", trailing prepositions)
- No pronoun detection and filtering
- No duplicate detection against primary translation
- Insufficient Part of Speech filtering
- API translations taking priority over curated alternatives

**Fixes Implemented:**

#### A. Gerund to Infinitive Conversion
- Converts -ing forms to base verb form
- Handles irregular patterns (being→be, seeing→see, etc.)
- Handles doubled consonants (running→run)
- Handles -e dropping (making→make)
- Only applied to actual gerunds, not words like "bring"

#### B. Preposition Stripping
- **Leading "to":** "to process" → "process"
- **Trailing prepositions:** "kidnap to" → "kidnap", "look at" → "look"

#### C. Pronoun Filtering
- Rejects any alternative containing pronouns
- Covers: i, you, he, she, it, we, they, me, him, her, us, them

#### D. Duplicate Prevention
- Filters out alternatives that match the primary translation
- Case-insensitive comparison

#### E. Minimum Length Filter
- Rejects words < 3 characters (filters "br", "to", etc.)

#### F. Enhanced Part of Speech Filtering
**Verbs:**
- Reject gerunds (-ing forms)
- Reject noun suffixes (-tion, -ment, -ness, -ity, -ance, -ence)
- Reject obvious nouns (food, meal, dish, intake, consumption, beverage, drink)
- Accept phrasal verbs (e.g., "go out", "put on")

**Nouns:**
- Reject verb infinitives (starting with "to")
- Reject verb forms (-ing, -ed endings)

**Adjectives:**
- Reject gerunds and verb forms
- Reject noun suffixes

**Adverbs:**
- Accept -ly endings
- Reject obvious verbs/nouns/adjectives

#### G. Offensive Word Handling
- Added curated dictionary entry for "coger" with appropriate translations
- Local alternatives now override API translations for primary translation
- Ensures regional variations are handled with care

**Files Modified:**
- `app/api/vocabulary/lookup/route.ts` - Added filtering functions and POS matching
- `lib/services/translation.ts` - Added "coger" to curated dictionary, prioritized local alternatives

---

## Results

### Before Fix:
- ❌ "seleccionar" → "selecting" (gerund)
- ❌ "adaptar" → "br", "line" (fragments)
- ❌ "secuestrar" → "kidnap to" (trailing preposition)
- ❌ "devolver" → "you return", "you" (pronouns)
- ❌ "tratar" → "to process" (leading "to"), "try" (duplicate)
- ❌ "coger" → "fuck" (offensive, wrong for most regions)
- ❌ Example sentences not updating on second lookup

### After Fix:
- ✅ "seleccionar" → "select" (infinitive)
- ✅ "adaptar" → "bring", "line" → filtered out
- ✅ "secuestrar" → "kidnap" (clean)
- ✅ "devolver" → "render" (no pronouns)
- ✅ "tratar" → "process" (no "to"), no duplicate
- ✅ "coger" → "take", "grab", "catch", "seize" (appropriate, safe)
- ✅ "querer" → "love", "wish", "desire" (perfect example)
- ✅ Example sentences update correctly on every lookup

---

## Technical Implementation

### New Utility Functions Added:
1. `gerundToInfinitive()` - Converts gerund forms to infinitive
2. `stripLeadingTo()` - Removes "to" prefix from infinitives
3. `stripTrailingPrepositions()` - Removes trailing prepositions
4. `containsPronoun()` - Detects pronouns in phrases
5. `matchesPartOfSpeech()` - Validates alternatives match word's POS
6. `filterAndNormalizeAlternatives()` - Master filter combining all checks

### Translation Priority Logic:
1. **If word has curated local alternatives:** Use them as primary (bypasses API for offensive/regional words)
2. **If no curated alternatives:** Use DeepL → MyMemory as normal
3. All alternatives filtered through POS and quality checks

---

## Testing Verification

All fixes verified with debug mode runtime evidence showing:
- Gerunds correctly converted to infinitive
- Pronouns successfully filtered out
- Prepositions stripped from both ends
- Duplicates prevented
- Fragment words blocked by length filter
- POS mismatches rejected
- Offensive words replaced with curated alternatives
- Example sentences updating on every lookup

---

## Impact

**User Experience:**
- Higher quality alternative translations
- Contextually appropriate translations for regional variations
- No offensive content for widely-used words with regional meanings
- Consistent verb forms (infinitive, not gerund)
- Clean, professional alternatives only
- Example sentences always fresh and relevant

**Code Quality:**
- Comprehensive filtering logic with clear separation of concerns
- Extensible POS matching system
- Curated dictionary for special cases
- Well-documented utility functions
- Runtime evidence-based debugging approach

---

## Future Enhancements

Potential improvements for future consideration:
1. Expand curated dictionary for more regional variations
2. Add context tags for regional differences (e.g., "Spain: coger = take, Latin America: avoid")
3. Machine learning-based POS detection for edge cases
4. User feedback mechanism for translation quality
5. Synonym grouping for related alternatives
