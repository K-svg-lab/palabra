# Phase 18.1.7: Pre-Generation Strategy Implementation

**Task**: Pre-Generation Strategy (5,000 Common Words)  
**Status**: 🟢 Ready for Execution  
**Created**: February 9, 2026  
**Priority**: Medium  
**Estimated Duration**: 5-7 days

---

## 🎯 **Overview**

This task implements a comprehensive pre-generation strategy to cache AI-generated examples for the 5,000 most common Spanish words at three CEFR levels (A1, B1, C1). This dramatically reduces API costs and improves response times for users.

**Key Benefits**:
- **75-85% cost reduction** through intelligent caching
- **40x faster** response times for cached words (50ms vs 2000ms)
- **Better user experience** with instant example generation
- **Scalable architecture** for future language additions

---

## 📦 **Deliverables**

### 1. **Common Words List** ✅
**File**: `scripts/common-words-5000.json`  
**Status**: Created (150 words as foundation, expandable to 5,000)

**Structure**:
```json
{
  "metadata": {
    "version": "1.0",
    "totalWords": 5000,
    "coverage": "~90% of spoken Spanish",
    "source": "Frequency analysis from multiple corpora"
  },
  "words": [
    {
      "rank": 1,
      "word": "ser",
      "pos": "verb",
      "translation": "to be",
      "frequency": "very_high"
    },
    ...
  ]
}
```

**Features**:
- Ranked by frequency (1-5000)
- Part of speech tagged
- English translations included
- Frequency tier classification
- Extensible JSON format

### 2. **Pre-Generation Script** ✅
**File**: `scripts/pre-generate-vocabulary.ts`  
**Status**: Complete and ready to run

**Features**:
- ✅ Resumable processing (saves progress after each batch)
- ✅ Cost tracking and budget limits ($30 maximum)
- ✅ Batch processing (50 words per batch)
- ✅ Progress reporting with ETA
- ✅ Error handling and recovery
- ✅ Graceful shutdown (Ctrl+C saves progress)
- ✅ Multiple CEFR level support (A1, B1, C1)
- ✅ Command-line arguments for flexibility

**Usage**:
```bash
# Fresh start (process all words)
npx tsx scripts/pre-generate-vocabulary.ts

# Resume from last saved progress
npx tsx scripts/pre-generate-vocabulary.ts --resume

# Limit to first 100 words (testing)
npx tsx scripts/pre-generate-vocabulary.ts --limit 100

# Only generate A1 and B1 levels
npx tsx scripts/pre-generate-vocabulary.ts --levels A1,B1

# Resume with custom levels
npx tsx scripts/pre-generate-vocabulary.ts --resume --levels A1,C1
```

**Output Example**:
```
╔═══════════════════════════════════════════════════════════════╗
║   Pre-Generation Script for Common Spanish Vocabulary        ║
║   Phase 18.1.7: AI Example Pre-Generation                    ║
╚═══════════════════════════════════════════════════════════════╝

📚 Loaded 5000 words from scripts/common-words-5000.json

🎯 Target configuration:
   Levels: A1, B1, C1
   Words to process: 5000
   Batch size: 50
   Total API calls: ~15,000
   Estimated cost: $4.50 - $9.00
   Budget limit: $30

💰 Current budget status:
   Spent: $2.15 / $50.00
   Remaining: $47.85
   Can proceed: ✅ Yes

⏳ Starting pre-generation in 3 seconds...
   (Press Ctrl+C to cancel)

════════════════════════════════════════════════════════════
📦 Batch 1/100 (Words 1-50)
════════════════════════════════════════════════════════════

✅ Batch completed in 45.2s
   Generated: 147, Cached: 3, Failed: 0
   Cost: $0.0441
   Progress: 50/5000 words (1.0%)
   Total cost: $0.04
   ETA: 1h 15m (3:45 PM)
```

### 3. **Verification Script** ✅
**File**: `scripts/verify-cache-coverage.ts`  
**Status**: Complete and ready to run

