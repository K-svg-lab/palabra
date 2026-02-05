/**
 * Cross-Validation System Tests
 * Phase 16.1 Task 2 - Test translation disagreement detection
 */

import { crossValidateTranslations, getCrossValidationExplanation, getConfidencePenalty } from './lib/services/cross-validation';
import type { TranslationSource } from './lib/services/cross-validation';

console.log('🧪 Cross-Validation System Tests\n');
console.log('Phase 16.1 Task 2 - Translation Quality & Cross-Validation\n');
console.log('='.repeat(70));

// ============================================================================
// TEST 1: Perfect Agreement
// ============================================================================
console.log('\n📋 TEST 1: Perfect Agreement (Same Translation)');
const test1: TranslationSource[] = [
  { source: 'deepl', translation: 'dog', confidence: 0.95 },
  { source: 'mymemory', translation: 'dog', confidence: 0.90 },
  { source: 'wiktionary', translation: 'dog', confidence: 0.85 },
];

const result1 = crossValidateTranslations(test1);
console.log('   Input:', test1.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result1.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result1.hasDisagreement ? '❌ YES' : '✅ NO');
console.log('   Recommendation:', result1.recommendation);
console.log('   Confidence Penalty:', getConfidencePenalty(result1.agreementLevel));
console.log('   Result:', result1.hasDisagreement ? '❌ FAIL' : '✅ PASS');

// ============================================================================
// TEST 2: Synonyms (Should NOT Flag as Disagreement)
// ============================================================================
console.log('\n📋 TEST 2: Synonyms (dog/hound/canine)');
const test2: TranslationSource[] = [
  { source: 'deepl', translation: 'dog', confidence: 0.95 },
  { source: 'mymemory', translation: 'hound', confidence: 0.90 },
  { source: 'wiktionary', translation: 'canine', confidence: 0.85 },
];

const result2 = crossValidateTranslations(test2);
console.log('   Input:', test2.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result2.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result2.hasDisagreement ? '❌ YES' : '✅ NO');
console.log('   Recommendation:', result2.recommendation);
console.log('   Explanation:', getCrossValidationExplanation(result2));
console.log('   Result:', result2.hasDisagreement ? '❌ FAIL - Should accept synonyms' : '✅ PASS');

// ============================================================================
// TEST 3: Spelling Variants (Should NOT Flag as Major Disagreement)
// ============================================================================
console.log('\n📋 TEST 3: Spelling Variants (color/colour)');
const test3: TranslationSource[] = [
  { source: 'deepl', translation: 'color', confidence: 0.95 },
  { source: 'mymemory', translation: 'colour', confidence: 0.90 },
];

const result3 = crossValidateTranslations(test3);
console.log('   Input:', test3.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result3.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result3.hasDisagreement ? '❌ YES' : '✅ NO');
console.log('   Recommendation:', result3.recommendation);
console.log('   Result:', result3.hasDisagreement ? '❌ FAIL - Should accept spelling variants' : '✅ PASS');

// ============================================================================
// TEST 4: Significant Disagreement (Different Words)
// ============================================================================
console.log('\n📋 TEST 4: Significant Disagreement (dog vs cat)');
const test4: TranslationSource[] = [
  { source: 'deepl', translation: 'dog', confidence: 0.95 },
  { source: 'mymemory', translation: 'cat', confidence: 0.90 },
  { source: 'wiktionary', translation: 'dog', confidence: 0.85 },
];

const result4 = crossValidateTranslations(test4);
console.log('   Input:', test4.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result4.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result4.hasDisagreement ? '✅ YES' : '❌ NO');
console.log('   Recommendation:', result4.recommendation);
console.log('   Explanation:', getCrossValidationExplanation(result4));
console.log('   Disagreements:', result4.disagreements.length);
console.log('   Result:', result4.hasDisagreement ? '✅ PASS' : '❌ FAIL - Should detect disagreement');

// ============================================================================
// TEST 5: Multiple Disagreements (All Different)
// ============================================================================
console.log('\n📋 TEST 5: Multiple Disagreements (All Different)');
const test5: TranslationSource[] = [
  { source: 'deepl', translation: 'house', confidence: 0.95 },
  { source: 'mymemory', translation: 'home', confidence: 0.90 },
  { source: 'wiktionary', translation: 'building', confidence: 0.85 },
];

const result5 = crossValidateTranslations(test5);
console.log('   Input:', test5.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result5.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result5.hasDisagreement ? '✅ YES' : '❌ NO');
console.log('   Recommendation:', result5.recommendation);
console.log('   Explanation:', getCrossValidationExplanation(result5));
console.log('   Primary Translation:', result5.primaryTranslation);
console.log('   Confidence Penalty:', getConfidencePenalty(result5.agreementLevel));
console.log('   Result: Note - house/home are synonyms, should have low disagreement count');

