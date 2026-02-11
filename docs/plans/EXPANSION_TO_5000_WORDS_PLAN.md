# Expansion to 5,000 Words with Validation
**Phase 18.1.7 Extension - Validated Word List Expansion**  
**Date**: February 11, 2026  
**Current**: 789 words  
**Target**: 5,000 words  
**Remaining**: 4,211 words

---

## 🎯 Objective

Expand the Spanish word list from 789 to 5,000 words using credible, lemmatized sources with comprehensive validation at every step to prevent data quality issues.

---

## 📊 Current Status

**Word List:**
- Current: 789 words
- Target: 5,000 words
- Gap: 4,211 words needed

**Validation Status:**
- ✅ Validation system implemented and tested
- ✅ All 7 validators working
- ✅ Integrated into pre-generation and expansion scripts
- ✅ 789 existing words validated (0 critical errors)

**Quality Status:**
- ✅ All verbs in infinitive form
- ✅ No duplicates
- ✅ All translations present
- ✅ Sequential ranks

---

## 🔍 Credible Sources Strategy

### **Priority 1: Lemmatized Frequency Lists (Recommended)**

#### **1. RAE (Real Academia Española) CREA Corpus**
**Source**: https://www.rae.es/recursos/banco-de-datos/crea  
**Type**: Lemmatized frequency list  
**Coverage**: Contemporary Spanish from 1975-2004  
**Quality**: ⭐⭐⭐⭐⭐ (Highest authority)

**Pros:**
- Official Spanish language authority
- Pre-lemmatized (verbs in infinitive)
- Multiple genres (literature, journalism, oral)
- Reliable POS tagging

**Cons:**
- Requires registration/access request
- May need manual extraction

**How to use:**
1. Access CREA lemmatized frequency lists
2. Export top 5,000 lemmas
3. Filter out already-cached words
4. Import remaining words

---

#### **2. SpanishDict Frequency Data**
**Source**: https://www.spanishdict.com/  
**Type**: Curated frequency lists  
**Quality**: ⭐⭐⭐⭐ (High quality, verified)

**Pros:**
- Well-maintained
- Includes POS tags
- Translations included
- Lemmatized forms

**Cons:**
- May require API access or scraping
- Coverage limits

---

#### **3. Corpus del Español (Mark Davies)**
**Source**: https://www.corpusdelespanol.org/  
**Type**: Academic corpus with frequency data  
**Coverage**: 2 billion words  
**Quality**: ⭐⭐⭐⭐⭐ (Academic standard)

**Pros:**
- Comprehensive
- Lemmatized
- POS tagged
- Free access to frequency lists

**Cons:**
- Requires data processing
- May need custom scripts

---

### **Priority 2: Pre-Curated Lists (Easier to Use)**

#### **4. Spanish Frequency Dictionary (Routledge)**
**Source**: Published frequency dictionary  
**Type**: Book/PDF with 5,000 most common words  
**Quality**: ⭐⭐⭐⭐⭐ (Academic)

**Pros:**
- Already ranked and lemmatized
- Includes POS and translations
- Verified by linguists
- Ready to use

**Cons:**
- Need to purchase or access via library
- Manual data entry or OCR

---

#### **5. Wiktionary Spanish Frequency List (Lemmatized Version)**
**Source**: https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Spanish  
**Type**: Curated list based on corpus analysis  
**Quality**: ⭐⭐⭐ (Good, but verify lemmas)

**Pros:**
- Free and accessible
- Available as downloadable list
- Community-verified

**Cons:**
- May contain some conjugated forms
- Requires validation (perfect for our system!)

---

### **Priority 3: Hybrid Approach (Recommended for This Project)**

**Strategy**: Combine multiple sources with validation

```
1. Start with Wiktionary lemmatized list (easiest access)
2. Cross-reference with RAE CREA (authority)
3. Validate all entries with our system
4. Fill gaps with Corpus del Español
5. Final validation pass
```

