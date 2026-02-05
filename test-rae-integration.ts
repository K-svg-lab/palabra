/**
 * RAE Integration Tests
 * Phase 16.1 Task 3 - Test RAE API integration
 */

import { getRaeDefinition, mapRaeCategoryToPartOfSpeech } from './lib/services/rae';

console.log('🧪 RAE Integration Tests\n');
console.log('Phase 16.1 Task 3 - RAE API Integration');
console.log('Testing with rae-api.com (unofficial RAE API)\n');
console.log('='.repeat(70));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function testWord(word: string, expectedCategory?: string, expectedGender?: string) {
  console.log(`\n📋 Testing: "${word}"`);
  
  try {
    const startTime = Date.now();
    const result = await getRaeDefinition(word);
    const responseTime = Date.now() - startTime;
    
    if (!result) {
      console.log(`   ❌ Not found in RAE dictionary`);
      console.log(`   Response time: ${responseTime}ms`);
      return false;
    }
    
    console.log(`   ✅ Found in RAE`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Category: ${result.category || 'unknown'}`);
    console.log(`   Gender: ${result.gender || 'none'}`);
    console.log(`   Usage: ${result.usage || 'common'}`);
    console.log(`   Definitions: ${result.definitions.length}`);
    console.log(`   First definition: "${result.definitions[0]?.substring(0, 80)}..."`);
    
    if (result.etymology) {
      console.log(`   Etymology: "${result.etymology.substring(0, 60)}..."`);
    }
    
    if (result.synonyms && result.synonyms.length > 0) {
      console.log(`   Synonyms: ${result.synonyms.slice(0, 3).join(', ')}`);
    }
    
    if (result.antonyms && result.antonyms.length > 0) {
      console.log(`   Antonyms: ${result.antonyms.slice(0, 3).join(', ')}`);
    }
    
    if (result.conjugations) {
      console.log(`   Conjugations: infinitive="${result.conjugations.infinitive}", gerund="${result.conjugations.gerund}"`);
    }
    
    // Validate expected values
    let validationPassed = true;
    
    if (expectedCategory && result.category !== expectedCategory) {
      console.log(`   ⚠️ Expected category: ${expectedCategory}, got: ${result.category}`);
      validationPassed = false;
    }
    
    if (expectedGender && result.gender !== expectedGender) {
      console.log(`   ⚠️ Expected gender: ${expectedGender}, got: ${result.gender}`);
      validationPassed = false;
    }
    
    console.log(`   Result: ${validationPassed ? '✅ PASS' : '⚠️ PARTIAL'}`);
    return validationPassed;
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  const results: { name: string; passed: boolean }[] = [];
  
  // Test 1: Common noun (masculine)
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Common Noun (Masculine)');
  const test1 = await testWord('perro', 'noun', 'masculine');
  results.push({ name: 'Common noun (perro)', passed: test1 });
  
  // Test 2: Common noun (feminine)
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Common Noun (Feminine)');
  const test2 = await testWord('casa', 'noun', 'feminine');
  results.push({ name: 'Common noun (casa)', passed: test2 });
  
  // Test 3: Verb
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Verb');
  const test3 = await testWord('comer', 'verb');
  results.push({ name: 'Verb (comer)', passed: test3 });
  
  // Test 4: Adjective
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Adjective');
  const test4 = await testWord('grande', 'adjective');
  results.push({ name: 'Adjective (grande)', passed: test4 });
  
  // Test 5: Adverb
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Adverb');
  const test5 = await testWord('rápidamente', 'adverb');
  results.push({ name: 'Adverb (rápidamente)', passed: test5 });
  
  // Test 6: Word with accent
  console.log('\n' + '='.repeat(70));
  console.log('TEST 6: Word with Accent');
  const test6 = await testWord('árbol', 'noun', 'masculine');
  results.push({ name: 'Accented word (árbol)', passed: test6 });
  
  // Test 7: Irregular verb
  console.log('\n' + '='.repeat(70));
  console.log('TEST 7: Irregular Verb');
  const test7 = await testWord('ser', 'verb');
  results.push({ name: 'Irregular verb (ser)', passed: test7 });
  
  // Test 8: Word not in dictionary (should return null)
  console.log('\n' + '='.repeat(70));
  console.log('TEST 8: Word Not Found (Expected)');
  const test8 = await testWord('xyzabc123');
  results.push({ name: 'Word not found', passed: !test8 }); // Should be false (not found)
  
  // Test 9: Word with multiple meanings
  console.log('\n' + '='.repeat(70));
  console.log('TEST 9: Word with Multiple Meanings');
  const test9 = await testWord('banco'); // Can be bank or bench
  results.push({ name: 'Polysemous word (banco)', passed: test9 });
  
  // Test 10: Common greeting
  console.log('\n' + '='.repeat(70));
  console.log('TEST 10: Common Word (Greeting)');
  const test10 = await testWord('hola');
  results.push({ name: 'Common word (hola)', passed: test10 });
  
  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`Tests Passed: ${passed}/${total} (${percentage}%)\n`);
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${index + 1}. ${result.name}: ${status}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n🎯 Overall Result: ${percentage >= 80 ? '✅ SYSTEM READY' : '❌ NEEDS WORK'}`);
  console.log(`   Target: 80% accuracy (some words may not be in RAE)`);
  console.log(`   Achieved: ${percentage}%`);
  console.log(`   Status: ${percentage >= 80 ? 'Production Ready' : 'Needs Investigation'}\n`);
  
  // ============================================================================
  // CATEGORY MAPPING TEST
  // ============================================================================
  console.log('📊 CATEGORY MAPPING TESTS\n');
  
  const categories = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'article', 'preposition', 'conjunction', 'interjection'];
  
  categories.forEach(category => {
    const mapped = mapRaeCategoryToPartOfSpeech(category as any);
    console.log(`   ${category.padEnd(15)} → ${mapped || 'undefined'}`);
  });
  
  console.log('\n✨ RAE integration test complete!\n');
  
  // ============================================================================
  // RATE LIMIT INFO
  // ============================================================================
  console.log('ℹ️  RATE LIMIT INFO:\n');
  console.log('   Free tier: 10 requests/minute, 100/day');
  console.log('   This test suite made ~10 requests');
  console.log('   If tests fail with 429 errors, wait 1 minute and retry');
  console.log('   For higher limits, get free Developer API key:');
  console.log('   https://github.com/rae-api-com/.github/issues/new?template=api-key-request.md\n');
}

// Run tests
runTests().catch(console.error);