**Features**:
- ✅ Cache coverage analysis
- ✅ Coverage by CEFR level
- ✅ Coverage by frequency tier
- ✅ Usage pattern analysis
- ✅ Top uncached words identification
- ✅ Cost savings calculation
- ✅ Actionable recommendations
- ✅ JSON export for reporting

**Usage**:
```bash
# Basic analysis
npx tsx scripts/verify-cache-coverage.ts

# Analyze last 7 days of usage
npx tsx scripts/verify-cache-coverage.ts --days 7

# Export report to JSON
npx tsx scripts/verify-cache-coverage.ts --export coverage-report.json
```

**Output Example**:
```
╔═══════════════════════════════════════════════════════════════╗
║   Cache Coverage Verification Script                         ║
║   Phase 18.1.7: Pre-Generation Analysis                      ║
╚═══════════════════════════════════════════════════════════════╝

📚 Loaded 5000 words from common words list

════════════════════════════════════════════════════════════
📊 CACHE COVERAGE REPORT
════════════════════════════════════════════════════════════

Generated: 2/9/2026, 3:45 PM
Period: Last 30 days

📈 Cache Coverage:
   Total words in list: 5000
   Cached words: 4235
   Coverage: 84.7%

   By Level:
   A1: 4180 words (83.6%)
   B1: 4200 words (84.0%)
   C1: 3950 words (79.0%)

   By Frequency Tier:
   Very High: 145/150 (96.7%)
   High: 850/900 (94.4%)
   Medium: 3240/3950 (82.0%)

📊 Usage Statistics:
   Total lookups: 12,543
   Cache hits: 10,847 (86.5%)
   Cache misses: 1,696
   Estimated savings: $6.51

   Top 10 Uncached Words:
   1. "desviar" - 234 lookups ($0.1404 potential savings)
   2. "resolver" - 187 lookups ($0.1122 potential savings)
   ...

💡 Recommendations:

   1. ✅ Good coverage: 84.7% of common words cached.
      Consider expanding to reach 95% for optimal performance.

   2. ⚡ C1 level coverage low: 79.0%.
      Prioritize C1 examples in next pre-generation run.

   3. 🎯 Excellent cache performance: 86.5% hit rate.
      Pre-generation strategy is highly effective.

   4. 💰 Cost savings achieved: ~$6.51 saved through caching
      (10,847 API calls avoided).
```

### 4. **Cost Tracking** ✅
**Integration**: Uses existing `lib/services/ai-cost-control.ts`  
**Status**: Already implemented in Phase 18.1.3

**Features**:
- Monthly budget tracking ($50/month)
- Per-call cost recording
- Real-time budget alerts
- Cost breakdown by service/model
- Automatic fallback at 90% budget

---

## 🏗️ **Architecture**

### **Data Flow** (Updated Feb 11, 2026)

```
┌─────────────────────────────────────────────────────────┐
│  1. Load Common Words List (5,000 words)                │
│     - Ranked by frequency                               │
│     - Tagged with POS and translations                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  1.5. VALIDATE Word List (NEW - Feb 11, 2026)           │
│     ✅ Verb form validation (infinitive only)           │
│     ✅ Duplicate detection                              │
│     ✅ Translation validation                           │
│     ✅ Rank sequence validation                         │
│     ✅ POS validation                                   │
│     ✅ Frequency tier validation                        │
│     ✅ Word length validation                           │
│                                                         │
│  ❌ If critical errors → EXIT (halt processing)        │
│  ⚠️  If warnings → Log and continue                     │
│  ✅ If valid → Proceed to processing                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. Process in Batches (50 words per batch)             │
│     - Check budget before each batch                    │
│     - Save progress after each batch                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. Generate Examples (per word, per level)             │
│     - A1: Beginner-appropriate examples                 │
│     - B1: Intermediate examples                         │
│     - C1: Advanced examples                             │
│     - Cost: ~$0.0003-$0.0006 per word per level        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. Cache in Database (VerifiedVocabulary table)        │
│     - Multi-level storage (JSON field)                  │
│     - Indexed for fast lookup                           │
│     - Shared across all users                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  5. Track Costs (AICostEvent table)                     │
│     - Service: openai                                   │
│     - Model: gpt-3.5-turbo                              │
│     - Tokens used                                       │
│     - Cost in USD                                       │
└─────────────────────────────────────────────────────────┘
```

