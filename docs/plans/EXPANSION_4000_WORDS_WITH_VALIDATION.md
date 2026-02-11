# Expansion Plan: 4,000 Words with Integrated Validation
**Phase 18.1.7 Extension - Complete Data Flow**  
**Date**: February 11, 2026  
**Current**: 810 words  
**Target**: 5,000 words  
**Remaining**: 4,190 words (targeting 4,000 for round number)

---

## 🎯 Objective

Expand Spanish word list from 810 to 4,810 words (~5,000 target) using the **validated data flow** that includes quality checks at every step, preventing issues like conjugated verbs and duplicates.

---

## 🔄 Complete Data Flow with Validation

### **UPDATED Data Flow (6 Steps → 7 Steps)**

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 0: WORD LIST EXPANSION (NEW - Before Pre-Generation)   │
│  ════════════════════════════════════════════════════════     │
│  Goal: Add 4,000 new words to common-words-5000.json         │
│                                                               │
│  0a. Source Acquisition                                       │
│      - Download credible word list (Wiktionary/RAE/etc.)     │
│      - Target: 4,000+ words beyond current 810               │
│                                                               │
│  0b. Filter & Deduplicate                                     │
│      - Check against database (1,016 cached)                 │
│      - Check against JSON file (810 words)                   │
│      - Remove duplicates                                     │
│                                                               │
│  0c. Enrich with OpenAI (VALIDATION ENRICHMENT)              │
│      - Add POS tags if missing                               │
│      - Add translations if missing                           │
│      - Convert conjugated verbs → infinitives                │
│      Cost: ~$0.0003 per word (~150 tokens)                   │
│                                                               │
│  0d. Multi-Level Deduplication                                │
│      - Remove duplicates within enriched batch               │
│      - Check against existing words post-enrichment          │
│      - Filter out infinitives that already exist             │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Load Common Words List                              │
│  ════════════════════════════════════════════════════════     │
│  - Read from common-words-5000.json                           │
│  - Parse to WordEntry[]                                       │
│  - Total words: 4,810 (after expansion)                       │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 1.5: VALIDATE Word List (QUALITY GATE)                 │
│  ════════════════════════════════════════════════════════     │
│  ✅ Verb form validation (infinitive only)                    │
│  ✅ Duplicate detection                                       │
│  ✅ Translation validation (no missing/invalid)               │
│  ✅ Rank sequence validation (1 to N, no gaps)                │
│  ✅ POS validation (valid tags only)                          │
│  ✅ Frequency tier validation                                 │
│  ✅ Word length validation (2-30 chars)                       │
│                                                               │
│  Execution time: <5 seconds for 5,000 words                   │
│  Cost: $0 (no API calls, pure validation logic)              │
│                                                               │
│  OUTCOMES:                                                    │
│  ❌ Critical errors → EXIT(1) - Halt processing               │
│  ⚠️  Errors (non-critical) → Log and continue                │
│  ℹ️  Warnings → Display but proceed                          │
│  ✅ Valid → Proceed to batch processing                       │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Process in Batches (50 words per batch)             │
│  ════════════════════════════════════════════════════════     │
│  - Check budget before each batch                             │
│  - Save progress after each batch                             │
│  - Skip words already cached in database                      │
│  - Batches: 96 total (4,810 ÷ 50)                             │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Generate AI Examples (per word, per level)          │
│  ════════════════════════════════════════════════════════     │
│  - A1: Beginner-appropriate examples (3 per word)             │
│  - B1: Intermediate examples (3 per word)                     │
│  - C1: Advanced examples (3 per word)                         │
│  - Total: 9 examples per word                                 │
│                                                               │
│  API Calls: 3 per word (1 per level)                          │
│  Cost per word: ~$0.0009-$0.0018 (3 levels)                   │
│  Avg tokens per level: ~200 tokens                            │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 4: Cache in Database (VerifiedVocabulary)              │
│  ════════════════════════════════════════════════════════     │
│  - Store examples in aiExamplesByLevel (JSON field)           │
│  - Set aiExamplesGenerated = true                             │
│  - Record aiExamplesGeneratedAt timestamp                     │
│  - Indexed for fast lookup                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 5: Track Costs (AICostEvent table)                     │
│  ════════════════════════════════════════════════════════     │
│  - Record service: "openai"                                   │
│  - Record model: "gpt-3.5-turbo"                              │
│  - Record tokens used                                         │
│  - Record cost in USD                                         │
│  - Used for budget monitoring                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 💰 Complete Cost Analysis for 4,000 Word Expansion

