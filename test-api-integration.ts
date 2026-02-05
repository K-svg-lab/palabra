/**
 * Test Phase 16 API integration with real database
 */

import { lookupVerifiedWord } from './lib/services/verified-vocabulary';

async function testAPIIntegration() {
  console.log('🧪 Testing Phase 16 API Integration...\n');

  try {
    // Test 1: Lookup cached word
    console.log('1. Testing cache lookup for "perro"...');
    const result = await lookupVerifiedWord('perro', 'es-en');
    
    if (result) {
      console.log('   ✅ Cache hit successful!');
      console.log('   Word:', result.sourceWord);
      console.log('   Translation:', result.targetWord);
      console.log('   Alternatives:', result.alternativeTranslations);
      console.log('   Confidence:', result.confidenceScore);
      console.log('   Verifications:', result.verificationCount);
      console.log('   Grammar:', result.grammarMetadata);
      console.log();
    } else {
      console.log('   ❌ Cache miss (word not in cache)');
      console.log();
    }

    // Test 2: Lookup non-existent word
    console.log('2. Testing cache lookup for "gato" (not in cache)...');
    const result2 = await lookupVerifiedWord('gato', 'es-en');
    
    if (result2) {
      console.log('   ❌ Unexpected cache hit');
      console.log();
    } else {
      console.log('   ✅ Cache miss as expected');
      console.log();
    }

    // Test 3: Test different language pair
    console.log('3. Testing cache lookup for "perro" with different language pair...');
    const result3 = await lookupVerifiedWord('perro', 'es-fr' as any);
    
    if (result3) {
      console.log('   ❌ Unexpected cache hit');
      console.log();
    } else {
      console.log('   ✅ Cache miss as expected (different language pair)');
      console.log();
    }

    // Test 4: Test case insensitivity
    console.log('4. Testing case insensitivity with "PERRO"...');
    const result4 = await lookupVerifiedWord('PERRO', 'es-en');
    
    if (result4) {
      console.log('   ✅ Cache hit successful (case insensitive)');
      console.log('   Word:', result4.sourceWord);
      console.log();
    } else {
      console.log('   ❌ Cache miss (case insensitivity failed)');
      console.log();
    }

    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  ✅ API INTEGRATION TESTS COMPLETE        ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testAPIIntegration();
