/**
 * Fix Conjugated Verbs in Word List
 * Phase 18.1.7 - Data Quality Cleanup
 * 
 * This script:
 * 1. Identifies conjugated verbs in common-words-5000.json
 * 2. Uses OpenAI to convert them to infinitive forms
 * 3. Updates the JSON file with corrected forms
 * 4. Removes conjugated verb entries from database
 * 5. Documents all changes made
 * 
 * Problem: 25 conjugated verbs were added (ranks 700-814)
 * Solution: Replace with their infinitive forms
 * 
 * Example:
 *   - "es" (is) → "ser" (to be)
 *   - "tiene" (has) → "tener" (to have)
 *   - "fue" (was) → "ser" or "ir" (context dependent)
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');
const BACKUP_FILE = path.join(__dirname, 'common-words-5000.backup.json');
const CHANGES_LOG = path.join(__dirname, '.conjugated-verbs-fixes.json');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface WordEntry {
  rank: number;
  word: string;
  pos: string;
  translation: string;
  frequency: string;
}

interface VerbFix {
  rank: number;
  conjugated: string;
  infinitive: string;
  oldTranslation: string;
  newTranslation: string;
  confidence: 'high' | 'medium' | 'low';
}

// Known conjugated verbs from earlier analysis
const CONJUGATED_VERBS = [
  { rank: 703, word: 'es', translation: 'is' },
  { rank: 704, word: 'fue', translation: 'was/went' },
  { rank: 705, word: 'ha', translation: 'has (third person singular present of the verb \'haber\')' },
  { rank: 713, word: 'está', translation: 'is' },
  { rank: 715, word: 'han', translation: 'have' },
  { rank: 722, word: 'tiene', translation: 'he/she/it has' },
  { rank: 728, word: 'dijo', translation: 'said' },
  { rank: 731, word: 'puede', translation: 'can' },
  { rank: 732, word: 'había', translation: 'there was / there were' },
  { rank: 733, word: 'fueron', translation: 'they were / you were / we were' },
  { rank: 737, word: 'están', translation: 'are' },
  { rank: 741, word: 'sido', translation: 'been' },
  { rank: 744, word: 'hace', translation: 'to do/make (in reference to time)' },
  { rank: 764, word: 'será', translation: 'will be' },
  { rank: 768, word: 'pueden', translation: 'they can / you all can' },
  { rank: 771, word: 'tienen', translation: 'they have' },
  { rank: 772, word: 'estaba', translation: 'was' },
  { rank: 778, word: 'encuentra', translation: 'find' },
  { rank: 787, word: 'tuvo', translation: 'he/she/it had' },
  { rank: 794, word: 'siendo', translation: 'being' },
  { rank: 802, word: 'estas', translation: 'you are (2nd person singular informal)' },
  { rank: 804, word: 'eran', translation: 'were' },
  { rank: 805, word: 'tenía', translation: 'had' },
  { rank: 811, word: 'hizo', translation: 'he/she/it did' },
  { rank: 813, word: 'debe', translation: 'must/should' },
];

async function getInfinitiveForm(conjugated: string, translation: string): Promise<{ infinitive: string; translation: string; confidence: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Spanish linguistics expert. Convert conjugated Spanish verbs to their infinitive forms. Respond in JSON format only.',
        },
        {
          role: 'user',
          content: `Convert the conjugated Spanish verb "${conjugated}" (meaning: "${translation}") to its infinitive form.

Provide:
1. The infinitive form (ending in -ar, -er, or -ir)
2. The infinitive's English translation (using "to" form)
3. Confidence level (high/medium/low)

Examples:
- "es" (is) → {"infinitive": "ser", "translation": "to be", "confidence": "high"}
- "tiene" (has) → {"infinitive": "tener", "translation": "to have", "confidence": "high"}
- "fue" (was/went) → {"infinitive": "ser", "translation": "to be", "confidence": "medium", "note": "Could also be 'ir' (to go), but 'ser' is more common"}

Respond ONLY with valid JSON: {"infinitive": "...", "translation": "...", "confidence": "...", "note": "..."}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content?.trim() || '';
    const data = JSON.parse(content);
    
    return {
      infinitive: data.infinitive,
      translation: data.translation,
      confidence: data.confidence || 'high',
    };
  } catch (error) {
    console.error(`   ❌ Error getting infinitive for "${conjugated}":`, error);
    throw error;
  }
}

async function fixConjugatedVerbs() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Fix Conjugated Verbs in Word List                          ║');
  console.log('║   Phase 18.1.7: Data Quality Cleanup                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Load current word list
  console.log('📚 Step 1: Loading current word list...\n');
  const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
  const wordData = JSON.parse(fileContent);
  const words: WordEntry[] = wordData.words;
  
  console.log(`   Loaded ${words.length} words from ${WORDS_FILE}`);
  
  // Step 2: Create backup
  console.log('\n💾 Step 2: Creating backup...\n');
  fs.writeFileSync(BACKUP_FILE, fileContent, 'utf-8');
  console.log(`   ✅ Backup saved to ${BACKUP_FILE}`);
  
  // Step 3: Identify conjugated verbs
  console.log('\n🔍 Step 3: Identifying conjugated verbs...\n');
  console.log(`   Found ${CONJUGATED_VERBS.length} conjugated verbs to fix:\n`);
  
  CONJUGATED_VERBS.forEach((v, i) => {
    console.log(`   ${i + 1}. Rank ${v.rank}: "${v.word}" (${v.translation})`);
  });
  
  // Step 4: Convert to infinitives using OpenAI
  console.log('\n🤖 Step 4: Converting to infinitive forms with OpenAI...\n');
  
  const fixes: VerbFix[] = [];
  
  for (let i = 0; i < CONJUGATED_VERBS.length; i++) {
    const verb = CONJUGATED_VERBS[i];
    process.stdout.write(`   Processing ${i + 1}/${CONJUGATED_VERBS.length}: "${verb.word}" → `);
    
    try {
      const result = await getInfinitiveForm(verb.word, verb.translation);
      console.log(`"${result.infinitive}" (${result.confidence} confidence) ✅`);
      
      fixes.push({
        rank: verb.rank,
        conjugated: verb.word,
        infinitive: result.infinitive,
        oldTranslation: verb.translation,
        newTranslation: result.translation,
        confidence: result.confidence as 'high' | 'medium' | 'low',
      });
      
      // Small delay to avoid rate limits
      if (i < CONJUGATED_VERBS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.log(`ERROR ❌`);
      console.error(`   Failed to convert "${verb.word}". Skipping...`);
    }
  }
  
  console.log(`\n   ✅ Successfully converted ${fixes.length}/${CONJUGATED_VERBS.length} verbs`);
  
  // Step 5: Check for duplicates
  console.log('\n🔄 Step 5: Checking for duplicate infinitives...\n');
  
  const existingWords = new Set(words.map(w => w.word.toLowerCase()));
  const duplicates: VerbFix[] = [];
  const nonDuplicates: VerbFix[] = [];
  
  fixes.forEach(fix => {
    if (existingWords.has(fix.infinitive.toLowerCase()) && fix.conjugated.toLowerCase() !== fix.infinitive.toLowerCase()) {
      duplicates.push(fix);
      console.log(`   ⚠️  "${fix.infinitive}" already exists (will remove "${fix.conjugated}")`);
    } else {
      nonDuplicates.push(fix);
    }
  });
  
  console.log(`\n   Found ${duplicates.length} duplicates, ${nonDuplicates.length} to replace`);
  
  // Step 6: Update word list
  console.log('\n📝 Step 6: Updating word list...\n');
  
  let updatedWords = [...words];
  let replacedCount = 0;
  let removedCount = 0;
  
  // Replace non-duplicates with infinitive forms
  for (const fix of nonDuplicates) {
    const index = updatedWords.findIndex(w => w.rank === fix.rank);
    if (index !== -1) {
      updatedWords[index] = {
        ...updatedWords[index],
        word: fix.infinitive,
        translation: fix.newTranslation,
      };
      console.log(`   ✅ Replaced: Rank ${fix.rank}: "${fix.conjugated}" → "${fix.infinitive}"`);
      replacedCount++;
    }
  }
  
  // Remove duplicates (keep only the higher-ranked original)
  for (const fix of duplicates) {
    const index = updatedWords.findIndex(w => w.rank === fix.rank);
    if (index !== -1) {
      updatedWords.splice(index, 1);
      console.log(`   🗑️  Removed: Rank ${fix.rank}: "${fix.conjugated}" (infinitive "${fix.infinitive}" already exists)`);
      removedCount++;
    }
  }
  
  // Re-rank words to maintain sequential order
  updatedWords = updatedWords.sort((a, b) => a.rank - b.rank);
  updatedWords.forEach((word, index) => {
    word.rank = index + 1;
  });
  
  // Step 7: Save updated file
  console.log('\n💾 Step 7: Saving updated word list...\n');
  
  wordData.words = updatedWords;
  wordData.metadata.totalWords = updatedWords.length;
  wordData.metadata.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(WORDS_FILE, JSON.stringify(wordData, null, 2), 'utf-8');
  
  console.log(`   ✅ Updated ${WORDS_FILE}`);
  console.log(`   Replaced: ${replacedCount} conjugated verbs with infinitives`);
  console.log(`   Removed: ${removedCount} duplicate entries`);
  console.log(`   Total words: ${words.length} → ${updatedWords.length}`);
  
  // Step 8: Save changes log
  console.log('\n📋 Step 8: Saving changes log...\n');
  
  const changelog = {
    timestamp: new Date().toISOString(),
    operation: 'fix_conjugated_verbs',
    summary: {
      totalVerbsFound: CONJUGATED_VERBS.length,
      successfulConversions: fixes.length,
      replaced: replacedCount,
      removed: removedCount,
      finalWordCount: updatedWords.length,
    },
    changes: fixes,
  };
  
  fs.writeFileSync(CHANGES_LOG, JSON.stringify(changelog, null, 2), 'utf-8');
  console.log(`   ✅ Changes logged to ${CHANGES_LOG}`);
  
  // Step 9: Remove conjugated entries from database
  console.log('\n🗄️  Step 9: Cleaning up database...\n');
  
  const conjugatedWords = [...duplicates, ...nonDuplicates].map(f => f.conjugated);
  
  try {
    const result = await prisma.verifiedVocabulary.deleteMany({
      where: {
        sourceWord: {
          in: conjugatedWords,
        },
        sourceLanguage: 'es',
      },
    });
    
    console.log(`   ✅ Removed ${result.count} conjugated verb entries from database`);
  } catch (error) {
    console.error('   ❌ Error cleaning database:', error);
  }
  
  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   CLEANUP COMPLETE                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Summary:\n');
  console.log(`   Conjugated verbs identified: ${CONJUGATED_VERBS.length}`);
  console.log(`   Successfully converted: ${fixes.length}`);
  console.log(`   Replaced with infinitives: ${replacedCount}`);
  console.log(`   Removed (duplicates): ${removedCount}`);
  console.log(`   Database entries removed: ${conjugatedWords.length}`);
  console.log(`   Final word count: ${updatedWords.length}\n`);
  
  console.log('📁 Files:\n');
  console.log(`   ✅ Updated: ${WORDS_FILE}`);
  console.log(`   ✅ Backup: ${BACKUP_FILE}`);
  console.log(`   ✅ Changes log: ${CHANGES_LOG}\n`);
  
  console.log('🚀 Next Steps:\n');
  console.log('   1. Review the changes in the log file');
  console.log('   2. Verify infinitive forms are correct');
  console.log('   3. Delete progress file to force re-processing:');
  console.log('      rm scripts/.pre-generation-progress.json');
  console.log('   4. Run pre-generation script again:');
  console.log('      npx tsx scripts/pre-generate-vocabulary.ts --resume\n');
  
  await prisma.$disconnect();
}

// Run the cleanup
fixConjugatedVerbs()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
