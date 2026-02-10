/**
 * Cache Coverage Verification Script (Phase 18.1.7)
 * 
 * Analyzes cache coverage for pre-generated vocabulary examples.
 * Provides detailed reports on cache hit rates and identifies gaps.
 * 
 * Features:
 * - Cache hit rate analysis
 * - Coverage by word frequency tier
 * - Identify most-requested uncached words
 * - Cost savings calculation
 * - Recommendations for future pre-generation
 * 
 * Usage:
 *   npx tsx scripts/verify-cache-coverage.ts
 *   npx tsx scripts/verify-cache-coverage.ts --days 30
 *   npx tsx scripts/verify-cache-coverage.ts --export report.json
 * 
 * @see lib/services/ai-example-generator.ts
 * @see scripts/pre-generate-vocabulary.ts
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/backend/db';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');

// Parse command line arguments
const args = process.argv.slice(2);
const daysIndex = args.indexOf('--days');
const daysBack = daysIndex !== -1 ? parseInt(args[daysIndex + 1]) : 30;
const exportIndex = args.indexOf('--export');
const exportPath = exportIndex !== -1 ? args[exportIndex + 1] : null;

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

interface CoverageStats {
  totalWordsInList: number;
  cachedWords: number;
  coveragePercentage: number;
  byLevel: {
    A1: number;
    B1: number;
    C1: number;
  };
  byFrequency: {
    very_high: { total: number; cached: number; percentage: number };
    high: { total: number; cached: number; percentage: number };
    medium: { total: number; cached: number; percentage: number };
  };
}

interface UsageStats {
  totalLookups: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  estimatedSavings: number;
  topUncachedWords: Array<{
    word: string;
    lookups: number;
    estimatedCost: number;
  }>;
}

interface CoverageReport {
  generatedAt: string;
  daysAnalyzed: number;
  coverage: CoverageStats;
  usage: UsageStats;
  recommendations: string[];
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Cache Coverage Verification Script                         ║');
  console.log('║   Phase 18.1.7: Pre-Generation Analysis                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // 1. Load word list
  const words = loadWordList();
  console.log(`📚 Loaded ${words.length} words from common words list\n`);

  // 2. Analyze cache coverage
  console.log(`🔍 Analyzing cache coverage...\n`);
  const coverage = await analyzeCacheCoverage(words);
  
  // 3. Analyze usage patterns (if enough data exists)
  console.log(`📊 Analyzing usage patterns (last ${daysBack} days)...\n`);
  const usage = await analyzeUsagePatterns(words, daysBack);
  
  // 4. Generate recommendations
  const recommendations = generateRecommendations(coverage, usage);
  
  // 5. Create report
  const report: CoverageReport = {
    generatedAt: new Date().toISOString(),
    daysAnalyzed: daysBack,
    coverage,
    usage,
    recommendations,
  };
  
  // 6. Print report
  printReport(report);
  
  // 7. Export if requested
  if (exportPath) {
    fs.writeFileSync(exportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report exported to: ${exportPath}`);
  }
}

// ============================================================================
// CACHE COVERAGE ANALYSIS
// ============================================================================

async function analyzeCacheCoverage(words: WordData[]): Promise<CoverageStats> {
  // Get all cached vocabulary entries
  const cachedEntries = await prisma.verifiedVocabulary.findMany({
    where: {
      sourceLanguage: 'es',
      targetLanguage: 'en',
      aiExamplesGenerated: true,
    },
    select: {
      sourceWord: true,
      aiExamplesByLevel: true,
    },
  });
  
  // Create map of cached words with levels
  const cachedMap = new Map<string, Set<string>>();
  for (const entry of cachedEntries) {
    const levels = new Set<string>();
    const examplesByLevel = entry.aiExamplesByLevel as any;
    
    if (examplesByLevel) {
      if (examplesByLevel.A1) levels.add('A1');
      if (examplesByLevel.B1) levels.add('B1');
      if (examplesByLevel.C1) levels.add('C1');
    }
    
    cachedMap.set(entry.sourceWord.toLowerCase(), levels);
  }
  
  // Calculate coverage statistics
  let cachedCount = 0;
  const levelCounts = { A1: 0, B1: 0, C1: 0 };
  const frequencyCounts: Record<string, { total: number; cached: number }> = {
    very_high: { total: 0, cached: 0 },
    high: { total: 0, cached: 0 },
    medium: { total: 0, cached: 0 },
  };
  
  for (const word of words) {
    const wordLower = word.word.toLowerCase();
    const levels = cachedMap.get(wordLower);
    const isCached = levels && levels.size > 0;
    
    if (isCached) {
      cachedCount++;
      
      // Count by level
      if (levels!.has('A1')) levelCounts.A1++;
      if (levels!.has('B1')) levelCounts.B1++;
      if (levels!.has('C1')) levelCounts.C1++;
    }
    
    // Count by frequency
    const freq = word.frequency || 'medium';
    if (frequencyCounts[freq]) {
      frequencyCounts[freq].total++;
      if (isCached) {
        frequencyCounts[freq].cached++;
      }
    }
  }
  
  return {
    totalWordsInList: words.length,
    cachedWords: cachedCount,
    coveragePercentage: (cachedCount / words.length) * 100,
    byLevel: levelCounts,
    byFrequency: {
      very_high: {
        ...frequencyCounts.very_high,
        percentage: (frequencyCounts.very_high.cached / Math.max(frequencyCounts.very_high.total, 1)) * 100,
      },
      high: {
        ...frequencyCounts.high,
        percentage: (frequencyCounts.high.cached / Math.max(frequencyCounts.high.total, 1)) * 100,
      },
      medium: {
        ...frequencyCounts.medium,
        percentage: (frequencyCounts.medium.cached / Math.max(frequencyCounts.medium.total, 1)) * 100,
      },
    },
  };
}

// ============================================================================
// USAGE PATTERN ANALYSIS
// ============================================================================

async function analyzeUsagePatterns(words: WordData[], daysBack: number): Promise<UsageStats> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  
  // Get word lookup events (if analytics tracking exists)
  // Note: This requires WordLookupEvent model from Phase 16.2
  let lookupEvents: any[] = [];
  
  try {
    // Check if WordLookupEvent table exists
    lookupEvents = await prisma.$queryRaw`
      SELECT word, COUNT(*) as lookups
      FROM "WordLookupEvent"
      WHERE "createdAt" >= ${since}
      GROUP BY word
      ORDER BY lookups DESC
    `;
  } catch (error) {
    // Table doesn't exist or no data
    console.log(`   ⚠️  No usage data available (analytics not yet tracking)\n`);
  }
  
  // Calculate stats
  const wordSet = new Set(words.map(w => w.word.toLowerCase()));
  let cacheHits = 0;
  let cacheMisses = 0;
  const topUncached: Array<{ word: string; lookups: number; estimatedCost: number }> = [];
  
  // Check cached status for each looked-up word
  const cachedEntries = await prisma.verifiedVocabulary.findMany({
    where: {
      sourceLanguage: 'es',
      targetLanguage: 'en',
      aiExamplesGenerated: true,
    },
    select: {
      sourceWord: true,
    },
  });
  
  const cachedWords = new Set(cachedEntries.map(e => e.sourceWord.toLowerCase()));
  
  for (const event of lookupEvents) {
    const word = event.word.toLowerCase();
    const lookups = parseInt(event.lookups);
    
    if (cachedWords.has(word)) {
      cacheHits += lookups;
    } else {
      cacheMisses += lookups;
      
      // Add to uncached list if in common words
      if (wordSet.has(word)) {
        topUncached.push({
          word: event.word,
          lookups,
          estimatedCost: lookups * 0.0006, // Approximate cost per generation
        });
      }
    }
  }
  
  // Sort by lookups
  topUncached.sort((a, b) => b.lookups - a.lookups);
  
  const totalLookups = cacheHits + cacheMisses;
  const hitRate = totalLookups > 0 ? (cacheHits / totalLookups) * 100 : 0;
  const estimatedSavings = cacheHits * 0.0006; // $0.0006 per cached lookup
  
  return {
    totalLookups,
    cacheHits,
    cacheMisses,
    hitRate,
    estimatedSavings,
    topUncachedWords: topUncached.slice(0, 20),
  };
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

function generateRecommendations(coverage: CoverageStats, usage: UsageStats): string[] {
  const recommendations: string[] = [];
  
  // Coverage recommendations
  if (coverage.coveragePercentage < 80) {
    recommendations.push(
      `📈 Pre-generate more words: Currently at ${coverage.coveragePercentage.toFixed(1)}% coverage. ` +
      `Target is 80%+. Run pre-generation script to continue.`
    );
  } else if (coverage.coveragePercentage >= 80 && coverage.coveragePercentage < 95) {
    recommendations.push(
      `✅ Good coverage: ${coverage.coveragePercentage.toFixed(1)}% of common words cached. ` +
      `Consider expanding to reach 95% for optimal performance.`
    );
  } else {
    recommendations.push(
      `🎉 Excellent coverage: ${coverage.coveragePercentage.toFixed(1)}% of common words cached. ` +
      `Cache is well-populated.`
    );
  }
  
  // Level-specific recommendations
  const levels = ['A1', 'B1', 'C1'] as const;
  for (const level of levels) {
    const count = coverage.byLevel[level];
    const percentage = (count / coverage.totalWordsInList) * 100;
    
    if (percentage < 80) {
      recommendations.push(
        `⚠️  ${level} level coverage low: ${percentage.toFixed(1)}%. ` +
        `Prioritize ${level} examples in next pre-generation run.`
      );
    }
  }
  
  // Usage-based recommendations
  if (usage.totalLookups > 100) {
    if (usage.hitRate < 70) {
      recommendations.push(
        `⚡ Cache hit rate low: ${usage.hitRate.toFixed(1)}%. ` +
        `Users are frequently requesting uncached words. Review top uncached words.`
      );
    } else if (usage.hitRate >= 70 && usage.hitRate < 85) {
      recommendations.push(
        `✅ Cache performing well: ${usage.hitRate.toFixed(1)}% hit rate. ` +
        `Minor improvements possible by caching top uncached words.`
      );
    } else {
      recommendations.push(
        `🎯 Excellent cache performance: ${usage.hitRate.toFixed(1)}% hit rate. ` +
        `Pre-generation strategy is highly effective.`
      );
    }
    
    // Savings highlight
    if (usage.estimatedSavings > 1) {
      recommendations.push(
        `💰 Cost savings achieved: ~$${usage.estimatedSavings.toFixed(2)} saved through caching ` +
        `(${usage.cacheHits} API calls avoided).`
      );
    }
  }
  
  // Frequency tier recommendations
  if (coverage.byFrequency.very_high.percentage < 95) {
    recommendations.push(
      `🔥 Priority: Cache very high frequency words first. ` +
      `Currently at ${coverage.byFrequency.very_high.percentage.toFixed(1)}%. ` +
      `These words have the highest ROI.`
    );
  }
  
  return recommendations;
}

// ============================================================================
// REPORTING
// ============================================================================

function printReport(report: CoverageReport): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 CACHE COVERAGE REPORT`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(`Period: Last ${report.daysAnalyzed} days\n`);
  
  // Coverage stats
  console.log(`📈 Cache Coverage:`);
  console.log(`   Total words in list: ${report.coverage.totalWordsInList}`);
  console.log(`   Cached words: ${report.coverage.cachedWords}`);
  console.log(`   Coverage: ${report.coverage.coveragePercentage.toFixed(1)}%`);
  
  console.log(`\n   By Level:`);
  console.log(`   A1: ${report.coverage.byLevel.A1} words (${((report.coverage.byLevel.A1 / report.coverage.totalWordsInList) * 100).toFixed(1)}%)`);
  console.log(`   B1: ${report.coverage.byLevel.B1} words (${((report.coverage.byLevel.B1 / report.coverage.totalWordsInList) * 100).toFixed(1)}%)`);
  console.log(`   C1: ${report.coverage.byLevel.C1} words (${((report.coverage.byLevel.C1 / report.coverage.totalWordsInList) * 100).toFixed(1)}%)`);
  
  console.log(`\n   By Frequency Tier:`);
  const freq = report.coverage.byFrequency;
  console.log(`   Very High: ${freq.very_high.cached}/${freq.very_high.total} (${freq.very_high.percentage.toFixed(1)}%)`);
  console.log(`   High: ${freq.high.cached}/${freq.high.total} (${freq.high.percentage.toFixed(1)}%)`);
  console.log(`   Medium: ${freq.medium.cached}/${freq.medium.total} (${freq.medium.percentage.toFixed(1)}%)`);
  
  // Usage stats
  if (report.usage.totalLookups > 0) {
    console.log(`\n📊 Usage Statistics:`);
    console.log(`   Total lookups: ${report.usage.totalLookups}`);
    console.log(`   Cache hits: ${report.usage.cacheHits} (${report.usage.hitRate.toFixed(1)}%)`);
    console.log(`   Cache misses: ${report.usage.cacheMisses}`);
    console.log(`   Estimated savings: $${report.usage.estimatedSavings.toFixed(2)}`);
    
    if (report.usage.topUncachedWords.length > 0) {
      console.log(`\n   Top 10 Uncached Words:`);
      report.usage.topUncachedWords.slice(0, 10).forEach((w, i) => {
        console.log(`   ${i + 1}. "${w.word}" - ${w.lookups} lookups ($${w.estimatedCost.toFixed(4)} potential savings)`);
      });
    }
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:\n`);
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}\n`);
    });
  }
  
  console.log(`${'═'.repeat(60)}\n`);
}

// ============================================================================
// UTILITIES
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
// RUN
// ============================================================================

main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});
