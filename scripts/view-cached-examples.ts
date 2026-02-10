/**
 * View Cached Examples Script
 * 
 * Display pre-generated AI examples from the database in a readable format.
 * 
 * Usage:
 *   npx tsx scripts/view-cached-examples.ts
 *   npx tsx scripts/view-cached-examples.ts --word libro
 *   npx tsx scripts/view-cached-examples.ts --recent 20
 *   npx tsx scripts/view-cached-examples.ts --level A1
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

import { prisma } from '@/lib/backend/db';

// Parse arguments
const args = process.argv.slice(2);
const wordIndex = args.indexOf('--word');
const specificWord = wordIndex !== -1 ? args[wordIndex + 1] : null;
const recentIndex = args.indexOf('--recent');
const recentCount = recentIndex !== -1 ? parseInt(args[recentIndex + 1]) : 20;
const levelIndex = args.indexOf('--level');
const specificLevel = levelIndex !== -1 ? args[levelIndex + 1] : null;

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Cached Examples Viewer                                     ║');
  console.log('║   View Pre-Generated AI Examples                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (specificWord) {
    // Show details for specific word
    await viewSpecificWord(specificWord);
  } else {
    // Show recent cached words
    await viewRecentWords(recentCount, specificLevel);
  }
}

async function viewSpecificWord(word: string) {
  console.log(`🔍 Searching for: "${word}"\n`);

  const entry = await prisma.verifiedVocabulary.findFirst({
    where: {
      sourceWord: word,
      sourceLanguage: 'es',
      targetLanguage: 'en',
      aiExamplesGenerated: true,
    },
  });

  if (!entry) {
    console.log(`❌ No cached examples found for "${word}"\n`);
    console.log('Run pre-generation to cache this word:');
    console.log(`   npx tsx scripts/pre-generate-vocabulary.ts\n`);
    return;
  }

  console.log(`✅ Word: ${entry.sourceWord}`);
  console.log(`   Translation: ${entry.targetWord || 'N/A'}`);
  console.log(`   Generated: ${entry.aiExamplesGeneratedAt?.toLocaleString()}`);
  console.log(`   Source: ${entry.primarySource}\n`);

  const examplesByLevel = entry.aiExamplesByLevel as any;
  
  for (const level of ['A1', 'B1', 'C1']) {
    const examples = examplesByLevel?.[level];
    
    if (examples && examples.length > 0) {
      console.log(`📚 ${level} Level (${examples.length} examples):`);
      examples.forEach((ex: any, i: number) => {
        console.log(`   ${i + 1}. ES: ${ex.spanish}`);
        console.log(`      EN: ${ex.english}`);
      });
      console.log('');
    }
  }
}

async function viewRecentWords(limit: number, level: string | null) {
  console.log(`📊 Recently Cached Words (Last ${limit})${level ? ` - ${level} Level` : ''}\n`);

  const entries = await prisma.verifiedVocabulary.findMany({
    where: {
      sourceLanguage: 'es',
      targetLanguage: 'en',
      aiExamplesGenerated: true,
    },
    orderBy: {
      aiExamplesGeneratedAt: 'desc',
    },
    take: limit,
  });

  if (entries.length === 0) {
    console.log('❌ No cached examples found in database\n');
    return;
  }

  console.log(`Found ${entries.length} cached words:\n`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const examplesByLevel = entry.aiExamplesByLevel as any;
    
    // Count examples
    let totalExamples = 0;
    const levelCounts: string[] = [];
    
    for (const lvl of ['A1', 'B1', 'C1']) {
      const examples = examplesByLevel?.[lvl];
      if (examples && examples.length > 0) {
        totalExamples += examples.length;
        levelCounts.push(`${lvl}:${examples.length}`);
      }
    }

    console.log(`${i + 1}. ${entry.sourceWord.padEnd(15)} - ${totalExamples} examples (${levelCounts.join(', ')})`);
    
    // Show one example if level specified
    if (level && examplesByLevel?.[level]) {
      const examples = examplesByLevel[level];
      if (examples.length > 0) {
        console.log(`   💡 ${level}: "${examples[0].spanish}"`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total cached words: ${entries.length}`);
  console.log(`   Generated: ${entries[0]?.aiExamplesGeneratedAt ? new Date(entries[0].aiExamplesGeneratedAt).toLocaleString() : 'Unknown'}`);
  
  // Level breakdown
  const levelBreakdown: Record<string, number> = { A1: 0, B1: 0, C1: 0 };
  for (const entry of entries) {
    const examplesByLevel = entry.aiExamplesByLevel as any;
    for (const lvl of ['A1', 'B1', 'C1']) {
      if (examplesByLevel?.[lvl]?.length > 0) {
        levelBreakdown[lvl]++;
      }
    }
  }
  
  console.log(`\n   Level Coverage:`);
  console.log(`   A1: ${levelBreakdown.A1} words`);
  console.log(`   B1: ${levelBreakdown.B1} words`);
  console.log(`   C1: ${levelBreakdown.C1} words`);
}

main()
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