### **Two-Phase Process**

#### **PHASE 0: Word List Expansion (Validation & Enrichment)**
**Purpose**: Add 4,000 new words to `common-words-5000.json`

| Component | Details | Cost |
|-----------|---------|------|
| **Source words** | 4,000 words from credible source | $0 |
| **Filtering** | Check DB + JSON for duplicates | $0 |
| **OpenAI Enrichment** | Add POS + translation for new words | Variable |
| **Auto-conversion** | Conjugated → infinitive | Included |
| **Deduplication** | Remove duplicates within batch | $0 |
| **Post-enrichment filter** | Remove already-existing infinitives | $0 |
| **Validation** | Quality checks (7 validators) | $0 |

**Enrichment Details:**
- Source words: 4,000
- Estimated unique after dedup: ~2,000-2,500 (50-60% efficiency)
- OpenAI calls needed: 2,000-2,500
- Tokens per call: ~150 tokens average
- Total tokens: 300,000-375,000
- Pricing: $0.002 per 1K tokens
- **Cost: $0.60-$0.75** (Phase 0)

#### **PHASE 3: Example Generation (Existing Process)**
**Purpose**: Generate AI examples for new words and cache in database

| Component | Details | Cost |
|-----------|---------|------|
| **Words to process** | 2,000-2,500 truly new words | - |
| **Levels per word** | 3 (A1, B1, C1) | - |
| **Examples per level** | 3 examples | - |
| **API calls** | 2,000-2,500 words × 3 levels = 6,000-7,500 | - |
| **Tokens per level** | ~200 tokens average | - |
| **Total tokens** | 1.2M - 1.5M tokens | - |
| **Pricing** | $0.002 per 1K tokens | - |
| **Cost** | **$2.40-$3.00** | **(Phase 3)** |

### **TOTAL COST for 4,000 Word Expansion**

| Phase | Purpose | API Calls | Cost |
|-------|---------|-----------|------|
| **Phase 0** | Validation & Enrichment | 2,000-2,500 | **$0.60-$0.75** |
| **Phase 3** | Example Generation | 6,000-7,500 | **$2.40-$3.00** |
| **TOTAL** | Complete Process | **8,000-10,000** | **$3.00-$3.75** |

**Notes:**
- Assumes 50-60% deduplication rate (similar to our test: 50 source → 21 unique = 42%)
- Actual costs may be lower if more duplicates found
- Budget limit: $30 (plenty of headroom)
- Estimated duration: 8-12 hours total (can pause/resume)

---

## 🎁 Benefits of Integrated Validation

### **1. Cost Savings**
Without validation, conjugated verbs would cause:
- 50+ conjugations per verb
- 50x API costs for examples
- Example: 1 verb becomes 50 words = 50 × 3 levels × $0.0006 = **$0.09 per verb** (vs. $0.0018)
- For 100 conjugated verbs: **$9 wasted** (3x our entire budget!)

With validation:
- Catches conjugated verbs before processing
- Auto-converts to infinitive form
- Dedups against existing infinitives
- **Saves potential $5-$10 in wasted API calls**

### **2. Data Quality**
- No duplicate words
- No conjugated verbs (infinitive only)
- Valid translations (no missing/invalid)
- Correct rank sequencing
- Valid POS tags

### **3. Transparency**
- Clear validation reports before processing
- Immediate feedback on data quality
- No surprises during long-running generation

### **4. Fault Tolerance**
- Catches errors before expensive operations
- Multiple deduplication checkpoints
- Resumable processing with progress tracking

---

## 📋 Execution Strategy

### **Timeline**

| Step | Duration | Description |
|------|----------|-------------|
| **0a. Source** | 30 min | Download and prepare word list (Wiktionary) |
| **0b. Filter** | 15 min | Query DB and JSON, remove known words |
| **0c. Enrich** | 2-3 hours | OpenAI POS/translation enrichment (2,000-2,500 words) |
| **0d. Dedup** | 10 min | Multi-level deduplication |
| **1. Load** | 1 min | Load expanded word list |
| **1.5. Validate** | <5 sec | Run 7 validation checks |
| **3. Generate** | 6-9 hours | AI example generation (2,000-2,500 words) |
| **TOTAL** | **~8-12 hours** | Complete expansion process |

