/**
 * Standalone Word List Validation Script
 * Phase 18.1.7 - Data Quality Enhancement
 * 
 * Validates common-words-5000.json without running pre-generation.
 * Useful for checking data quality after manual edits or expansions.
 * 
 * Usage:
 *   npx tsx scripts/validate-word-list.ts
 *   npx tsx scripts/validate-word-list.ts --detailed
 *   npx tsx scripts/validate-word-list.ts --export report.json
 * 
 * Features:
 * - Validates all 7 quality checks (verb form, duplicates, translations, etc.)
 * - Detailed error reporting with actionable suggestions
 * - Optional JSON export for programmatic use
 * - Summary statistics and recommendations
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWordList, formatValidationResult, type WordEntry } from '@/lib/utils/word-list-validator';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORDS_FILE = path.join(__dirname, 'common-words-5000.json');

// Parse command line arguments
const args = process.argv.slice(2);
const isDetailed = args.includes('--detailed');
const exportIndex = args.indexOf('--export');
const exportPath = exportIndex !== -1 ? args[exportIndex + 1] : null;

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Word List Validation Script                                 ║');
  console.log('║   Phase 18.1.7: Data Quality Enhancement                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // 1. Check if word list exists
  if (!fs.existsSync(WORDS_FILE)) {
    console.error(`❌ Error: Word list not found at ${WORDS_FILE}`);
    console.error('   Please ensure the file exists before running validation.\n');
    process.exit(1);
  }

  // 2. Load word list
  console.log(`📚 Loading word list from ${WORDS_FILE}...\n`);
  
  let wordData: any;
  try {
    const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8');
    wordData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error: Failed to parse JSON file.`);
    console.error(`   ${error}\n`);
    process.exit(1);
  }

  if (!wordData.words || !Array.isArray(wordData.words)) {
    console.error(`❌ Error: Invalid word list format. Expected 'words' array.`);
    process.exit(1);
  }

  const words: WordEntry[] = wordData.words;
  console.log(`   Loaded ${words.length} words\n`);

  // 3. Run validation
  console.log('🔍 Running validation checks...\n');
  const validation = validateWordList(words);

  // 4. Display results
  if (isDetailed) {
    // Detailed output with all errors and warnings
    console.log(formatValidationResult(validation));
  } else {
    // Summary output
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`Total words: ${validation.summary.totalWords}`);
    console.log(`Critical errors: ${validation.summary.criticalErrors}`);
    console.log(`Errors: ${validation.summary.errors}`);
    console.log(`Warnings: ${validation.summary.warnings}\n`);

    if (validation.valid) {
      console.log('✅ Validation PASSED');
      console.log('   All critical checks passed. Word list is ready for processing.\n');
    } else {
      console.log('❌ Validation FAILED');
      console.log('   Critical errors detected. Please fix before proceeding.\n');
      
      // Show first 5 critical errors
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical').slice(0, 5);
      if (criticalErrors.length > 0) {
        console.log('First 5 critical errors:\n');
        criticalErrors.forEach((err, i) => {
          console.log(`${i + 1}. [${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
          console.log(`   ${err.message}`);
          if (err.suggestion) {
            console.log(`   💡 ${err.suggestion}`);
          }
          console.log('');
        });
        
        if (validation.summary.criticalErrors > 5) {
          console.log(`... and ${validation.summary.criticalErrors - 5} more critical errors.\n`);
        }
      }
      
      console.log('Run with --detailed flag to see all errors and warnings.\n');
    }
  }

  // 5. Provide recommendations
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!validation.valid) {
    const hasVerbErrors = validation.errors.some(e => e.type === 'verb_form');
    const hasDuplicates = validation.errors.some(e => e.type === 'duplicate');
    const hasTranslationErrors = validation.errors.some(e => e.type === 'translation');
    const hasRankErrors = validation.errors.some(e => e.type === 'rank');

    if (hasVerbErrors) {
      console.log('1. Fix conjugated verbs:');
      console.log('   npx tsx scripts/fix-conjugated-verbs.ts\n');
    }

    if (hasDuplicates) {
      console.log('2. Remove duplicate entries:');
      console.log('   Review and manually remove duplicates from the word list.\n');
    }

    if (hasTranslationErrors) {
      console.log('3. Fix translation issues:');
      console.log('   Add missing translations or fix placeholder values.\n');
    }

    if (hasRankErrors) {
      console.log('4. Fix rank sequence:');
      console.log('   Ensure ranks are sequential starting from 1.\n');
    }

    console.log('After fixing, re-run this validation script to verify.\n');
  } else if (validation.warnings.length > 0) {
    console.log('Word list passed validation but has warnings:');
    console.log('  - Review warnings for potential data quality improvements');
    console.log('  - Warnings are non-critical and won\'t block processing\n');
  } else {
    console.log('✅ Word list is in excellent condition!');
    console.log('   No errors or warnings detected.');
    console.log('   Ready to run pre-generation script.\n');
  }

  // 6. Export JSON report if requested
  if (exportPath) {
    const reportPath = path.isAbsolute(exportPath) 
      ? exportPath 
      : path.join(__dirname, exportPath);

    const report = {
      timestamp: new Date().toISOString(),
      wordListPath: WORDS_FILE,
      validation,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`📄 Validation report exported to: ${reportPath}\n`);
  }

  // 7. Exit with appropriate code
  if (!validation.valid) {
    console.log('❌ Validation failed. Exiting with error code 1.\n');
    process.exit(1);
  } else {
    console.log('✅ Validation successful. Exiting with code 0.\n');
    process.exit(0);
  }
}

// Run validation
try {
  main();
} catch (error) {
  console.error('❌ Unexpected error during validation:');
  console.error(error);
  process.exit(1);
}