---

## 🔄 Validated Expansion Workflow

### **Phase 1: Source Preparation** (1-2 hours)

#### Step 1.1: Download Source List
```bash
# Example: Download Wiktionary Spanish 5000
wget https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Spanish/1-5000

# Or use RAE CREA export
# (Requires manual download/access)
```

#### Step 1.2: Parse and Format
Create script: `scripts/parse-source-word-list.ts`

```typescript
/**
 * Parse external word list into our format
 * 
 * Input: External frequency list (various formats)
 * Output: Standardized WordEntry[] format
 * Validation: Run basic checks during parsing
 */

interface ExternalWordEntry {
  word: string;
  rank?: number;
  pos?: string;
  translation?: string;
  frequency?: number;
}

function parseSourceList(filePath: string): WordEntry[] {
  // 1. Read external file
  // 2. Parse format (CSV, JSON, XML, etc.)
  // 3. Map to our WordEntry format
  // 4. Basic validation during parsing
  // 5. Return standardized array
}
```

---

### **Phase 2: Deduplication and Filtering** (10-15 minutes)

#### Step 2.1: Check Against Database
```typescript
/**
 * Filter out words already in database
 * This prevents duplicates and saves API costs
 */

async function filterExistingWords(
  newWords: WordEntry[],
  existingWords: WordEntry[]
): Promise<{
  unique: WordEntry[];
  duplicates: WordEntry[];
}> {
  // Get all words from database
  const cachedWords = await getExistingCachedWords();
  
  // Get all words from current JSON file
  const jsonWords = new Set(existingWords.map(w => w.word.toLowerCase()));
  
  // Filter new words
  const unique: WordEntry[] = [];
  const duplicates: WordEntry[] = [];
  
  for (const word of newWords) {
    const wordLower = word.word.toLowerCase();
    
    if (cachedWords.has(wordLower) || jsonWords.has(wordLower)) {
      duplicates.push(word);
    } else {
      unique.push(word);
    }
  }
  
  return { unique, duplicates };
}
```

#### Step 2.2: Enrich Missing Data
```typescript
/**
 * Use OpenAI to fill in missing POS/translations
 * Only for words that passed initial validation
 */

async function enrichWordData(word: Partial<WordEntry>): Promise<WordEntry> {
  // If POS or translation missing, use OpenAI
  if (!word.pos || !word.translation) {
    const enriched = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Provide POS and translation for Spanish words. Respond in JSON.',
        },
        {
          role: 'user',
          content: `Word: "${word.word}"\nProvide: {"pos": "...", "translation": "..."}`,
        },
      ],
      temperature: 0.3,
    });
    
    const data = JSON.parse(enriched.choices[0].message.content!);
    return { ...word, pos: data.pos, translation: data.translation } as WordEntry;
  }
  
  return word as WordEntry;
}
```

---

### **Phase 3: VALIDATION (Critical Step)** (1-2 minutes)

#### Step 3.1: Run Full Validation
```typescript
/**
 * CRITICAL: Validate BEFORE adding to word list
 * This is where our validation system protects us
 */

import { validateWordList } from '@/lib/utils/word-list-validator';

async function validateNewWords(newWords: WordEntry[]): Promise<boolean> {
  console.log('\n🔍 VALIDATING NEW WORDS (CRITICAL STEP)...\n');
  
  const validation = validateWordList(newWords);
  
  // Display results
  console.log(`Total new words: ${newWords.length}`);
  console.log(`Critical errors: ${validation.summary.criticalErrors}`);
  console.log(`Errors: ${validation.summary.errors}`);
  console.log(`Warnings: ${validation.summary.warnings}\n`);
  
  // Show all errors if found
  if (!validation.valid) {
    console.error('❌ VALIDATION FAILED\n');
    
    validation.errors.forEach(err => {
      console.error(`[${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
      console.error(`   ${err.message}`);
      if (err.suggestion) {
        console.error(`   💡 ${err.suggestion}`);
      }
      console.error('');
    });
    
    return false;
  }
  
  if (validation.warnings.length > 0) {
    console.log(`⚠️  ${validation.warnings.length} warnings (non-critical)\n`);
    validation.warnings.forEach(w => {
      console.log(`[WARNING] ${w.type}: "${w.word}"`);
    });
  }
  
  console.log('✅ VALIDATION PASSED\n');
  return true;
}
```

#### Step 3.2: Handle Validation Failures
```typescript
/**
 * If validation fails, provide fix options
 */