### **Batch Strategy**

**Phase 0 (Enrichment):**
- Batch size: 50 words
- Checkpoints: After every batch
- Resumable: Yes (progress saved)
- Estimated batches: 40-50

**Phase 3 (Examples):**
- Batch size: 50 words
- Checkpoints: After every batch
- Resumable: Yes (progress saved)
- Estimated batches: 40-50

### **Safety Measures**

1. **Budget Checks**: Before each batch
2. **Progress Saves**: After each batch (`.pre-generation-progress.json`)
3. **Validation Gates**: Before and after expansion
4. **Database Checks**: Continuous deduplication
5. **Error Handling**: Skip failures, continue processing

---

## ✅ Quality Guarantees

### **Validation Checkpoints**

| Checkpoint | When | What It Checks | Action on Failure |
|------------|------|----------------|-------------------|
| **Pre-Expansion** | Before enrichment | Source quality | Warn user |
| **Post-Enrichment** | After OpenAI enrichment | POS, translation, verb form | Auto-fix if possible |
| **Batch Dedup** | Within new words | Duplicates from infinitive conversion | Remove duplicates |
| **Global Dedup** | Against existing DB/JSON | Already-present words | Filter out |
| **Pre-Generation** | Before example generation | Full 7-validator suite | Exit if critical errors |

### **7 Validation Rules**

| Rule | Severity | Action |
|------|----------|--------|
| **Verb Form** | Critical | Reject conjugated verbs |
| **Duplicates** | Critical | Reject duplicates |
| **Translation** | Error | Reject missing/invalid |
| **Rank Sequence** | Error | Reject gaps/duplicates |
| **POS** | Warning | Flag invalid tags |
| **Frequency** | Info | Flag tier mismatches |
| **Word Length** | Warning | Flag unusual lengths |

---

## 🚀 Ready to Execute

### **Current State**
- ✅ Validation system implemented and tested
- ✅ Enrichment system proven (50 words → 21 unique)
- ✅ Example generation system stable (1,016 cached)
- ✅ Database optimized and indexed
- ✅ Cost tracking active

### **Next Steps**
1. **Download** source word list (Wiktionary frequency list 4,000+)
2. **Run** `scripts/expand-validated.ts` (new unified script)
3. **Monitor** progress (checkpoints every 50 words)
4. **Validate** results after Phase 0
5. **Run** `scripts/pre-generate-vocabulary.ts` for Phase 3
6. **Verify** database with `scripts/verify-cache-coverage.ts`

### **Estimated Completion**
- **Phase 0**: 3-4 hours (~2,000-2,500 words enriched)
- **Phase 3**: 6-9 hours (~2,000-2,500 words with examples)
- **Total**: 9-13 hours (can pause/resume anytime)

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Total words** | 4,810 words | `wc -l scripts/common-words-5000.json` |
| **Cached examples** | 3,000-3,500 | `SELECT COUNT(*) FROM VerifiedVocabulary WHERE aiExamplesGenerated = true` |
| **Duplicates** | 0 | Validation report |
| **Conjugated verbs** | 0 | Validation report |
| **Missing translations** | 0 | Validation report |
| **Total cost** | $3.00-$3.75 | `SELECT SUM(costUsd) FROM AICostEvent WHERE createdAt > '2026-02-11'` |
| **Coverage %** | 62-73% | (3,000-3,500) / 4,810 × 100 |

---

## 🔗 Related Documentation

- [PHASE18.1.7_IMPLEMENTATION.md](../../PHASE18.1.7_IMPLEMENTATION.md) - Updated data flow
- [VALIDATION_IMPLEMENTATION_PLAN.md](./VALIDATION_IMPLEMENTATION_PLAN.md) - Validation system design
- [EXPANSION_TO_5000_WORDS_PLAN.md](./EXPANSION_TO_5000_WORDS_PLAN.md) - Original expansion plan
- [Conjugated Verbs Issue](../../PHASE18.1.7_IMPLEMENTATION.md#critical-issue-conjugated-verbs-feb-11-2026) - Why validation matters

---

**Status**: ✅ READY TO EXECUTE  
**Budget**: $3.00-$3.75 (well under $30 limit)  
**Risk**: LOW (validated approach)  
**Timeline**: 8-12 hours (resumable)