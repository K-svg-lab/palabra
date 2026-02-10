/**
 * Pre-Generation Script for Common Spanish Vocabulary (Phase 18.1.7)
 * 
 * Generates AI examples for 5,000 most common Spanish words at A1, B1, C1 levels.
 * 
 * Features:
 * - Resumable: Tracks progress and resumes from last successful batch
 * - Cost control: Monitors spending and stops at budget limit
 * - Progress reporting: Real-time console updates with ETA
 * - Batch processing: Processes words in configurable batches
 * - Error handling: Graceful failure recovery
 * - Performance metrics: Speed, success rate, cost tracking
 * 
 * Usage:
 *   npx tsx scripts/pre-generate-vocabulary.ts
 *   npx tsx scripts/pre-generate-vocabulary.ts --resume
 *   npx tsx scripts/pre-generate-vocabulary.ts --limit 100
 *   npx tsx scripts/pre-generate-vocabulary.ts --levels A1,B1
 * 
 * @see lib/services/ai-example-generator.ts
 * @see lib/services/ai-cost-control.ts
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
const envPath = require('path').resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

// Debug: Check if environment loaded
if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
  process.exit(1);
}

// Verify OpenAI key is loaded
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
  console.error('❌ OPENAI_API_KEY not found in environment after loading .env.local');
  console.error(`   Loaded from: ${envPath}`);
  console.error(`   Keys found: ${Object.keys(result.parsed || {}).join(', ')}`);
  process.exit(1);
}

import * as fs from 'fs';
import * as path from 'path';
import { batchGenerateExamples } from '@/lib/services/ai-example-generator';
import { getCurrentMonthCostReport, canMakeAICall } from '@/lib/services/ai-cost-control';
import type { CEFRLevel } from '@/lib/types/proficiency';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');
const PROGRESS_FILE = path.join(__dirname, '.pre-generation-progress.json');
const BATCH_SIZE = 50; // Process 50 words at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches
const MAX_BUDGET_USD = 30; // Stop if total cost exceeds $30

// Parse command line arguments
const args = process.argv.slice(2);
const isResume = args.includes('--resume');
const limitIndex = args.indexOf('--limit');
const wordLimit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;
const levelsIndex = args.indexOf('--levels');
const levelArg = levelsIndex !== -1 ? args[levelsIndex + 1] : 'A1,B1,C1';
const targetLevels = levelArg.split(',') as CEFRLevel[];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WordData {
  rank: number;
  word: string;
  pos: string;
  translation: string;
  frequency: string;
}

interface ProgressData {
  lastProcessedRank: number;
  totalWords: number;
  successfulWords: number;
  failedWords: number;
  cachedWords: number;
  totalCost: number;
  startedAt: string;
  lastUpdatedAt: string;
  completedLevels: Record<string, number>;
}

interface GenerationStats {
  startTime: number;
  totalProcessed: number;
  successful: number;
  failed: number;
  cached: number;
  totalCost: number;
  averageTimePerWord: number;
  estimatedTimeRemaining: number;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Pre-Generation Script for Common Spanish Vocabulary        ║');
  console.log('║   Phase 18.1.7: AI Example Pre-Generation                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // 1. Load word list
  const words = loadWordList();
  console.log(`📚 Loaded ${words.length} words from ${WORDS_FILE}`);
  
  // 2. Load or initialize progress
  const progress = isResume ? loadProgress() : initializeProgress(words.length);
  
  if (isResume && progress.lastProcessedRank > 0) {
    console.log(`🔄 Resuming from rank ${progress.lastProcessedRank + 1}`);
    console.log(`   Previous session: ${progress.successfulWords}/${progress.totalWords} words completed`);
    console.log(`   Total cost so far: $${progress.totalCost.toFixed(2)}`);
  }
  
  // 3. Filter words to process
  const wordsToProcess = words
    .filter(w => w.rank > progress.lastProcessedRank)
    .slice(0, wordLimit);
  
  console.log(`\n🎯 Target configuration:`);
  console.log(`   Levels: ${targetLevels.join(', ')}`);
  console.log(`   Words to process: ${wordsToProcess.length}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Total API calls: ~${wordsToProcess.length * targetLevels.length}`);
  console.log(`   Estimated cost: $${(wordsToProcess.length * targetLevels.length * 0.0003).toFixed(2)} - $${(wordsToProcess.length * targetLevels.length * 0.0006).toFixed(2)}`);
  console.log(`   Budget limit: $${MAX_BUDGET_USD}`);
  
  // 4. Check budget before starting
  const costReport = await getCurrentMonthCostReport();
  console.log(`\n💰 Current budget status:`);
  console.log(`   Spent: $${costReport.currentSpend.toFixed(2)} / $${costReport.monthlyBudget.toFixed(2)}`);
  console.log(`   Remaining: $${costReport.remainingBudget.toFixed(2)}`);
  console.log(`   Can proceed: ${costReport.canMakeRequest ? '✅ Yes' : '❌ No'}`);
  
  if (!costReport.canMakeRequest) {
    console.error(`\n❌ ERROR: Monthly budget limit reached. Cannot proceed.`);
    process.exit(1);
  }
  
  // 5. Confirm execution
  console.log(`\n⏳ Starting pre-generation in 3 seconds...`);
  console.log(`   (Press Ctrl+C to cancel)\n`);
  await delay(3000);
  
  // 6. Process words in batches
  const stats = await processWordBatches(wordsToProcess, targetLevels, progress);
  
  // 7. Final report
  printFinalReport(stats, progress);
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function processWordBatches(
  words: WordData[],
  levels: CEFRLevel[],
  progress: ProgressData
): Promise<GenerationStats> {
  const startTime = Date.now();
  const stats: GenerationStats = {
    startTime,
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    cached: 0,
    totalCost: 0,
    averageTimePerWord: 0,
    estimatedTimeRemaining: 0,
  };

  // Process in batches
  const batches = chunkArray(words, BATCH_SIZE);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNum = i + 1;
    const totalBatches = batches.length;
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 Batch ${batchNum}/${totalBatches} (Words ${batch[0].rank}-${batch[batch.length - 1].rank})`);
    console.log(`${'═'.repeat(60)}\n`);
    
    // Check budget before each batch
    const canProceed = await canMakeAICall();
    if (!canProceed) {
      console.warn(`\n⚠️  Budget limit reached. Stopping pre-generation.`);
      break;
    }
    
    // Process batch
    const batchStartTime = Date.now();
    
    try {
      const result = await batchGenerateExamples(
        batch.map(w => ({
          word: w.word,
          translation: w.translation,
          partOfSpeech: w.pos,
        })),
        levels
      );
      
      // Update statistics
      stats.totalProcessed += batch.length;
      stats.successful += result.generated;
      stats.cached += result.cached;
      stats.failed += result.failed;
      stats.totalCost += result.totalCost;
      
      // Update progress
      progress.lastProcessedRank = batch[batch.length - 1].rank;
      progress.successfulWords += result.generated;
      progress.cachedWords += result.cached;
      progress.failedWords += result.failed;
      progress.totalCost += result.totalCost;
      progress.lastUpdatedAt = new Date().toISOString();
      
      // Save progress after each batch
      saveProgress(progress);
      
      // Calculate metrics
      const batchDuration = Date.now() - batchStartTime;
      const avgTimePerWord = batchDuration / batch.length;
      stats.averageTimePerWord = (Date.now() - startTime) / stats.totalProcessed;
      
      const remainingWords = words.length - stats.totalProcessed;
      stats.estimatedTimeRemaining = remainingWords * stats.averageTimePerWord;
      
      // Print batch results
      console.log(`\n✅ Batch completed in ${(batchDuration / 1000).toFixed(1)}s`);
      console.log(`   Generated: ${result.generated}, Cached: ${result.cached}, Failed: ${result.failed}`);
      console.log(`   Cost: $${result.totalCost.toFixed(4)}`);
      console.log(`   Progress: ${stats.totalProcessed}/${words.length} words (${((stats.totalProcessed / words.length) * 100).toFixed(1)}%)`);
      console.log(`   Total cost: $${stats.totalCost.toFixed(2)}`);
      
      if (stats.estimatedTimeRemaining > 0) {
        const eta = new Date(Date.now() + stats.estimatedTimeRemaining);
        console.log(`   ETA: ${formatDuration(stats.estimatedTimeRemaining)} (${eta.toLocaleTimeString()})`);
      }
      
    } catch (error) {
      console.error(`\n❌ Batch failed:`, error);
      stats.failed += batch.length;
      progress.failedWords += batch.length;
    }
    
    // Delay between batches (except last one)
    if (i < batches.length - 1) {
      console.log(`\n⏸  Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
    
    // Check if we've exceeded budget
    if (stats.totalCost >= MAX_BUDGET_USD) {
      console.warn(`\n⚠️  Maximum budget ($${MAX_BUDGET_USD}) reached. Stopping.`);
      break;
    }
  }
  
  return stats;
}

// ============================================================================
// PROGRESS MANAGEMENT
// ============================================================================

function loadProgress(): ProgressData {
  if (!fs.existsSync(PROGRESS_FILE)) {
    throw new Error(`Progress file not found: ${PROGRESS_FILE}\nRun without --resume flag to start fresh.`);
  }
  
  const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
  return JSON.parse(data);
}

function initializeProgress(totalWords: number): ProgressData {
  return {
    lastProcessedRank: 0,
    totalWords,
    successfulWords: 0,
    failedWords: 0,
    cachedWords: 0,
    totalCost: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    completedLevels: {},
  };
}

function saveProgress(progress: ProgressData): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadWordList(): WordData[] {
  if (!fs.existsSync(WORDS_FILE)) {
    throw new Error(`Word list not found: ${WORDS_FILE}`);
  }
  
  const data = fs.readFileSync(WORDS_FILE, 'utf-8');
  const json = JSON.parse(data);
  
  return json.words as WordData[];
}

// ============================================================================
// REPORTING
// ============================================================================

function printFinalReport(stats: GenerationStats, progress: ProgressData): void {
  const duration = Date.now() - stats.startTime;
  const successRate = (stats.successful / stats.totalProcessed) * 100;
  
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`🎉 PRE-GENERATION COMPLETE`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log(`📊 Statistics:`);
  console.log(`   Words processed: ${stats.totalProcessed}`);
  console.log(`   Generated: ${stats.successful} (${successRate.toFixed(1)}%)`);
  console.log(`   From cache: ${stats.cached}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Duration: ${formatDuration(duration)}`);
  console.log(`   Avg time per word: ${(stats.averageTimePerWord / 1000).toFixed(2)}s`);
  
  console.log(`\n💰 Cost Report:`);
  console.log(`   This session: $${stats.totalCost.toFixed(2)}`);
  console.log(`   Total spent: $${progress.totalCost.toFixed(2)}`);
  console.log(`   Budget remaining: $${(MAX_BUDGET_USD - progress.totalCost).toFixed(2)}`);
  
  console.log(`\n📈 Overall Progress:`);
  console.log(`   Total words: ${progress.totalWords}`);
  console.log(`   Completed: ${progress.successfulWords + progress.cachedWords} (${(((progress.successfulWords + progress.cachedWords) / progress.totalWords) * 100).toFixed(1)}%)`);
  console.log(`   Remaining: ${progress.totalWords - progress.lastProcessedRank}`);
  
  if (progress.lastProcessedRank < progress.totalWords) {
    console.log(`\n🔄 To resume:`);
    console.log(`   npx tsx scripts/pre-generate-vocabulary.ts --resume`);
  }
  
  console.log(`\n✅ Progress saved to: ${PROGRESS_FILE}`);
  console.log(`\n${'═'.repeat(60)}\n`);
}

// ============================================================================
// UTILITIES
// ============================================================================

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Interrupted by user. Progress has been saved.`);
  console.log(`   Run with --resume flag to continue:\n`);
  console.log(`   npx tsx scripts/pre-generate-vocabulary.ts --resume\n`);
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error(`\n❌ Unhandled error:`, error);
  console.log(`\n   Progress has been saved. Run with --resume to continue.\n`);
  process.exit(1);
});

// ============================================================================
// RUN
// ============================================================================

main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});