**Key Addition**: Step 1.5 validates the word list before any expensive processing begins, preventing issues like conjugated verbs (50x multiplication) and duplicates from wasting API calls.

**📖 Complete Workflow**: For a detailed plan on expanding the word list to 5,000 words using this validated data flow, including cost calculations and execution strategy, see:
- [docs/plans/EXPANSION_4000_WORDS_WITH_VALIDATION.md](./docs/plans/EXPANSION_4000_WORDS_WITH_VALIDATION.md)

### **Database Schema**

**Existing Tables** (from Phase 18.1.3):

```prisma
model VerifiedVocabulary {
  id                    String   @id @default(cuid())
  sourceWord            String
  sourceLanguage        String   // "es"
  targetLanguage        String   // "en"
  
  // AI Examples (JSON field)
  aiExamplesByLevel     Json?    // { "A1": [...], "B1": [...], "C1": [...] }
  aiExamplesGenerated   Boolean  @default(false)
  aiExamplesGeneratedAt DateTime?
  
  @@index([sourceWord, sourceLanguage, targetLanguage])
}

model AICostEvent {
  id           String   @id @default(cuid())
  service      String   // "openai"
  model        String   // "gpt-3.5-turbo"
  endpoint     String?  // "chat/completions"
  tokensUsed   Int
  cost         Float    // USD
  success      Boolean
  errorMessage String?
  metadata     Json?
  createdAt    DateTime @default(now())
  
  @@index([createdAt])
  @@index([service, model])
}
```

---

## 💰 **Cost Analysis**

### **Estimates**

| Item | Quantity | Unit Cost | Total Cost |
|------|----------|-----------|------------|
| Words to pre-generate | 5,000 | - | - |
| Levels per word | 3 (A1, B1, C1) | - | - |
| **Total API calls** | **15,000** | **$0.0003 - $0.0006** | **$4.50 - $9.00** |

**Assumptions**:
- Average 150 tokens per example generation
- GPT-3.5-turbo pricing: $0.002 per 1K tokens
- ~75% cache hit rate after pre-generation

### **ROI Calculation**

**Before Pre-Generation**:
- Average lookup: 2000ms (API call)
- Cost per lookup: $0.0006
- Monthly lookups: ~10,000
- Monthly cost: **$6.00**

**After Pre-Generation** (80% coverage):
- Cache hit (80%): 50ms, $0
- Cache miss (20%): 2000ms, $0.0006
- Monthly cost: **$1.20** (80% reduction)

**Savings**:
- First month: $4.80 saved
- Pre-generation pays for itself in: **~2 months**
- Annual savings: **~$57.60**

### **Budget Controls**

1. **Hard limit**: $30 maximum spend
2. **Soft limit**: 90% of budget ($27)
3. **Per-batch check**: Verify budget before each batch
4. **Auto-stop**: Stops if budget exceeded
5. **Resume capability**: Continue after budget reset

---

## 📊 **Success Criteria**

### **Acceptance Criteria** (from Roadmap)

| Criterion | Target | Status |
|-----------|--------|--------|
| Script processes 5,000 words | ✅ | Ready |
| Examples for A1, B1, C1 levels | ✅ | 3 levels |
| Total cost under $30 | ✅ | ~$4.50-$9.00 |
| Results cached in database | ✅ | VerifiedVocabulary |
| Coverage report | ✅ | 80%+ target |
| Script is resumable | ✅ | Progress tracking |
| Cost tracking | ✅ | AICostEvent |
| Monthly monitoring | ✅ | Cost control service |

### **Performance Targets**

| Metric | Target | Expected |
|--------|--------|----------|
| Cache coverage | 80%+ | 84-90% |
| Cache hit rate | 70%+ | 85-90% |
| Response time (cached) | <100ms | ~50ms |
| Response time (uncached) | <2000ms | ~1500ms |
| Cost per lookup (average) | <$0.0002 | ~$0.00012 |

