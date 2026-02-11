/**
 * Expand Word List Script
 * Quickly adds more common Spanish words to the word list using OpenAI
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function expandWordList(targetCount: number = 1500) {
  console.log('🚀 Expanding Spanish word list...\n');
  
  // Read current word list
  const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
  const wordData = JSON.parse(fileContent);
  let currentWords = wordData.words;
  const initialCount = currentWords.length;
  
  console.log(`📚 Current word count: ${initialCount}`);
  console.log(`🎯 Target word count: ${targetCount}`);
  console.log(`➕ Words to add: ${targetCount - initialCount}\n`);
  
  if (initialCount >= targetCount) {
    console.log('✅ Word list already at target size!');
    return;
  }
  
  const totalWordsToAdd = targetCount - initialCount;
  const BATCH_SIZE = 200; // Request 200 words at a time
  const numBatches = Math.ceil(totalWordsToAdd / BATCH_SIZE);
  
  console.log(`📦 Processing in ${numBatches} batches of up to ${BATCH_SIZE} words each\n`);
  
  let allNewWords: any[] = [];
  
  for (let batchNum = 0; batchNum < numBatches; batchNum++) {
    const currentCount = initialCount + allNewWords.length;
    const remainingWords = totalWordsToAdd - allNewWords.length;
    const wordsThisBatch = Math.min(BATCH_SIZE, remainingWords);
    const lastRank = currentWords.length > 0 ? currentWords[currentWords.length - 1].rank + allNewWords.length : 0;
  
    console.log(`📦 Batch ${batchNum + 1}/${numBatches}: Requesting ${wordsThisBatch} words (ranks ${lastRank + 1}-${lastRank + wordsThisBatch})...`);
  
    const prompt = `Generate a JSON array of the next ${wordsThisBatch} most common Spanish words, starting from frequency rank ${lastRank + 1}.

For each word, provide:
- rank: The frequency rank (starting at ${lastRank + 1})
- word: The Spanish word (infinitive for verbs)
- pos: Part of speech (verb, noun, adjective, adverb, pronoun, preposition, conjunction, etc.)
- translation: English translation
- frequency: "very_high" for ranks ${lastRank + 1}-${lastRank + 200}, "high" for ${lastRank + 201}-${lastRank + 500}, "medium" for rest

Focus on:
1. Most frequently used words in everyday Spanish conversation
2. Mix of verbs, nouns, adjectives, adverbs
3. Practical vocabulary for learners
4. Avoid overly specialized or technical terms
5. Include common irregular verbs and essential grammar words

Return ONLY the JSON array, no other text. Format:
[{"rank":${lastRank + 1},"word":"...","pos":"...","translation":"...","frequency":"..."},...]`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a Spanish language expert and lexicographer. Generate accurate, high-frequency Spanish vocabulary with translations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });
      
      let content = response.choices[0].message.content?.trim() || '';
      
      // Remove markdown code blocks if present
      content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      content = content.trim();
      
      // Parse the JSON response
      let batchWords: any[] = [];
      try {
        // Try to parse as-is first
        batchWords = JSON.parse(content);
      } catch (e) {
        // If that fails, try to extract JSON array from markdown code blocks
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          batchWords = JSON.parse(jsonMatch[0]);
        } else {
          console.error('❌ Could not parse JSON from batch response');
          console.error('Response:', content.substring(0, 300));
          continue; // Skip this batch
        }
      }
      
      console.log(`   ✅ Received ${batchWords.length} words from batch ${batchNum + 1}\n`);
      allNewWords.push(...batchWords);
      
      // Small delay between batches
      if (batchNum < numBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Error in batch ${batchNum + 1}:`, error);
      // Continue with next batch
    }
  }
  
  if (allNewWords.length === 0) {
    console.error('❌ No words were successfully added');
    return;
  }
  
  // Add all new words to existing list
  const updatedWords = [...currentWords, ...allNewWords];
  
  // Update metadata
  wordData.metadata.totalWords = updatedWords.length;
  wordData.metadata.lastUpdated = new Date().toISOString();
  wordData.words = updatedWords;
  
  // Write back to file
  fs.writeFileSync(WORDS_FILE, JSON.stringify(wordData, null, 2), 'utf-8');
  
  console.log('\n💾 Updated word list file');
  console.log(`   Initial words: ${initialCount}`);
  console.log(`   New words added: ${allNewWords.length}`);
  console.log(`   Total words: ${updatedWords.length}`);
  console.log(`   Rank range: ${currentWords[0].rank} - ${updatedWords[updatedWords.length - 1].rank}\n`);
  
  // Show sample of new words
  console.log('📝 Sample of new words:');
  allNewWords.slice(0, 10).forEach((w: any) => {
    console.log(`   ${w.rank}. ${w.word} (${w.pos}) - ${w.translation}`);
  });
  if (allNewWords.length > 10) {
    console.log(`   ... and ${allNewWords.length - 10} more`);
  }
  
  console.log('\n✅ Word list expansion complete!');
  console.log(`\n🚀 Ready to run pre-generation script with ${updatedWords.length} words`);
}

// Parse command line args
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const targetCount = targetIndex !== -1 ? parseInt(args[targetIndex + 1]) : 1500;

// Run expansion
expandWordList(targetCount)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
