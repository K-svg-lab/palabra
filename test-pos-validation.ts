/**
 * POS Validation Test Suite (Phase 16.1)
 * 
 * Tests the validateExamplePOS() function with 50+ common Spanish words
 * to verify >90% accuracy in detecting correct part of speech usage.
 */

import { validateExamplePOS } from './lib/services/pos-validation';
import type { PartOfSpeech } from './lib/types/vocabulary';

interface TestCase {
  word: string;
  pos: PartOfSpeech;
  sentence: string;
  expected: 'valid' | 'invalid';
  description: string;
}

const testCases: TestCase[] = [
  // ============================================
  // NOUNS (20 tests)
  // ============================================
  {
    word: 'perro',
    pos: 'noun',
    sentence: 'El perro está en el parque.',
    expected: 'valid',
    description: 'Noun with definite article',
  },
  {
    word: 'libro',
    pos: 'noun',
    sentence: 'El libro es interesante.',
    expected: 'valid',
    description: 'Noun with copular verb',
  },
  {
    word: 'libro',
    pos: 'noun',
    sentence: 'Yo libro muchas batallas.', // "libro" as verb here!
    expected: 'invalid',
    description: 'Word used as verb, not noun',
  },
  {
    word: 'casa',
    pos: 'noun',
    sentence: 'Mi casa es grande.',
    expected: 'valid',
    description: 'Noun with possessive',
  },
  {
    word: 'gato',
    pos: 'noun',
    sentence: 'Un gato negro.',
    expected: 'valid',
    description: 'Noun with indefinite article',
  },
  {
    word: 'mesa',
    pos: 'noun',
    sentence: 'La mesa de madera.',
    expected: 'valid',
    description: 'Noun with preposition',
  },
  {
    word: 'ciudad',
    pos: 'noun',
    sentence: 'Esta ciudad es hermosa.',
    expected: 'valid',
    description: 'Noun with demonstrative',
  },
  {
    word: 'niño',
    pos: 'noun',
    sentence: 'El niño juega en el parque.',
    expected: 'valid',
    description: 'Noun as subject',
  },
  {
    word: 'mujer',
    pos: 'noun',
    sentence: 'La mujer trabaja aquí.',
    expected: 'valid',
    description: 'Noun with article and verb',
  },
  {
    word: 'agua',
    pos: 'noun',
    sentence: 'El agua está fría.',
    expected: 'valid',
    description: 'Feminine noun with masculine article',
  },
  {
    word: 'amigo',
    pos: 'noun',
    sentence: 'Mi amigo es alto.',
    expected: 'valid',
    description: 'Noun with possessive adjective',
  },
  {
    word: 'coche',
    pos: 'noun',
    sentence: 'El coche rojo.',
    expected: 'valid',
    description: 'Noun modified by adjective',
  },
  {
    word: 'tiempo',
    pos: 'noun',
    sentence: 'No tengo tiempo.',
    expected: 'valid',
    description: 'Noun as direct object',
  },
  {
    word: 'padre',
    pos: 'noun',
    sentence: 'Su padre es médico.',
    expected: 'valid',
    description: 'Noun with possessive pronoun',
  },
  {
    word: 'problema',
    pos: 'noun',
    sentence: 'Es un problema difícil.',
    expected: 'valid',
    description: 'Masculine noun ending in -a',
  },
  {
    word: 'mano',
    pos: 'noun',
    sentence: 'Tu mano es grande.',
    expected: 'valid',
    description: 'Feminine noun ending in -o',
  },
  {
    word: 'universidad',
    pos: 'noun',
    sentence: 'La universidad está cerrada.',
    expected: 'valid',
    description: 'Noun ending in -dad',
  },
  {
    word: 'nación',
    pos: 'noun',
    sentence: 'La nación unida.',
    expected: 'valid',
    description: 'Noun ending in -ción',
  },
  {
    word: 'sol',
    pos: 'noun',
    sentence: 'El sol brilla.',
    expected: 'valid',
    description: 'Noun ending in consonant',
  },
  {
    word: 'árbol',
    pos: 'noun',
    sentence: 'Ese árbol es viejo.',
    expected: 'valid',
    description: 'Noun with demonstrative ese',
  },

  // ============================================
  // VERBS (20 tests)
  // ============================================
  {
    word: 'comer',
    pos: 'verb',
    sentence: 'Yo como pizza.',
    expected: 'valid',
    description: 'Verb with subject pronoun',
  },
  {
    word: 'hablar',
    pos: 'verb',
    sentence: 'Ella habla español.',
    expected: 'valid',
    description: 'Verb conjugated with subject',
  },
  {
    word: 'vivir',
    pos: 'verb',
    sentence: 'Nosotros vivimos aquí.',
    expected: 'valid',
    description: 'Verb with plural subject',
  },
  {
    word: 'estudiar',
    pos: 'verb',
    sentence: 'Tú estudias mucho.',
    expected: 'valid',
    description: 'Verb with tú form',
  },
  {
    word: 'trabajar',
    pos: 'verb',
    sentence: 'Ellos trabajan todos los días.',
    expected: 'valid',
    description: 'Verb with ellos',
  },
  {
    word: 'cantar',
    pos: 'verb',
    sentence: 'Me gusta cantar.',
    expected: 'valid',
    description: 'Infinitive verb after gusta',
  },
  {
    word: 'correr',
    pos: 'verb',
    sentence: 'El perro corre rápido.', // "El perro" is subject, not article+verb
    expected: 'valid',
    description: 'Verb after noun subject',
  },
  {
    word: 'escribir',
    pos: 'verb',
    sentence: 'Yo escribo una carta.',
    expected: 'valid',
    description: 'Verb with direct object',
  },
  {
    word: 'leer',
    pos: 'verb',
    sentence: 'Ella lee libros.',
    expected: 'valid',
    description: 'Verb with object',
  },
  {
    word: 'beber',
    pos: 'verb',
    sentence: 'Él bebe agua.',
    expected: 'valid',
    description: 'Verb with él',
  },
  {
    word: 'comprar',
    pos: 'verb',
    sentence: 'Nosotros compramos comida.',
    expected: 'valid',
    description: 'Verb in present tense',
  },
  {
    word: 'vender',
    pos: 'verb',
    sentence: 'Ellos venden coches.',
    expected: 'valid',
    description: 'Verb with plural subject',
  },
  {
    word: 'abrir',
    pos: 'verb',
    sentence: 'Yo abro la puerta.',
    expected: 'valid',
    description: 'Verb with direct object',
  },
  {
    word: 'cerrar',
    pos: 'verb',
    sentence: 'Tú cierras la ventana.',
    expected: 'valid',
    description: 'Stem-changing verb',
  },
  {
    word: 'pensar',
    pos: 'verb',
    sentence: 'Yo pienso en ti.',
    expected: 'valid',
    description: 'Verb with preposition',
  },
  {
    word: 'decir',
    pos: 'verb',
    sentence: 'Él dice la verdad.',
    expected: 'valid',
    description: 'Irregular verb',
  },
  {
    word: 'hacer',
    pos: 'verb',
    sentence: 'Nosotros hacemos la tarea.',
    expected: 'valid',
    description: 'Irregular hacer',
  },
  {
    word: 'tener',
    pos: 'verb',
    sentence: 'Ella tiene un perro.',
    expected: 'valid',
    description: 'Irregular tener',
  },
  {
    word: 'ir',
    pos: 'verb',
    sentence: 'Yo voy al parque.',
    expected: 'valid',
    description: 'Highly irregular ir',
  },
  {
    word: 'salir',
    pos: 'verb',
    sentence: 'Ellos salen temprano.',
    expected: 'valid',
    description: 'Verb salir conjugated',
  },

  // ============================================
  // ADJECTIVES (15 tests)
  // ============================================
  {
    word: 'grande',
    pos: 'adjective',
    sentence: 'Una casa grande.',
    expected: 'valid',
    description: 'Adjective after noun',
  },
  {
    word: 'pequeño',
    pos: 'adjective',
    sentence: 'El perro pequeño.',
    expected: 'valid',
    description: 'Adjective after noun',
  },
  {
    word: 'rojo',
    pos: 'adjective',
    sentence: 'El coche rojo.',
    expected: 'valid',
    description: 'Color adjective',
  },
  {
    word: 'feliz',
    pos: 'adjective',
    sentence: 'Ella es feliz.',
    expected: 'valid',
    description: 'Adjective with ser',
  },
  {
    word: 'cansado',
    pos: 'adjective',
    sentence: 'Estoy cansado.',
    expected: 'valid',
    description: 'Adjective with estar',
  },
  {
    word: 'bonito',
    pos: 'adjective',
    sentence: 'Un día bonito.',
    expected: 'valid',
    description: 'Adjective modifying día',
  },
  {
    word: 'difícil',
    pos: 'adjective',
    sentence: 'Es un problema difícil.',
    expected: 'valid',
    description: 'Adjective after noun',
  },
  {
    word: 'interesante',
    pos: 'adjective',
    sentence: 'Un libro interesante.',
    expected: 'valid',
    description: 'Adjective ending in -ante',
  },
  {
    word: 'importante',
    pos: 'adjective',
    sentence: 'Es muy importante.',
    expected: 'valid',
    description: 'Adjective with muy',
  },
  {
    word: 'nuevo',
    pos: 'adjective',
    sentence: 'Mi coche nuevo.',
    expected: 'valid',
    description: 'Possessive + noun + adjective',
  },
  {
    word: 'viejo',
    pos: 'adjective',
    sentence: 'Un hombre viejo.',
    expected: 'valid',
    description: 'Adjective after noun',
  },
  {
    word: 'alto',
    pos: 'adjective',
    sentence: 'Es más alto que yo.',
    expected: 'valid',
    description: 'Comparative structure',
  },
  {
    word: 'bajo',
    pos: 'adjective',
    sentence: 'La mesa es baja.',
    expected: 'valid',
    description: 'Predicate adjective',
  },
  {
    word: 'hermoso',
    pos: 'adjective',
    sentence: 'Una flor hermosa.',
    expected: 'valid',
    description: 'Adjective ending in -oso',
  },
  {
    word: 'triste',
    pos: 'adjective',
    sentence: 'Él está triste.',
    expected: 'valid',
    description: 'Emotional adjective',
  },

  // ============================================
  // ADVERBS (5 tests)
  // ============================================
  {
    word: 'rápidamente',
    pos: 'adverb',
    sentence: 'Ella corre rápidamente.',
    expected: 'valid',
    description: 'Adverb ending in -mente',
  },
  {
    word: 'siempre',
    pos: 'adverb',
    sentence: 'Siempre estudio español.',
    expected: 'valid',
    description: 'Time adverb',
  },
  {
    word: 'nunca',
    pos: 'adverb',
    sentence: 'Nunca como carne.',
    expected: 'valid',
    description: 'Negation adverb',
  },
  {
    word: 'muy',
    pos: 'adverb',
    sentence: 'Es muy grande.',
    expected: 'valid',
    description: 'Degree adverb',
  },
  {
    word: 'bien',
    pos: 'adverb',
    sentence: 'Ella habla bien español.',
    expected: 'valid',
    description: 'Manner adverb',
  },
];