---

## 🚀 **Execution Plan**

### **Phase 1: Preparation** (Day 1)

1. **Expand word list** to full 5,000 words
   - Source from SpanishInput or WordFrequency.info
   - Validate frequency rankings
   - Add POS and translations
   - Format as JSON

2. **Test infrastructure**
   - Verify database connection
   - Test AI example generator
   - Confirm cost tracking working
   - Run with `--limit 10` to test

### **Phase 2: Initial Run** (Day 2-3)

1. **First batch** (Top 1,000 words)
   - Very high frequency words
   - Highest ROI
   - Cost: ~$0.90-$1.80
   - Duration: ~2-3 hours

2. **Verify quality**
   - Manually check 20-30 examples
   - Ensure level appropriateness
   - Confirm caching working

3. **Run coverage analysis**
   - Check cache hit rate
   - Identify any issues
   - Adjust if needed

### **Phase 3: Full Run** (Day 4-6)

1. **Process remaining 4,000 words**
   - High and medium frequency
   - Batch size: 50 words
   - Cost: ~$3.60-$7.20
   - Duration: ~6-8 hours (can pause/resume)

2. **Monitor progress**
   - Check after every 500 words
   - Verify cost tracking
   - Watch for errors

### **Phase 4: Validation** (Day 7)

1. **Run coverage report**
   - Verify 80%+ coverage
   - Check all levels (A1, B1, C1)
   - Analyze usage patterns

2. **Cost verification**
   - Confirm total cost <$30
   - Compare actual vs estimated
   - Document any variances

3. **Quality assurance**
   - Sample 50 random cached words
   - Verify example quality
   - Test lookup performance

4. **Documentation**
   - Update completion report
   - Record final statistics
   - Create handoff guide

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Budget Exceeded**
```
❌ ERROR: Monthly budget limit reached. Cannot proceed.
```

**Solutions**:
- Wait until next month (automatic reset)
- Increase `MONTHLY_BUDGET_USD` in `ai-cost-control.ts` (requires code change)
- Use `--resume` flag to continue next month

#### **2. Script Interrupted**
```
⚠️ Interrupted by user. Progress has been saved.
```

**Solutions**:
- Run with `--resume` flag: `npx tsx scripts/pre-generate-vocabulary.ts --resume`
- Progress is automatically saved after each batch

#### **3. API Rate Limiting**
```
Error: Rate limit exceeded
```

**Solutions**:
- Increase `DELAY_BETWEEN_BATCHES` in script (default: 2000ms)
- Reduce `BATCH_SIZE` (default: 50)
- Script will auto-retry with backoff

#### **4. Database Connection Error**
```
❌ Fatal error: Can't reach database server
```

**Solutions**:
- Check `DATABASE_URL` in `.env.local`
- Verify Neon PostgreSQL connection
- Test with: `npx tsx test-db-connection.ts`

#### **5. OpenAI API Key Missing**
```
Error: OpenAI API key not configured
```

**Solutions**:
- Add `OPENAI_API_KEY` to `.env.local`
- Verify key is valid
- Test with single word lookup

---

## 📁 **Files Created**

| File | Lines | Purpose |
|------|-------|---------|
| `scripts/common-words-5000.json` | ~150 (expandable) | Word list with rankings |
| `scripts/pre-generate-vocabulary.ts` | 550 | Main pre-generation script |
| `scripts/verify-cache-coverage.ts` | 480 | Coverage analysis script |
| `PHASE18.1.7_IMPLEMENTATION.md` | This file | Documentation |

**Total**: ~1,180 lines of code + documentation

---

## 🔗 **Related Files**

**Dependencies**:
- `lib/services/ai-example-generator.ts` (Phase 18.1.3)
- `lib/services/ai-cost-control.ts` (Phase 18.1.3)
- `lib/backend/prisma/schema.prisma` (VerifiedVocabulary, AICostEvent)
- `lib/types/proficiency.ts` (CEFRLevel type)

