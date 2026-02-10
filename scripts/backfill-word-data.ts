/**
 * Backfill Missing Word Data
 * 
 * Updates existing cached entries with missing targetWord and partOfSpeech data
 * from the common words list.
 * 
 * Usage:
 *   npx tsx scripts/backfill-word-data.ts
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/backend/db';

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');

interface WordData {
  rank: number;
  word: string;
  pos: string;
  translation: string;
  frequency: string;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Backfill Missing Word Data                                 ║');
  console.log('║   Update Cached Entries with Translations & POS              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load word list
  const data = fs.readFileSync(WORDS_FILE, 'utf-8');
  const json = JSON.parse(data);
  const words: WordData[] = json.words;
  
  console.log(`📚 Loaded ${words.length} words from word list\n`);

  // Create a map for quick lookup
  const wordMap = new Map<string, WordData>();
  words.forEach(w => wordMap.set(w.word.toLowerCase(), w));

  // Get all cached entries with AI examples
  const allEntries = await prisma.verifiedVocabulary.findMany({
    where: {
      sourceLanguage: 'es',
      targetLanguage: 'en',
      aiExamplesGenerated: true,
    },
  });

  // Filter for entries with missing data
  const entries = allEntries.filter(entry => 
    !entry.targetWord || entry.targetWord === '' || !entry.partOfSpeech
  );

  console.log(`🔍 Found ${entries.length} entries with missing data\n`);

  if (entries.length === 0) {
    console.log('✅ All entries are complete! No backfill needed.\n');
    return;
  }

  let updated = 0;
  let notFound = 0;

  for (const entry of entries) {
    const wordData = wordMap.get(entry.sourceWord.toLowerCase());
    
    if (!wordData) {
      console.log(`⚠️  "${entry.sourceWord}" not in word list (skipping)`);
      notFound++;
      continue;
    }

    const updateData: any = {};
    let changes: string[] = [];

    // Update targetWord if missing
    if (!entry.targetWord || entry.targetWord === '') {
      updateData.targetWord = wordData.translation;
      changes.push(`targetWord: "${wordData.translation}"`);
    }

    // Update partOfSpeech if missing
    if (!entry.partOfSpeech) {
      updateData.partOfSpeech = wordData.pos;
      changes.push(`partOfSpeech: "${wordData.pos}"`);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.verifiedVocabulary.update({
        where: { id: entry.id },
        data: updateData,
      });

      console.log(`✅ Updated "${entry.sourceWord}": ${changes.join(', ')}`);
      updated++;
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 BACKFILL COMPLETE');
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`   Updated: ${updated} entries`);
  console.log(`   Not found: ${notFound} entries`);
  console.log(`   Total processed: ${entries.length} entries\n`);
}

main()
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