async function handleValidationFailures(
  validation: ValidationResult
): Promise<WordEntry[]> {
  console.log('\n🔧 ATTEMPTING AUTO-FIXES...\n');
  
  const fixedWords: WordEntry[] = [];
  
  for (const error of validation.errors) {
    if (error.type === 'verb_form') {
      // Auto-fix: Convert conjugated verb to infinitive
      const infinitive = await convertToInfinitive(error.word);
      console.log(`   ✅ Fixed: "${error.word}" → "${infinitive}"`);
      fixedWords.push({ ...getWord(error.word), word: infinitive });
    }
    
    if (error.type === 'translation') {
      // Auto-fix: Generate translation with OpenAI
      const translation = await generateTranslation(error.word);
      console.log(`   ✅ Fixed: "${error.word}" - added translation`);
      fixedWords.push({ ...getWord(error.word), translation });
    }
  }
  
  return fixedWords;
}
```

---

### **Phase 4: Batch Addition** (Variable time)

#### Step 4.1: Add in Batches with Validation
```typescript
/**
 * Add words in batches of 500 with validation between each
 */

async function expandWordListInBatches(
  newWords: WordEntry[],
  batchSize: number = 500
): Promise<void> {
  const batches = chunk(newWords, batchSize);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    console.log(`\n════════════════════════════════════════`);
    console.log(`   BATCH ${i + 1}/${batches.length}`);
    console.log(`   Words: ${batch.length}`);
    console.log(`════════════════════════════════════════\n`);
    
    // 1. Validate batch
    const isValid = await validateNewWords(batch);
    
    if (!isValid) {
      console.error(`❌ Batch ${i + 1} validation failed. Aborting expansion.`);
      throw new Error('Validation failed');
    }
    
    // 2. Add to word list
    await addWordsToList(batch);
    
    // 3. Validate entire word list after addition
    const fullValidation = validateWordList(getAllWords());
    
    if (!fullValidation.valid) {
      console.error(`❌ Full word list validation failed after batch ${i + 1}. Rolling back.`);
      await rollbackBatch(batch);
      throw new Error('Full validation failed');
    }
    
    console.log(`✅ Batch ${i + 1} added successfully\n`);
    
    // 4. Save progress
    saveWordList();
    
    // 5. Small delay between batches
    await delay(1000);
  }
}
```

---

### **Phase 5: Final Verification** (5 minutes)

#### Step 5.1: Run Complete Validation
```bash
# Validate entire 5,000 word list
npx tsx scripts/validate-word-list.ts --detailed

# Export validation report
npx tsx scripts/validate-word-list.ts --export final-validation.json
```

#### Step 5.2: Verify Database Consistency
```typescript
/**
 * Ensure word list matches database expectations
 */

async function verifyDatabaseConsistency(): Promise<void> {
  // 1. Count words in JSON
  const jsonWords = loadWordList();
  
  // 2. Count cached words in DB
  const dbCount = await prisma.verifiedVocabulary.count({
    where: { sourceLanguage: 'es', aiExamplesGenerated: true }
  });
  
  // 3. Compare
  console.log(`Words in JSON: ${jsonWords.length}`);
  console.log(`Words in DB: ${dbCount}`);
  console.log(`Status: ${dbCount >= jsonWords.length ? '✅' : '⚠️'}`);
}
```

---

## 🔐 Safety Measures

### **1. Backup Before Expansion**
```bash
# Create timestamped backup
cp scripts/common-words-5000.json \
   scripts/backups/common-words-5000-$(date +%Y%m%d-%H%M%S).json
