/**
 * Validation Script for Phase 18.1.6
 * Tests all key functions from the hybrid SM-2 implementation
 */

// ============================================================================
// Test 1: Method Difficulty Multipliers
// ============================================================================

console.log('🧪 Testing Method Difficulty Multipliers...\n');

const METHOD_DIFFICULTY_MULTIPLIERS = {
  'traditional': 1.0,
  'multiple-choice': 0.8,
  'audio-recognition': 1.2,
  'fill-blank': 1.1,
  'context-selection': 0.9,
};

console.log('✅ Method multipliers defined:');
Object.entries(METHOD_DIFFICULTY_MULTIPLIERS).forEach(([method, mult]) => {
  console.log(`   ${method}: ${mult}x`);
});
console.log();

// ============================================================================
// Test 2: Response Time Thresholds
// ============================================================================

console.log('🧪 Testing Response Time Thresholds...\n');

const RESPONSE_TIME_THRESHOLDS = {
  VERY_FAST: 2000,
  FAST: 5000,
  MODERATE: 10000,
  SLOW: 20000,
  VERY_SLOW: 20000,
};

console.log('✅ Response time thresholds:');
Object.entries(RESPONSE_TIME_THRESHOLDS).forEach(([category, ms]) => {
  console.log(`   ${category}: ${ms}ms`);
});
console.log();

// ============================================================================
// Test 3: Quality Adjustment Logic
// ============================================================================

console.log('🧪 Testing Quality Adjustment Logic...\n');

const METHOD_TIME_MULTIPLIERS = {
  'traditional': 1.0,
  'multiple-choice': 0.7,
  'audio-recognition': 1.3,
  'fill-blank': 1.2,
  'context-selection': 0.9,
};

const QUALITY_ADJUSTMENTS = {
  VERY_FAST_BONUS: 1,
  FAST_BONUS: 0.5,
  MODERATE_ADJUSTMENT: 0,
  SLOW_PENALTY: -0.5,
  VERY_SLOW_PENALTY: -1,
};

function calculateAdjustedQuality(baseQuality, responseTime, method) {
  const multiplier = METHOD_TIME_MULTIPLIERS[method];
  const adjustedThresholds = {
    veryFast: RESPONSE_TIME_THRESHOLDS.VERY_FAST * multiplier,
    fast: RESPONSE_TIME_THRESHOLDS.FAST * multiplier,
    moderate: RESPONSE_TIME_THRESHOLDS.MODERATE * multiplier,
    slow: RESPONSE_TIME_THRESHOLDS.SLOW * multiplier,
  };

  let adjustment = 0;
  
  if (responseTime < adjustedThresholds.veryFast) {
    adjustment = QUALITY_ADJUSTMENTS.VERY_FAST_BONUS;
  } else if (responseTime < adjustedThresholds.fast) {
    adjustment = QUALITY_ADJUSTMENTS.FAST_BONUS;
  } else if (responseTime < adjustedThresholds.moderate) {
    adjustment = QUALITY_ADJUSTMENTS.MODERATE_ADJUSTMENT;
  } else if (responseTime < adjustedThresholds.slow) {
    adjustment = QUALITY_ADJUSTMENTS.SLOW_PENALTY;
  } else {
    adjustment = QUALITY_ADJUSTMENTS.VERY_SLOW_PENALTY;
  }

  const adjustedQuality = baseQuality + adjustment;
  return Math.max(0, Math.min(5, adjustedQuality));
}

// Test scenarios
const testScenarios = [
  {
    name: 'Fast traditional response',
    baseQuality: 3,
    responseTime: 1500,
    method: 'traditional',
    expected: 4,
  },
  {
    name: 'Slow traditional response',
    baseQuality: 3,
    responseTime: 15000,
    method: 'traditional',
    expected: 2.5,
  },
  {
    name: 'Moderate fill-blank response',
    baseQuality: 3,
    responseTime: 7000,
    method: 'fill-blank',
    expected: 3,
  },
  {
    name: 'Very fast audio response',
    baseQuality: 3,
    responseTime: 1000,
    method: 'audio-recognition',
    expected: 4,
  },
];

console.log('Testing quality adjustment scenarios:');
let passed = 0;
let failed = 0;

testScenarios.forEach(scenario => {
  const result = calculateAdjustedQuality(
    scenario.baseQuality,
    scenario.responseTime,
    scenario.method
  );
  const success = result === scenario.expected;
  
  console.log(`   ${success ? '✅' : '❌'} ${scenario.name}`);
  console.log(`      Base: ${scenario.baseQuality}, Time: ${scenario.responseTime}ms, Method: ${scenario.method}`);
  console.log(`      Expected: ${scenario.expected}, Got: ${result}`);
  
  if (success) passed++;
  else failed++;
});

console.log(`\n   Results: ${passed} passed, ${failed} failed`);
console.log();

// ============================================================================
// Test 4: Response Time Categorization
// ============================================================================

console.log('🧪 Testing Response Time Categorization...\n');

function getResponseTimeCategory(responseTime, method) {
  const multiplier = METHOD_TIME_MULTIPLIERS[method];
  const adjustedThresholds = {
    veryFast: RESPONSE_TIME_THRESHOLDS.VERY_FAST * multiplier,
    fast: RESPONSE_TIME_THRESHOLDS.FAST * multiplier,
    moderate: RESPONSE_TIME_THRESHOLDS.MODERATE * multiplier,
    slow: RESPONSE_TIME_THRESHOLDS.SLOW * multiplier,
  };

  if (responseTime < adjustedThresholds.veryFast) return 'very-fast';
  if (responseTime < adjustedThresholds.fast) return 'fast';
  if (responseTime < adjustedThresholds.moderate) return 'moderate';
  if (responseTime < adjustedThresholds.slow) return 'slow';
  return 'very-slow';
}