**Integration Points**:
- `app/api/vocabulary/lookup/route.ts` (uses cache)
- `components/features/vocabulary-entry-form-enhanced.tsx` (displays examples)
- `lib/hooks/use-vocabulary.ts` (fetches cached examples)

---

## ✅ **Next Steps**

### **Immediate Actions**

1. **Expand word list** to 5,000 words
   - Download from authoritative source
   - Format as JSON
   - Validate structure

2. **Test run** with limited words
   ```bash
   npx tsx scripts/pre-generate-vocabulary.ts --limit 10 --levels A1
   ```

3. **Verify database** connection and caching
   ```bash
   npx tsx test-db-connection.ts
   npx tsx scripts/verify-cache-coverage.ts
   ```

4. **Start pre-generation** for top 1,000 words
   ```bash
   npx tsx scripts/pre-generate-vocabulary.ts --limit 1000
   ```

### **After Completion**

1. **Run coverage analysis**
   ```bash
   npx tsx scripts/verify-cache-coverage.ts --export report.json
   ```

2. **Update Phase 18 Roadmap**
   - Mark Task 18.1.7 as complete
   - Update progress percentage
   - Add completion date

3. **Proceed to Task 18.1.8** (Testing & Validation)
   - Comprehensive testing
   - Performance benchmarks
   - Mobile testing

---

## ⚠️ **Critical Issue: Conjugated Verbs (Feb 11, 2026)**

### **Problem Discovered**

During word list expansion from 699 to 814 words, **25 conjugated Spanish verbs** were incorrectly added instead of their infinitive forms. This occurred because the source (Wiktionary frequency list) ranks words as they appear in text (conjugated forms), not lemmatized/root forms.

**Examples of problematic entries:**
- "es" (is) instead of "ser" (to be)
- "tiene" (has) instead of "tener" (to have)
- "fue" (was) instead of "ser" (to be)
- "está" (is) instead of "estar" (to be - location/state)

### **Why This Was Critical**

Spanish verbs have **~50-60 conjugated forms** each across:
- 6 persons (yo, tú, él/ella, nosotros, vosotros, ellos)
- Multiple tenses (present, preterite, imperfect, future, conditional, subjunctive, etc.)
- Participles and gerunds

**Impact:** If we cached conjugated forms, we'd need to cache potentially **1,000+ verb forms** instead of ~20 infinitives, multiplying the work by **50x**!

### **Solution Implemented**

Created `scripts/fix-conjugated-verbs.ts` to:
1. Identify conjugated verbs (25 found)
2. Convert to infinitive forms using OpenAI
3. Check for duplicates (all 25 were duplicates!)
4. Remove conjugated verbs from word list
5. Clean database entries

**Result:**
- Word list: 814 → 789 words (removed 25 duplicates)
- Database: Cleaned 25 conjugated verb entries
- Cost: ~$0.01 (one-time cleanup)
- Status: ✅ All verbs now in infinitive form

### **Requirements for Future Word List Expansions**

**CRITICAL RULE:** All Spanish verbs MUST be in infinitive form (-ar, -er, -ir endings).

**Valid infinitive forms:**
- Regular verbs: hablar, comer, vivir
- Reflexive verbs: sentirse, levantarse, vestirse (infinitive + "se")
- Irregular with -ír: oír, reír, sonreír

**INVALID forms (conjugated):**
- Present: hablo, comes, vive
- Preterite: hablé, comió, vivieron
- Imperfect: hablaba, comías, vivían
- Future: hablaré, comerás, vivirá
- Conditional: hablaría, comería, vivirían
- Present participle: hablando, comiendo, viviendo
- Past participle: hablado, comido, vivido

### **Recommended Validation (Phase 1 of Data Flow)**

Add validation step in `loadWordList()` function:

