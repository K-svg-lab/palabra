import { getRaeDefinition } from './lib/services/rae';

async function testSingle() {
  console.log('\n🧪 Testing RAE with "libro" (book - masculine)\n');
  
  const result = await getRaeDefinition('libro');
  
  if (!result) {
    console.log('❌ Not found or error');
    return;
  }
  
  console.log('✅ Found in RAE');
  console.log('   Word:', result.word);
  console.log('   Category:', result.category);
  console.log('   Gender:', result.gender);
  console.log('   Definitions:', result.definitions.length);
  console.log('   First def:', result.definitions[0]?.substring(0, 100));
  console.log('   Confidence:', result.confidence);
  console.log('\n' + (result.gender === 'masculine' ? '✅ Gender extraction works!' : '⚠️ Gender still needs work'));
}

testSingle();
