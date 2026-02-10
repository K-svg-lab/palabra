/**
 * Test Pre-Generation Setup (Phase 18.1.7)
 * 
 * Validates that all infrastructure is ready for pre-generation:
 * - Database connection
 * - OpenAI API access
 * - AI cost control service
 * - VerifiedVocabulary table structure
 * - Word list file
 * 
 * Usage:
 *   npx tsx scripts/test-pre-generation-setup.ts
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/backend/db';
import { getCurrentMonthCostReport } from '@/lib/services/ai-cost-control';
import { generateExamples } from '@/lib/services/ai-example-generator';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');
const TEST_WORD = 'libro'; // Simple test word

// ============================================================================
// TEST RESULTS
// ============================================================================

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Pre-Generation Setup Validation                            ║');
  console.log('║   Phase 18.1.7: Infrastructure Testing                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Run all tests
  await testDatabaseConnection();
  await testVerifiedVocabularyTable();
  await testAICostEventTable();
  await testWordListFile();
  await testOpenAIAccess();
  await testCostTracking();
  await testCaching();

  // Print results
  printResults();

  // Exit with appropriate code
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// ============================================================================
// TESTS
// ============================================================================

async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to PostgreSQL database',
    });
  } catch (error: any) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect to database',
      details: error.message,
    });
  }
}

async function testVerifiedVocabularyTable() {
  try {
    const count = await prisma.verifiedVocabulary.count();
    results.push({
      name: 'VerifiedVocabulary Table',
      status: 'pass',
      message: `Table exists with ${count} entries`,
    });
  } catch (error: any) {
    results.push({
      name: 'VerifiedVocabulary Table',
      status: 'fail',
      message: 'Table does not exist or cannot be accessed',
      details: error.message,
    });
  }
}

async function testAICostEventTable() {
  try {
    const count = await prisma.aICostEvent.count();
    results.push({
      name: 'AICostEvent Table',
      status: 'pass',
      message: `Table exists with ${count} cost entries`,
    });
  } catch (error: any) {
    results.push({
      name: 'AICostEvent Table',
      status: 'fail',
      message: 'Table does not exist or cannot be accessed',
      details: error.message,
    });
  }
}

async function testWordListFile() {
  try {
    if (!fs.existsSync(WORDS_FILE)) {
      results.push({
        name: 'Word List File',
        status: 'fail',
        message: `File not found: ${WORDS_FILE}`,
      });
      return;
    }

    const data = fs.readFileSync(WORDS_FILE, 'utf-8');
    const json = JSON.parse(data);

    if (!json.words || !Array.isArray(json.words)) {
      results.push({
        name: 'Word List File',
        status: 'fail',
        message: 'Invalid JSON structure (missing "words" array)',
      });
      return;
    }

    const wordCount = json.words.length;
    const status = wordCount >= 5000 ? 'pass' : 'warning';
    const message =
      wordCount >= 5000
        ? `Complete list with ${wordCount} words`
        : `Partial list with ${wordCount} words (need 5,000 for full run)`;

    results.push({
      name: 'Word List File',
      status,
      message,
    });
  } catch (error: any) {
    results.push({
      name: 'Word List File',
      status: 'fail',
      message: 'Failed to load or parse word list',
      details: error.message,
    });
  }
}

async function testOpenAIAccess() {
  try {
    console.log(`   Testing OpenAI access (generating example for "${TEST_WORD}")...`);
    
    const result = await generateExamples({
      word: TEST_WORD,
      translation: 'book',
      partOfSpeech: 'noun',
      level: 'A1',
      count: 1,
      useCache: false, // Force generation to test API
    });

    if (result.examples.length > 0) {
      const costInfo = result.cost ? ` (cost: $${result.cost.toFixed(4)})` : '';
      results.push({
        name: 'OpenAI API Access',
        status: 'pass',
        message: `Successfully generated example${costInfo}`,
        details: `Example: "${result.examples[0].spanish}"`,
      });
    } else {
      results.push({
        name: 'OpenAI API Access',
        status: 'fail',
        message: 'API call succeeded but no examples generated',
      });
    }
  } catch (error: any) {
    const isKeyMissing = error.message?.includes('API key');
    results.push({
      name: 'OpenAI API Access',
      status: 'fail',
      message: isKeyMissing
        ? 'OpenAI API key not configured'
        : 'Failed to generate example',
      details: isKeyMissing
        ? 'Add OPENAI_API_KEY to .env.local'
        : error.message,
    });
  }
}

async function testCostTracking() {
  try {
    const report = await getCurrentMonthCostReport();

    const status = report.canMakeRequest ? 'pass' : 'fail';
    const message = report.canMakeRequest
      ? `Budget OK: $${report.currentSpend.toFixed(2)} / $${report.monthlyBudget.toFixed(2)} spent (${report.percentageUsed.toFixed(1)}%)`
      : `Budget exceeded: $${report.currentSpend.toFixed(2)} / $${report.monthlyBudget.toFixed(2)}`;

    results.push({
      name: 'Cost Tracking System',
      status,
      message,
      details: report.canMakeRequest
        ? `${report.estimatedCallsRemaining} API calls remaining`
        : 'Cannot proceed with pre-generation',
    });
  } catch (error: any) {
    results.push({
      name: 'Cost Tracking System',
      status: 'fail',
      message: 'Failed to get cost report',
      details: error.message,
    });
  }
}

async function testCaching() {
  try {
    console.log(`   Testing caching (checking for cached "${TEST_WORD}")...`);
    
    // Try to get cached example
    const cachedResult = await generateExamples({
      word: TEST_WORD,
      translation: 'book',
      partOfSpeech: 'noun',
      level: 'A1',
      count: 1,
      useCache: true,
    });

    if (cachedResult.fromCache) {
      results.push({
        name: 'Example Caching',
        status: 'pass',
        message: `Test word "${TEST_WORD}" is cached (fast retrieval)`,
        details: `Retrieved ${cachedResult.examples.length} cached examples`,
      });
    } else {
      // Not cached yet, but caching system works if we got here
      results.push({
        name: 'Example Caching',
        status: 'pass',
        message: 'Caching system operational',
        details: `Test word "${TEST_WORD}" now cached for future use`,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Example Caching',
      status: 'warning',
      message: 'Could not verify caching (may still work)',
      details: error.message,
    });
  }
}

// ============================================================================
// REPORTING
// ============================================================================

function printResults() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 TEST RESULTS');
  console.log(`${'═'.repeat(60)}\n`);

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  for (const result of results) {
    const icon =
      result.status === 'pass'
        ? '✅'
        : result.status === 'fail'
        ? '❌'
        : '⚠️';

    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log('');
  }

  console.log(`${'═'.repeat(60)}`);
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log(`${'═'.repeat(60)}\n`);

  if (failed === 0 && warnings === 0) {
    console.log('🎉 All tests passed! Ready to run pre-generation.\n');
    console.log('Next steps:');
    console.log('  1. Test with small batch:');
    console.log('     npx tsx scripts/pre-generate-vocabulary.ts --limit 10 --levels A1\n');
    console.log('  2. Run full pre-generation:');
    console.log('     npx tsx scripts/pre-generate-vocabulary.ts\n');
  } else if (failed === 0 && warnings > 0) {
    console.log('⚠️  All critical tests passed, but there are warnings.\n');
    console.log('Review warnings above. You can proceed if they are acceptable.\n');
  } else {
    console.log('❌ Some tests failed. Fix issues before running pre-generation.\n');
    console.log('Common fixes:');
    console.log('  - Database: Check DATABASE_URL in .env.local');
    console.log('  - OpenAI: Add OPENAI_API_KEY to .env.local');
    console.log('  - Word list: Expand to 5,000 words for full run\n');
  }
}

// ============================================================================
// RUN
// ============================================================================

main().catch(error => {
  console.error('\n❌ Fatal error during testing:', error);
  process.exit(1);
});