```

### **2. Progressive Validation**
```
Parse → Validate
  ↓
Deduplicate → Validate
  ↓
Enrich → Validate
  ↓
Add Batch → Validate
  ↓
Full List → Validate
```

### **3. Rollback Capability**
```typescript
interface ExpansionSession {
  startTime: string;
  startingWords: number;
  targetWords: number;
  backupPath: string;
  batches: {
    batchNumber: number;
    wordsAdded: number;
    validationPassed: boolean;
    timestamp: string;
  }[];
}

// Save session data for potential rollback
function saveExpansionSession(session: ExpansionSession): void {
  fs.writeFileSync(
    path.join(__dirname, '.expansion-session.json'),
    JSON.stringify(session, null, 2)
  );
}
```

### **4. Validation Checkpoints**
- ✅ **Checkpoint 1**: After parsing source (validate format)
- ✅ **Checkpoint 2**: After deduplication (validate uniqueness)
- ✅ **Checkpoint 3**: After enrichment (validate completeness)
- ✅ **Checkpoint 4**: Before adding (validate quality)
- ✅ **Checkpoint 5**: After adding (validate full list)
- ✅ **Checkpoint 6**: Final verification (validate entire system)

---

## 📋 New Script: Complete Expansion Tool

### **File**: `scripts/expand-to-5000-validated.ts`

```typescript
/**
 * Complete Validated Word List Expansion
 * Phase 18.1.7 Extension
 * 
 * Expands word list to 5,000 words with validation at every step.
 * 
 * Usage:
 *   npx tsx scripts/expand-to-5000-validated.ts --source wiktionary.json
 *   npx tsx scripts/expand-to-5000-validated.ts --source rae-crea.csv --target 5000
 *   npx tsx scripts/expand-to-5000-validated.ts --source corpus.json --batch-size 500
 * 
 * Features:
 * - Multi-source support (JSON, CSV, TSV)
 * - Automatic deduplication
 * - Progressive validation at each step
 * - Batch processing with rollback
 * - Auto-enrichment with OpenAI
 * - Comprehensive logging
 * - Safety backups
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWordList } from '@/lib/utils/word-list-validator';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// ... implementation ...

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Validated Word List Expansion to 5,000 Words               ║');
  console.log('║   Phase 18.1.7 Extension                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // 1. Create backup
  createBackup();
  
  // 2. Load source list
  const sourceWords = parseSourceList(sourcePath);
  console.log(`📚 Loaded ${sourceWords.length} words from source\n`);
  
  // 3. Validate source (Checkpoint 1)
  console.log('🔍 Checkpoint 1: Validating source data...\n');
  const sourceValidation = validateWordList(sourceWords);
  if (!sourceValidation.valid) {
    console.error('❌ Source validation failed. Aborting.');
    process.exit(1);
  }
  console.log('✅ Source validation passed\n');
  
  // 4. Deduplicate
  const { unique, duplicates } = await filterExistingWords(sourceWords);
  console.log(`🔄 Deduplication: ${unique.length} unique, ${duplicates.length} duplicates\n`);
  
  // 5. Validate unique words (Checkpoint 2)
  console.log('🔍 Checkpoint 2: Validating deduplicated words...\n');
  const uniqueValidation = validateWordList(unique);
  if (!uniqueValidation.valid) {
    console.error('❌ Deduplication validation failed. Aborting.');
    process.exit(1);
  }
  console.log('✅ Deduplication validation passed\n');
  
  // 6. Enrich missing data
  const enriched = await enrichMissingData(unique);
  
  // 7. Validate enriched (Checkpoint 3)
  console.log('🔍 Checkpoint 3: Validating enriched words...\n');
  const enrichedValidation = validateWordList(enriched);
  if (!enrichedValidation.valid) {
    console.error('❌ Enrichment validation failed. Attempting auto-fix...');
    const fixed = await handleValidationFailures(enrichedValidation);
    // Re-validate
  }
  console.log('✅ Enrichment validation passed\n');
  
  // 8. Add in batches with validation
  await expandWordListInBatches(enriched, batchSize);
  
  // 9. Final verification (Checkpoint 6)
  console.log('🔍 Checkpoint 6: Final verification...\n');
  const finalValidation = validateWordList(getAllWords());
  if (!finalValidation.valid) {
    console.error('❌ CRITICAL: Final validation failed!');
    console.error('   Consider rolling back to backup.');
    process.exit(1);
  }
  
  console.log('✅ ALL VALIDATION PASSED\n');
  console.log(`🎉 Successfully expanded to ${getAllWords().length} words\n`);
}
```

---

## 📊 Expansion Timeline

### **Conservative Approach (Recommended)**

**Week 1: Preparation** (2-3 days)
- Download and prepare source lists
- Create expansion script
- Test with small batch (100 words)

**Week 2-3: Incremental Expansion** (10-14 days)
- Add 500 words per day
- Validate after each batch
- Monitor for issues
- Total: ~4,000 words in 8 days

**Week 4: Verification** (2-3 days)
- Final validation of all 5,000 words
- Run pre-generation for new words
- Performance testing
- Documentation

### **Aggressive Approach** (If Confident)

**Day 1: Preparation** (4-6 hours)
- Download sources
- Create script
- Test batch

**Day 2: Expansion** (6-8 hours)
- Add 1,000 words at a time
- Validate between batches
- Complete expansion

**Day 3: Verification** (2-4 hours)
- Final validation
- Pre-generation
- Testing

---

## 💰 Cost Estimates

### **Enrichment Costs** (if needed)

Assuming 30% of new words need POS/translation enrichment:
- New words: ~4,200
- Need enrichment: ~1,260 words
- Cost per enrichment: $0.0003
- **Total enrichment**: ~$0.38

### **Pre-Generation Costs**

After expansion:
- New words: ~4,200
- Levels: 3 (A1, B1, C1)
- API calls: ~12,600
- Cost per call: $0.0003-$0.0006
- **Total pre-generation**: $3.78 - $7.56

### **Total Cost**: ~$4.00 - $8.00

---

## ✅ Success Criteria

### **Data Quality**
- ✅ 0 critical validation errors
- ✅ All verbs in infinitive form
- ✅ No duplicates
- ✅ All translations present
- ✅ Sequential ranks 1-5,000

### **Coverage**
- ✅ 5,000 unique Spanish words
- ✅ All words from credible sources
- ✅ Balanced across POS types
- ✅ Frequency-ranked

### **System Integrity**
- ✅ Word list validates completely
- ✅ Database consistency maintained
- ✅ Pre-generation ready
- ✅ Documentation complete

---

## 🚀 Quick Start Command

```bash
# 1. Download source (example: Wiktionary)
wget -O scripts/sources/wiktionary-5000.txt \
  https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Spanish/1-5000

# 2. Run validated expansion
npx tsx scripts/expand-to-5000-validated.ts \
  --source scripts/sources/wiktionary-5000.txt \
  --target 5000 \
  --batch-size 500

# 3. Validate final result
npx tsx scripts/validate-word-list.ts --detailed

# 4. Run pre-generation
npx tsx scripts/pre-generate-vocabulary.ts --resume
```

---

**Status**: 📋 Plan Ready for Implementation  
**Estimated Time**: 1-2 weeks (conservative) or 2-3 days (aggressive)  
**Estimated Cost**: $4-8 USD  
**Risk Level**: Low (validation at every step)  

**Next Step**: Choose source(s) and begin Phase 1 (Source Preparation)