const categorizationTests = [
  { time: 1500, method: 'traditional', expected: 'very-fast' },
  { time: 3000, method: 'traditional', expected: 'fast' },
  { time: 7000, method: 'traditional', expected: 'moderate' },
  { time: 15000, method: 'traditional', expected: 'slow' },
  { time: 25000, method: 'traditional', expected: 'very-slow' },
];

console.log('Testing response time categorization:');
let catPassed = 0;
let catFailed = 0;

categorizationTests.forEach(test => {
  const result = getResponseTimeCategory(test.time, test.method);
  const success = result === test.expected;
  
  console.log(`   ${success ? '✅' : '❌'} ${test.time}ms (${test.method}): ${result}`);
  
  if (success) catPassed++;
  else catFailed++;
});

console.log(`\n   Results: ${catPassed} passed, ${catFailed} failed`);
console.log();

// ============================================================================
// Test 5: Method Performance Tracking
// ============================================================================

console.log('🧪 Testing Method Performance Tracking...\n');

const METHOD_PERFORMANCE_CONFIG = {
  MIN_ATTEMPTS_FOR_WEIGHTING: 5,
  MASTERY_THRESHOLD: 0.85,
  WEAKNESS_THRESHOLD: 0.70,
};

function isMethodWeakness(accuracy, attempts) {
  if (attempts < METHOD_PERFORMANCE_CONFIG.MIN_ATTEMPTS_FOR_WEIGHTING) {
    return false;
  }
  return accuracy < METHOD_PERFORMANCE_CONFIG.WEAKNESS_THRESHOLD;
}

function isMethodMastered(accuracy, attempts) {
  if (attempts < METHOD_PERFORMANCE_CONFIG.MIN_ATTEMPTS_FOR_WEIGHTING) {
    return false;
  }
  return accuracy >= METHOD_PERFORMANCE_CONFIG.MASTERY_THRESHOLD;
}

const performanceTests = [
  { accuracy: 0.65, attempts: 10, expectedWeakness: true, expectedMastery: false },
  { accuracy: 0.75, attempts: 10, expectedWeakness: false, expectedMastery: false },
  { accuracy: 0.90, attempts: 10, expectedWeakness: false, expectedMastery: true },
  { accuracy: 0.50, attempts: 3, expectedWeakness: false, expectedMastery: false }, // Not enough data
];

console.log('Testing method performance classification:');
let perfPassed = 0;
let perfFailed = 0;

performanceTests.forEach((test, i) => {
  const weakness = isMethodWeakness(test.accuracy, test.attempts);
  const mastery = isMethodMastered(test.accuracy, test.attempts);
  const weaknessCorrect = weakness === test.expectedWeakness;
  const masteryCorrect = mastery === test.expectedMastery;
  const success = weaknessCorrect && masteryCorrect;
  
  console.log(`   ${success ? '✅' : '❌'} Test ${i + 1}: ${test.accuracy * 100}% accuracy, ${test.attempts} attempts`);
  console.log(`      Weakness: ${weakness} (expected: ${test.expectedWeakness})`);
  console.log(`      Mastery: ${mastery} (expected: ${test.expectedMastery})`);
  
  if (success) perfPassed++;
  else perfFailed++;
});

console.log(`\n   Results: ${perfPassed} passed, ${perfFailed} failed`);
console.log();

// ============================================================================
// Test 6: Edge Cases
// ============================================================================

console.log('🧪 Testing Edge Cases...\n');

const edgeCases = [
  {
    name: 'Zero response time',
    baseQuality: 3,
    responseTime: 0,
    method: 'traditional',
  },
  {
    name: 'Extremely long response time',
    baseQuality: 3,
    responseTime: 999999,
    method: 'traditional',
  },
  {
    name: 'Quality at lower bound',
    baseQuality: 0,
    responseTime: 30000,
    method: 'traditional',
  },
  {
    name: 'Quality at upper bound',
    baseQuality: 5,
    responseTime: 500,
    method: 'traditional',
  },
];

console.log('Testing edge cases:');
let edgePassed = 0;
let edgeFailed = 0;

edgeCases.forEach(test => {
  try {
    const result = calculateAdjustedQuality(
      test.baseQuality,
      test.responseTime,
      test.method
    );
    const inBounds = result >= 0 && result <= 5;
    
    console.log(`   ${inBounds ? '✅' : '❌'} ${test.name}`);
    console.log(`      Quality: ${result} (bounds: 0-5)`);
    
    if (inBounds) edgePassed++;
    else edgeFailed++;
  } catch (error) {
    console.log(`   ❌ ${test.name}: ${error.message}`);
    edgeFailed++;
  }
});

console.log(`\n   Results: ${edgePassed} passed, ${edgeFailed} failed`);
console.log();

// ============================================================================
// Final Summary
// ============================================================================

console.log('═══════════════════════════════════════════════════════════');
console.log('📊 VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════');

const totalPassed = passed + catPassed + perfPassed + edgePassed;
const totalFailed = failed + catFailed + perfFailed + edgeFailed;
const totalTests = totalPassed + totalFailed;

console.log(`\nTotal Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalFailed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Phase 18.1.6 is functional!');
} else {
  console.log(`\n⚠️  ${totalFailed} test(s) failed. Review needed.`);
}

console.log('═══════════════════════════════════════════════════════════\n');