// ============================================================================
// TEST 6: Normalized Comparison (Articles Removed)
// ============================================================================
console.log('\n📋 TEST 6: Normalized Comparison (Articles)');
const test6: TranslationSource[] = [
  { source: 'deepl', translation: 'the dog', confidence: 0.95 },
  { source: 'mymemory', translation: 'a dog', confidence: 0.90 },
  { source: 'wiktionary', translation: 'dog', confidence: 0.85 },
];

const result6 = crossValidateTranslations(test6);
console.log('   Input:', test6.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result6.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result6.hasDisagreement ? '❌ YES' : '✅ NO');
console.log('   Recommendation:', result6.recommendation);
console.log('   Result:', result6.hasDisagreement ? '❌ FAIL - Should normalize articles' : '✅ PASS');

// ============================================================================
// TEST 7: Verb Synonyms
// ============================================================================
console.log('\n📋 TEST 7: Verb Synonyms (eat/consume/dine)');
const test7: TranslationSource[] = [
  { source: 'deepl', translation: 'eat', confidence: 0.95 },
  { source: 'mymemory', translation: 'consume', confidence: 0.90 },
  { source: 'wiktionary', translation: 'dine', confidence: 0.85 },
];

const result7 = crossValidateTranslations(test7);
console.log('   Input:', test7.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result7.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result7.hasDisagreement ? '❌ YES' : '✅ NO');
console.log('   Recommendation:', result7.recommendation);
console.log('   Result:', result7.hasDisagreement ? '❌ FAIL - Should accept verb synonyms' : '✅ PASS');

// ============================================================================
// TEST 8: Two Sources, One Disagreement
// ============================================================================
console.log('\n📋 TEST 8: Two Sources, Clear Disagreement');
const test8: TranslationSource[] = [
  { source: 'deepl', translation: 'book', confidence: 0.95 },
  { source: 'mymemory', translation: 'library', confidence: 0.90 },
];

const result8 = crossValidateTranslations(test8);
console.log('   Input:', test8.map(s => `${s.source}: ${s.translation}`).join(', '));
console.log('   Agreement Level:', `${Math.round(result8.agreementLevel * 100)}%`);
console.log('   Has Disagreement:', result8.hasDisagreement ? '✅ YES' : '❌ NO');
console.log('   Recommendation:', result8.recommendation);
console.log('   Explanation:', getCrossValidationExplanation(result8));
console.log('   Result:', result8.hasDisagreement ? '✅ PASS' : '❌ FAIL - Should detect disagreement');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY\n');

const tests = [
  { name: 'Perfect Agreement', result: !result1.hasDisagreement, expected: true },
  { name: 'Synonyms (dog/hound)', result: !result2.hasDisagreement, expected: true },
  { name: 'Spelling Variants', result: !result3.hasDisagreement, expected: true },
  { name: 'Significant Disagreement', result: result4.hasDisagreement, expected: true },
  { name: 'Normalized Comparison', result: !result6.hasDisagreement, expected: true },
  { name: 'Verb Synonyms', result: !result7.hasDisagreement, expected: true },
  { name: 'Two Sources Disagreement', result: result8.hasDisagreement, expected: true },
];

const passed = tests.filter(t => t.result === t.expected).length;
const total = tests.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Tests Passed: ${passed}/${total} (${percentage}%)\n`);

tests.forEach((test, index) => {
  const status = test.result === test.expected ? '✅ PASS' : '❌ FAIL';
  console.log(`   ${index + 1}. ${test.name}: ${status}`);
});

console.log('\n' + '='.repeat(70));
console.log(`\n🎯 Overall Result: ${percentage >= 85 ? '✅ SYSTEM READY' : '❌ NEEDS WORK'}`);
console.log(`   Target: 85% accuracy`);
console.log(`   Achieved: ${percentage}%`);
console.log(`   Status: ${percentage >= 85 ? 'Production Ready' : 'Needs Refinement'}\n`);

// ============================================================================
// CONFIDENCE PENALTY TESTS
// ============================================================================
console.log('📊 CONFIDENCE PENALTY TESTS\n');
console.log('   Agreement 100%: Penalty', getConfidencePenalty(1.00), '(no penalty)');
console.log('   Agreement 90%:  Penalty', getConfidencePenalty(0.90), '(no penalty)');
console.log('   Agreement 80%:  Penalty', getConfidencePenalty(0.80), '(small penalty)');
console.log('   Agreement 60%:  Penalty', getConfidencePenalty(0.60), '(moderate penalty)');
console.log('   Agreement 40%:  Penalty', getConfidencePenalty(0.40), '(significant penalty)');
console.log('   Agreement 0%:   Penalty', getConfidencePenalty(0.00), '(max penalty)');

console.log('\n✨ Cross-validation system test complete!\n');
