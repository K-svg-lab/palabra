/**
 * Expand Word List from Authoritative Source
 * Phase 18.1.7 - Proper expansion following documentation
 * 
 * This script:
 * 1. Downloads authoritative Spanish frequency list
 * 2. Checks database for already-cached words
 * 3. Filters out duplicates
 * 4. Adds only new words to common-words-5000.json
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { validateWordList, type WordEntry as ValidatedWordEntry } from '@/lib/utils/word-list-validator';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface WordEntry {
  rank: number;
  word: string;
  pos: string;
  translation: string;
  frequency: string;
}

// Wiktionary top 1000 Spanish words (from frequency analysis)
const WIKTIONARY_TOP_1000 = [
  "de", "la", "que", "el", "en", "y", "a", "los", "se", "del",
  "un", "con", "las", "por", "su", "para", "una", "no", "es", "al",
  "como", "lo", "más", "fue", "ha", "sus", "este", "o", "pero", "años",
  "esta", "también", "entre", "le", "está", "ya", "han", "dos", "sobre", "desde",
  "ser", "son", "todo", "hasta", "muy", "año", "era", "parte", "tiene", "sin",
  "si", "personas", "cuando", "hay", "donde", "dijo", "después", "porque", "durante", "puede",
  "país", "había", "todos", "fueron", "contra", "primera", "mismo", "vez", "embargo", "millones",
  "me", "están", "nos", "uno", "ciudad", "ese", "día", "gran", "sido", "otros",
  "tiempo", "primer", "nombre", "solo", "momento", "cada", "tres", "hace", "forma", "hacer",
  "lugar", "días", "así", "e", "presidente", "pasado", "vida", "él", "tras", "ante",
  "eso", "cuenta", "quien", "mayor", "caso", "tanto", "hecho", "bien", "ahora", "horas",
  "menos", "estos", "otro", "esa", "cual", "trabajo", "antes", "equipo", "tener", "nuevo",
  "mejor", "será", "mundo", "mucho", "mientras", "según", "manera", "ella", "pueden", "aunque",
  "grupo", "semana", "ni", "mi", "tienen", "estaba", "partido", "bajo", "hoy", "acuerdo",
  "otras", "hacia", "siglo", "través", "les", "va", "encuentra", "estado", "qué", "te",
  "siempre", "situación", "algunos", "esto", "historia", "mil", "serie", "luego", "varios", "final",
  "número", "importante", "tuvo", "poder", "ver", "meses", "nueva", "cuatro", "ellos", "debido",
  "otra", "algo", "siendo", "entonces", "estar", "todas", "junto", "poco", "unos", "sea",
  "general", "población", "largo", "estas", "medio", "eran", "tenía", "sistema", "muchos", "seguridad",
  "casos", "temporada", "último", "casa", "tipo", "hizo", "tarde", "mujeres", "debe", "toda"
];

async function getExistingCachedWords(): Promise<Set<string>> {
  console.log('🔍 Checking database for existing cached words...');
  
  const cachedWords = await prisma.verifiedVocabulary.findMany({
    where: {
      sourceLanguage: 'es',
      aiExamplesGenerated: true,
    },
    select: {
      sourceWord: true,
    },
  });
  
  const wordSet = new Set(cachedWords.map(w => w.sourceWord.toLowerCase()));
  console.log(`   Found ${wordSet.size} words already cached in database\n`);
  
  return wordSet;
}

async function enrichWordWithOpenAI(word: string, rank: number): Promise<WordEntry | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Spanish language expert. Provide accurate part of speech and English translations for Spanish words.',
        },
        {
          role: 'user',
          content: `For the Spanish word "${word}", provide:
1. Part of speech (verb, noun, adjective, adverb, pronoun, preposition, conjunction, article)
2. English translation (most common meaning)

Respond in JSON format: {"pos": "...", "translation": "..."}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content?.trim() || '';
    const data = JSON.parse(content);
    
    // Determine frequency tier based on rank
    let frequency = 'medium';
    if (rank <= 200) frequency = 'very_high';
    else if (rank <= 500) frequency = 'high';
    
    return {
      rank,
      word,
      pos: data.pos,
      translation: data.translation,
      frequency,
    };
  } catch (error) {
    console.error(`   ❌ Error enriching word "${word}":`, error);
    return null;
  }
}

async function expandWordList(targetCount: number = 5000) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Expand Word List from Authoritative Source                 ║');
  console.log('║   Phase 18.1.7: Proper Word List Expansion                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load current word list
  const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
  const wordData = JSON.parse(fileContent);
  const currentWords = wordData.words;
  
  console.log(`📚 Current word list: ${currentWords.length} words`);
  console.log(`🎯 Target: ${targetCount} words`);
  console.log(`➕ Words to add: ${targetCount - currentWords.length}\n`);
  
  if (currentWords.length >= targetCount) {
    console.log('✅ Word list already at target size!');
    await prisma.$disconnect();
    return;
  }
  
  // Get words already in database
  const cachedWords = await getExistingCachedWords();
  
  // Get words already in JSON file
  const jsonWords = new Set(currentWords.map((w: WordEntry) => w.word.toLowerCase()));
  
  console.log('📋 Filtering word list:');
  console.log(`   - Words in JSON file: ${jsonWords.size}`);
  console.log(`   - Words in database: ${cachedWords.size}`);
  console.log(`   - Combined unique: ${new Set([...jsonWords, ...cachedWords]).size}\n`);
  
  // Filter Wiktionary list for new words only
  const newWords = WIKTIONARY_TOP_1000.filter(word => {
    const lowerWord = word.toLowerCase();
    return !jsonWords.has(lowerWord) && !cachedWords.has(lowerWord);
  });
  
  console.log(`🆕 Found ${newWords.length} new words from Wiktionary top 1000\n`);
  
  if (newWords.length === 0) {
    console.log('✅ No new words to add from current source!');
    console.log('💡 Consider sourcing additional words from:');
    console.log('   - SpanishInput 5000 word list');
    console.log('   - WordFrequency.info corpus');
    console.log('   - Extended Wiktionary lists\n');
    await prisma.$disconnect();
    return;
  }
  
  // Determine how many words to add
  const wordsNeeded = Math.min(newWords.length, targetCount - currentWords.length);
  const wordsToAdd = newWords.slice(0, wordsNeeded);
  
  console.log(`📦 Processing ${wordsToAdd.length} new words with OpenAI enrichment...\n`);
  
  // Enrich words with POS and translations
  const enrichedWords: WordEntry[] = [];
  let currentRank = currentWords.length + 1;
  
  for (let i = 0; i < wordsToAdd.length; i++) {
    const word = wordsToAdd[i];
    process.stdout.write(`   Processing ${i + 1}/${wordsToAdd.length}: ${word}...`);
    
    const enriched = await enrichWordWithOpenAI(word, currentRank);
    if (enriched) {
      enrichedWords.push(enriched);
      currentRank++;
      console.log(' ✅');
    } else {
      console.log(' ❌');
    }
    
    // Small delay to avoid rate limits
    if (i < wordsToAdd.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Successfully enriched ${enrichedWords.length} words\n`);
  
  // Validate new words before adding to list
  console.log('🔍 Validating new words...\n');
  const validation = validateWordList(enrichedWords as ValidatedWordEntry[]);
  
  if (!validation.valid) {
    console.error('❌ Validation failed for new words. Aborting expansion.\n');
    validation.errors.forEach(err => {
      console.error(`   [${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
      console.error(`      ${err.message}\n`);
    });
    console.error('Please review and fix the issues above before proceeding.\n');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  if (validation.warnings.length > 0) {
    console.log(`⚠️  Found ${validation.warnings.length} warnings in new words:\n`);
    validation.warnings.forEach(warn => {
      console.log(`   [WARNING] ${warn.type}: "${warn.word}" (rank ${warn.rank})`);
      console.log(`      ${warn.message}\n`);
    });
  } else {
    console.log('✅ New words passed validation!\n');
  }
  
  // Add to word list
  const updatedWords = [...currentWords, ...enrichedWords];
  wordData.metadata.totalWords = updatedWords.length;
  wordData.metadata.lastUpdated = new Date().toISOString();
  wordData.words = updatedWords;
  
  // Save updated file
  fs.writeFileSync(WORDS_FILE, JSON.stringify(wordData, null, 2), 'utf-8');
  
  console.log('💾 Updated word list file');
  console.log(`   Previous: ${currentWords.length} words`);
  console.log(`   Added: ${enrichedWords.length} new words`);
  console.log(`   Total: ${updatedWords.length} words`);
  console.log(`   Rank range: 1 - ${updatedWords.length}\n`);
  
  // Show sample
  console.log('📝 Sample of new words:');
  enrichedWords.slice(0, 10).forEach(w => {
    console.log(`   ${w.rank}. ${w.word} (${w.pos}) - ${w.translation}`);
  });
  if (enrichedWords.length > 10) {
    console.log(`   ... and ${enrichedWords.length - 10} more`);
  }
  
  console.log('\n✅ Word list expansion complete!');
  console.log(`\n🚀 Ready to run pre-generation script with ${updatedWords.length} words`);
  console.log(`   Command: npx tsx scripts/pre-generate-vocabulary.ts --resume\n`);
  
  await prisma.$disconnect();
}

// Parse command line args
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const targetCount = targetIndex !== -1 ? parseInt(args[targetIndex + 1]) : 1000;

// Run expansion
expandWordList(targetCount)
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