```typescript
function validateVerbs(words: WordEntry[]): { valid: WordEntry[]; invalid: WordEntry[] } {
  const valid: WordEntry[] = [];
  const invalid: WordEntry[] = [];
  
  for (const word of words) {
    if (word.pos === 'verb') {
      const isInfinitive = 
        word.word.endsWith('ar') || 
        word.word.endsWith('er') || 
        word.word.endsWith('ir') ||
        word.word.endsWith('ír') ||  // Irregular: oír, reír
        word.word.endsWith('arse') || // Reflexive -ar
        word.word.endsWith('erse') || // Reflexive -er
        word.word.endsWith('irse');   // Reflexive -ir
      
      if (isInfinitive) {
        valid.push(word);
      } else {
        invalid.push(word);
        console.warn(`⚠️  Conjugated verb detected: "${word.word}" (rank ${word.rank})`);
      }
    } else {
      valid.push(word);
    }
  }
  
  return { valid, invalid };
}
```

**Usage in pre-generation script:**

```typescript
const words = loadWordList();
const { valid, invalid } = validateVerbs(words);

if (invalid.length > 0) {
  console.error(`❌ Found ${invalid.length} conjugated verbs. Please fix before proceeding.`);
  console.error('Run: npx tsx scripts/fix-conjugated-verbs.ts');
  process.exit(1);
}
```

### **Word List Source Requirements**

When expanding beyond 789 words, use sources that provide **lemmatized** (base form) words:

**Recommended sources:**
1. ✅ Spanish lemmatized frequency lists
2. ✅ RAE (Real Academia Española) corpus with lemmas
3. ✅ SpanishInput lemmatized word lists
4. ✅ WordFrequency.info with lemmatization

**Avoid:**
- ❌ Raw text frequency analysis (includes conjugated forms)
- ❌ Wiktionary frequency lists (not lemmatized)
- ❌ Movie subtitle frequency lists (conjugated as spoken)

### **Documentation References**

- Full incident report: `docs/deployments/2026-02/DEPLOYMENT_2026_02_11_PHASE18.2.4.md`
- Cleanup script: `scripts/fix-conjugated-verbs.ts`
- Change log: `scripts/.conjugated-verbs-fixes.json`
- Backup: `scripts/common-words-5000.backup.json`

---

## 📝 **Notes**

### **Design Decisions**

1. **Why 3 levels (A1, B1, C1)?**
   - Covers beginner, intermediate, advanced
   - Reduces cost vs all 6 CEFR levels
   - Can interpolate for A2, B2, C2

2. **Why batch size of 50?**
   - Balance between progress tracking and efficiency
   - Allows for reasonable resume points
   - Prevents excessive API rate limiting

3. **Why resumable?**
   - Pre-generation takes 6-8 hours total
   - May need to pause/resume
   - Protects against failures

4. **Why $30 budget?**
   - Conservative estimate (actual: $4.50-$9.00)
   - Allows for retries and expansion
   - Prevents accidental overspend

### **Future Enhancements**

1. **Multi-language support**
   - German, French, Japanese word lists
   - Same script, different input files
   - Language-agnostic architecture ready

2. **Incremental updates**
   - Add new words as they become popular
   - Re-generate examples periodically
   - Track word frequency changes

3. **Quality scoring**
   - Rate example quality (1-5 stars)
   - Flag low-quality examples for review
   - A/B test different prompt strategies

4. **Parallel processing**
   - Process multiple words simultaneously
   - Reduce total runtime
   - Requires careful rate limit management

5. **Additional Data Validation (Nice to Have)**
   - **Character encoding validation**: Detect invalid UTF-8 or non-Spanish characters
   - **Spanish language detection**: Use linguistic features (ñ, accents, common patterns) to flag non-Spanish words
   - **Noun gender validation**: Ensure all nouns have gender markers (m/f) for proper article usage
   - **Word complexity scoring**: Rank by syllable count, cognate status, difficulty
   - **Pronunciation validation**: Check if word has IPA transcription available
   - **Usage frequency verification**: Cross-reference with multiple corpora to confirm rankings

---

**Status**: ✅ Ready for Execution  
**Created**: February 9, 2026  
**Author**: AI Assistant (Phase 18 Team)  
**Next Task**: 18.1.8 - Phase 18.1 Testing & Validation
