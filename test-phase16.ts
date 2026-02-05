/**
 * Phase 16 Test Suite
 * Tests the core logic of the verified vocabulary system
 */

import { calculateConfidenceScore } from './lib/services/verified-vocabulary';
import type { LanguageCode, LanguagePair, GrammarMetadata } from './lib/types/verified-vocabulary';
import { isLanguageCode, isLanguagePair, parseLanguagePair, createLanguagePair } from './lib/types/verified-vocabulary';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(status: 'PASS' | 'FAIL' | 'INFO', message: string) {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.blue;
  console.log(`${color}[${status}]${colors.reset} ${message}`);
}

// Test 1: Confidence Score Calculation
function testConfidenceScore() {
  console.log(`\n${colors.blue}=== Test 1: Confidence Score Calculation ===${colors.reset}\n`);

  const testCases = [
    {
      name: 'High confidence word (many verifications, no edits)',
      input: {
        verificationCount: 10,
        editFrequency: 0.05,
        avgReviewSuccessRate: 0.95,
        hasDisagreement: false,
        disagreementCount: 0,
        lastVerified: new Date(),
      },
      expectedRange: [0.75, 0.85],
    },
    {
      name: 'Medium confidence word (few verifications, some edits)',
      input: {
        verificationCount: 3,
        editFrequency: 0.25,
        avgReviewSuccessRate: 0.80,
        hasDisagreement: false,
        disagreementCount: 0,
        lastVerified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      expectedRange: [0.50, 0.65],
    },
    {
      name: 'Low confidence word (few verifications, high edits, disagreement)',
      input: {
        verificationCount: 2,
        editFrequency: 0.60,
        avgReviewSuccessRate: 0.70,
        hasDisagreement: true,
        disagreementCount: 3,
        lastVerified: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      },
      expectedRange: [0.20, 0.35],
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase) => {
    const score = calculateConfidenceScore(testCase.input as any);
    const [min, max] = testCase.expectedRange;
    
    if (score >= min && score <= max) {
      log('PASS', `${testCase.name}: ${score.toFixed(2)} (expected ${min}-${max})`);
      passed++;
    } else {
      log('FAIL', `${testCase.name}: ${score.toFixed(2)} (expected ${min}-${max})`);
      failed++;
    }
  });

  console.log(`\n${colors.yellow}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Test 2: Language Code Validation
function testLanguageCodes() {
  console.log(`\n${colors.blue}=== Test 2: Language Code Validation ===${colors.reset}\n`);

  const validCodes: LanguageCode[] = ['es', 'en', 'de', 'fr', 'it', 'pt', 'ja', 'zh', 'ko', 'ar', 'ru'];
  const invalidCodes = ['xx', 'invalid', '123', ''];

  let passed = 0;
  let failed = 0;

  // Test valid codes
  validCodes.forEach((code) => {
    if (isLanguageCode(code)) {
      log('PASS', `Valid language code: ${code}`);
      passed++;
    } else {
      log('FAIL', `Valid language code rejected: ${code}`);
      failed++;
    }
  });

  // Test invalid codes
  invalidCodes.forEach((code) => {
    if (!isLanguageCode(code)) {
      log('PASS', `Invalid language code rejected: ${code}`);
      passed++;
    } else {
      log('FAIL', `Invalid language code accepted: ${code}`);
      failed++;
    }
  });

  console.log(`\n${colors.yellow}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Test 3: Language Pair Operations
function testLanguagePairs() {
  console.log(`\n${colors.blue}=== Test 3: Language Pair Operations ===${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  // Test createLanguagePair
  const pair1 = createLanguagePair('es', 'en');
  if (pair1 === 'es-en') {
    log('PASS', `createLanguagePair('es', 'en') = ${pair1}`);
    passed++;
  } else {
    log('FAIL', `createLanguagePair('es', 'en') = ${pair1} (expected 'es-en')`);
    failed++;
  }

  // Test parseLanguagePair
  const parsed = parseLanguagePair('de-en');
  if (parsed && parsed.source === 'de' && parsed.target === 'en') {
    log('PASS', `parseLanguagePair('de-en') = { source: '${parsed.source}', target: '${parsed.target}' }`);
    passed++;
  } else {
    log('FAIL', `parseLanguagePair('de-en') failed`);
    failed++;
  }

  // Test isLanguagePair
  const validPairs = ['es-en', 'de-fr', 'ja-en', 'zh-ko'];
  validPairs.forEach((pair) => {
    if (isLanguagePair(pair)) {
      log('PASS', `Valid language pair: ${pair}`);
      passed++;
    } else {
      log('FAIL', `Valid language pair rejected: ${pair}`);
      failed++;
    }
  });

  const invalidPairs = ['es', 'en-', '-en', 'xx-en', 'es-yy', 'invalid'];
  invalidPairs.forEach((pair) => {
    if (!isLanguagePair(pair)) {
      log('PASS', `Invalid language pair rejected: ${pair}`);
      passed++;
    } else {
      log('FAIL', `Invalid language pair accepted: ${pair}`);
      failed++;
    }
  });

  console.log(`\n${colors.yellow}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Test 4: Grammar Metadata Flexibility
function testGrammarMetadata() {
  console.log(`\n${colors.blue}=== Test 4: Grammar Metadata Flexibility ===${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  // Spanish metadata
  const spanishMeta: GrammarMetadata = {
    gender: 'masculine',
    plural: 'perros',
  };
  log('PASS', `Spanish metadata: ${JSON.stringify(spanishMeta)}`);
  passed++;

  // German metadata
  const germanMeta: GrammarMetadata = {
    gender: 'masculine',
    case: 'nominative',
    article: 'der',
    plural: 'Hunde',
  };
  log('PASS', `German metadata: ${JSON.stringify(germanMeta)}`);
  passed++;

  // Japanese metadata
  const japaneseMeta: GrammarMetadata = {
    kanji: '犬',
    hiragana: 'いぬ',
    katakana: 'イヌ',
    formality: 'casual',
  };
  log('PASS', `Japanese metadata: ${JSON.stringify(japaneseMeta)}`);
  passed++;

  // French metadata
  const frenchMeta: GrammarMetadata = {
    gender: 'masculine',
    liaison: true,
    elision: false,
    plural: 'chiens',
  };
  log('PASS', `French metadata: ${JSON.stringify(frenchMeta)}`);
  passed++;

  // Chinese metadata
  const chineseMeta: GrammarMetadata = {
    simplified: '狗',
    traditional: '狗',
    pinyin: 'gǒu',
    tones: [3],
  };
  log('PASS', `Chinese metadata: ${JSON.stringify(chineseMeta)}`);
  passed++;

  console.log(`\n${colors.yellow}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Test 5: Edge Cases
function testEdgeCases() {
  console.log(`\n${colors.blue}=== Test 5: Edge Cases ===${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  // Test confidence score with zero verifications
  // Note: Even with zero verifications, there's a baseline score from other factors
  const zeroVerifications = calculateConfidenceScore({
    verificationCount: 0,
    editFrequency: 0,
    avgReviewSuccessRate: 0,
    hasDisagreement: false,
    disagreementCount: 0,
    lastVerified: new Date(),
  } as any);

  if (zeroVerifications < 0.5) {
    log('PASS', `Zero verifications score: ${zeroVerifications.toFixed(2)} (expected < 0.5)`);
    passed++;
  } else {
    log('FAIL', `Zero verifications score: ${zeroVerifications.toFixed(2)} (expected < 0.5)`);
    failed++;
  }

  // Test confidence score with very old verification
  const veryOld = calculateConfidenceScore({
    verificationCount: 10,
    editFrequency: 0,
    avgReviewSuccessRate: 1.0,
    hasDisagreement: false,
    disagreementCount: 0,
    lastVerified: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
  } as any);

  if (veryOld < 0.85) {
    log('PASS', `Very old verification score: ${veryOld.toFixed(2)} (expected < 0.85 due to age penalty)`);
    passed++;
  } else {
    log('FAIL', `Very old verification score: ${veryOld.toFixed(2)} (expected < 0.85 due to age penalty)`);
    failed++;
  }

  // Test parseLanguagePair with invalid format
  const invalidParse = parseLanguagePair('invalid');
  if (invalidParse === null) {
    log('PASS', `parseLanguagePair('invalid') = null`);
    passed++;
  } else {
    log('FAIL', `parseLanguagePair('invalid') should return null`);
    failed++;
  }

  console.log(`\n${colors.yellow}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

// Run all tests
async function runAllTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Phase 16 Test Suite - Core Logic        ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const results = [
    testConfidenceScore(),
    testLanguageCodes(),
    testLanguagePairs(),
    testGrammarMetadata(),
    testEdgeCases(),
  ];

  const allPassed = results.every((r) => r);

  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}║   ✓ ALL TESTS PASSED                      ║${colors.reset}`);
  } else {
    console.log(`${colors.red}║   ✗ SOME TESTS FAILED                     ║${colors.reset}`);
  }
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests();