// Run tests
function runTests() {
  console.log('🧪 Running POS Validation Tests\n');
  console.log('='.repeat(80));
  
  let passCount = 0;
  let failCount = 0;
  const failures: Array<{ test: TestCase; result: any }> = [];

  for (const test of testCases) {
    const result = validateExamplePOS(test.sentence, test.word, test.pos);
    const passed = test.expected === 'valid' ? result.isValid : !result.isValid;

    if (passed) {
      passCount++;
      console.log(`✅ PASS: ${test.description}`);
      console.log(`   Word: "${test.word}" (${test.pos})`);
      console.log(`   Sentence: "${test.sentence}"`);
      console.log(`   Expected: ${test.expected}, Got: ${result.isValid ? 'valid' : 'invalid'} (confidence: ${result.confidence.toFixed(2)})`);
    } else {
      failCount++;
      console.log(`❌ FAIL: ${test.description}`);
      console.log(`   Word: "${test.word}" (${test.pos})`);
      console.log(`   Sentence: "${test.sentence}"`);
      console.log(`   Expected: ${test.expected}, Got: ${result.isValid ? 'valid' : 'invalid'} (confidence: ${result.confidence.toFixed(2)})`);
      console.log(`   Reason: ${result.reason}`);
      failures.push({ test, result });
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n📊 TEST RESULTS:\n');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passCount} (${((passCount / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failCount} (${((failCount / testCases.length) * 100).toFixed(1)}%)`);
  
  const accuracy = (passCount / testCases.length) * 100;
  console.log(`\n🎯 Accuracy: ${accuracy.toFixed(1)}%`);
  
  if (accuracy >= 90) {
    console.log('✨ SUCCESS: Achieved >90% accuracy target! ✨');
  } else {
    console.log('⚠️  WARNING: Below 90% accuracy target.');
    console.log('\nFailed Tests:');
    failures.forEach(({ test, result }, i) => {
      console.log(`\n${i + 1}. ${test.description}`);
      console.log(`   Expected: ${test.expected}, Got: ${result.isValid ? 'valid' : 'invalid'}`);
      console.log(`   Confidence: ${result.confidence.toFixed(2)}`);
      console.log(`   Reason: ${result.reason}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));

  return { passCount, failCount, accuracy };
}

// Run the tests
runTests();
