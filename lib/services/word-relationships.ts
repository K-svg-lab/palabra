/**
 * Word Relationships Service
 * 
 * Provides word relationships including synonyms, antonyms, related words,
 * and verb conjugations for Spanish vocabulary.
 * 
 * @module lib/services/word-relationships
 */

import type { WordRelationships, VerbConjugation, PartOfSpeech } from '@/lib/types/vocabulary';

/**
 * Fetches synonyms and antonyms for a Spanish word
 * Uses multiple sources to find related words
 * 
 * @param word - Spanish word to find relationships for
 * @param partOfSpeech - Part of speech to improve results
 * @returns Word relationships data
 */
export async function getWordRelationships(
  word: string,
  partOfSpeech?: PartOfSpeech
): Promise<WordRelationships> {
  try {
    // For now, we'll use a combination of pattern matching and common word databases
    // In production, you'd integrate with a Spanish thesaurus API
    const relationships: WordRelationships = {};
    
    // Get synonyms from built-in lists or patterns
    relationships.synonyms = await getSynonyms(word, partOfSpeech);
    
    // Get antonyms
    relationships.antonyms = await getAntonyms(word);
    
    // Get related words (word family)
    relationships.related = getRelatedWords(word);
    
    return relationships;
  } catch (error) {
    console.error('Word relationships fetch error:', error);
    return {};
  }
}

/**
 * Gets synonyms for a Spanish word
 * Uses common synonym patterns and databases
 * 
 * @param word - Spanish word
 * @param partOfSpeech - Part of speech
 * @returns Array of synonyms
 */
async function getSynonyms(word: string, partOfSpeech?: PartOfSpeech): Promise<string[]> {
  const lower = word.toLowerCase();
  
  // Common synonym mappings (expandable database)
  const synonymMap: Record<string, string[]> = {
    // Common adjectives
    'bonito': ['hermoso', 'bello', 'lindo', 'precioso'],
    'grande': ['enorme', 'inmenso', 'amplio', 'vasto'],
    'pequeño': ['diminuto', 'minúsculo', 'chico', 'reducido'],
    'feliz': ['alegre', 'contento', 'dichoso', 'jubiloso'],
    'triste': ['melancólico', 'apenado', 'afligido', 'deprimido'],
    'rápido': ['veloz', 'ágil', 'ligero', 'presto'],
    'lento': ['pausado', 'calmoso', 'tardo'],
    'fácil': ['sencillo', 'simple', 'elemental'],
    'difícil': ['complicado', 'complejo', 'arduo', 'duro'],
    
    // Common verbs
    'hablar': ['conversar', 'charlar', 'platicar', 'dialogar'],
    'comer': ['alimentarse', 'ingerir', 'devorar'],
    'beber': ['tomar', 'libar', 'ingerir'],
    'caminar': ['andar', 'marchar', 'pasear', 'deambular'],
    'correr': ['trotar', 'apresurarse', 'acelerar'],
    'mirar': ['observar', 'contemplar', 'ver', 'avistar'],
    'pensar': ['reflexionar', 'meditar', 'considerar', 'razonar'],
    'saber': ['conocer', 'dominar', 'entender'],
    'querer': ['amar', 'desear', 'apreciar', 'estimar'],
    
    // Common nouns
    'casa': ['hogar', 'vivienda', 'residencia', 'domicilio'],
    'amigo': ['compañero', 'camarada', 'colega'],
    'trabajo': ['empleo', 'labor', 'ocupación', 'tarea'],
    'libro': ['obra', 'volumen', 'ejemplar', 'texto'],
    'comida': ['alimento', 'sustento', 'vianda', 'manjar'],
    'dinero': ['plata', 'capital', 'efectivo', 'moneda'],
    'niño': ['chico', 'pequeño', 'infante', 'crío'],
    'coche': ['auto', 'automóvil', 'vehículo', 'carro'],
  };
  
  return synonymMap[lower] || [];
}

/**
 * Gets antonyms for a Spanish word
 * Uses common antonym patterns
 * 
 * @param word - Spanish word
 * @returns Array of antonyms
 */
async function getAntonyms(word: string): Promise<string[]> {
  const lower = word.toLowerCase();
  
  // Common antonym mappings (expandable database)
  const antonymMap: Record<string, string[]> = {
    // Adjectives
    'bonito': ['feo', 'horrible'],
    'grande': ['pequeño', 'chico'],
    'pequeño': ['grande', 'enorme'],
    'feliz': ['triste', 'infeliz'],
    'triste': ['feliz', 'alegre'],
    'bueno': ['malo'],
    'malo': ['bueno'],
    'nuevo': ['viejo', 'antiguo'],
    'viejo': ['nuevo', 'joven'],
    'rápido': ['lento'],
    'lento': ['rápido', 'veloz'],
    'alto': ['bajo'],
    'bajo': ['alto'],
    'gordo': ['delgado', 'flaco'],
    'delgado': ['gordo'],
    'caliente': ['frío'],
    'frío': ['caliente'],
    'fácil': ['difícil'],
    'difícil': ['fácil'],
    'limpio': ['sucio'],
    'sucio': ['limpio'],
    'claro': ['oscuro'],
    'oscuro': ['claro'],
    'lleno': ['vacío'],
    'vacío': ['lleno'],
    'rico': ['pobre'],
    'pobre': ['rico'],
    
    // Verbs
    'entrar': ['salir'],
    'salir': ['entrar'],
    'subir': ['bajar'],
    'bajar': ['subir'],
    'abrir': ['cerrar'],
    'cerrar': ['abrir'],
    'empezar': ['terminar', 'acabar'],
    'terminar': ['empezar', 'comenzar'],
    'recordar': ['olvidar'],
    'olvidar': ['recordar'],
    'ganar': ['perder'],
    'perder': ['ganar'],
    'amar': ['odiar'],
    'odiar': ['amar'],
    
    // Nouns
    'día': ['noche'],
    'noche': ['día'],
    'guerra': ['paz'],
    'paz': ['guerra'],
    'amor': ['odio'],
    'odio': ['amor'],
    'vida': ['muerte'],
    'muerte': ['vida'],
  };
  
  return antonymMap[lower] || [];
}

/**
 * Gets related words in the same word family
 * Uses morphological patterns to find related words
 * 
 * @param word - Spanish word
 * @returns Array of related words
 */
function getRelatedWords(word: string): string[] {
  const lower = word.toLowerCase();
  const related: string[] = [];
  
  // Common word family patterns
  const wordFamilies: Record<string, string[]> = {
    // Verb -> noun/adjective families
    'hablar': ['hablante', 'hablado', 'hablador', 'habla'],
    'comer': ['comedor', 'comida', 'comible'],
    'beber': ['bebedor', 'bebida', 'bebible'],
    'trabajar': ['trabajo', 'trabajador', 'trabajoso'],
    'amar': ['amor', 'amante', 'amado', 'amoroso'],
    'estudiar': ['estudio', 'estudiante', 'estudioso'],
    'escribir': ['escritor', 'escrito', 'escritura'],
    'leer': ['lector', 'lectura', 'leído'],
    'pensar': ['pensamiento', 'pensador', 'pensativo'],
    'crear': ['creación', 'creador', 'creativo', 'criatura'],
    
    // Noun -> related forms
    'casa': ['casero', 'caserío', 'casar'],
    'libro': ['librería', 'librero', 'libresco'],
    'vida': ['vivir', 'vivo', 'vital', 'viviente'],
    'muerte': ['morir', 'muerto', 'mortal', 'mortífero'],
    'amigo': ['amistad', 'amistoso', 'amigable'],
    'familia': ['familiar', 'familiaridad'],
    
    // Adjective -> related forms
    'feliz': ['felicidad', 'felizmente', 'infeliz'],
    'triste': ['tristeza', 'entristecer', 'tristemente'],
    'bueno': ['bondad', 'bonito', 'bondadoso'],
    'malo': ['maldad', 'malvado', 'malísimo'],
    'bello': ['belleza', 'embellecer', 'bellamente'],
  };
  
  return wordFamilies[lower] || [];
}

/**
 * Gets verb conjugation table for a Spanish verb
 * Supports regular and common irregular verbs
 * 
 * @param verb - Spanish verb (infinitive form)
 * @returns Verb conjugation data
 */
export async function getVerbConjugation(verb: string): Promise<VerbConjugation | null> {
  const lower = verb.toLowerCase();
  
  // Check if it's a verb (ends in -ar, -er, -ir)
  if (!lower.endsWith('ar') && !lower.endsWith('er') && !lower.endsWith('ir')) {
    return null;
  }
  
  try {
    // Check for irregular verbs first
    const irregularConjugation = getIrregularVerbConjugation(lower);
    if (irregularConjugation) {
      return irregularConjugation;
    }
    
    // Otherwise, use regular conjugation patterns
    return getRegularVerbConjugation(lower);
  } catch (error) {
    console.error('Verb conjugation error:', error);
    return null;
  }
}

/**
 * Gets conjugation for common irregular Spanish verbs
 * 
 * @param verb - Verb infinitive
 * @returns Conjugation table or null if not irregular
 */
function getIrregularVerbConjugation(verb: string): VerbConjugation | null {
  const irregularVerbs: Record<string, VerbConjugation> = {
    'ser': {
      infinitive: 'ser',
      present: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
      preterite: { yo: 'fui', tu: 'fuiste', el: 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' },
      future: { yo: 'seré', tu: 'serás', el: 'será', nosotros: 'seremos', vosotros: 'seréis', ellos: 'serán' },
    },
    'estar': {
      infinitive: 'estar',
      present: { yo: 'estoy', tu: 'estás', el: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están' },
      preterite: { yo: 'estuve', tu: 'estuviste', el: 'estuvo', nosotros: 'estuvimos', vosotros: 'estuvisteis', ellos: 'estuvieron' },
      future: { yo: 'estaré', tu: 'estarás', el: 'estará', nosotros: 'estaremos', vosotros: 'estaréis', ellos: 'estarán' },
    },
    'tener': {
      infinitive: 'tener',
      present: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' },
      preterite: { yo: 'tuve', tu: 'tuviste', el: 'tuvo', nosotros: 'tuvimos', vosotros: 'tuvisteis', ellos: 'tuvieron' },
      future: { yo: 'tendré', tu: 'tendrás', el: 'tendrá', nosotros: 'tendremos', vosotros: 'tendréis', ellos: 'tendrán' },
    },
    'hacer': {
      infinitive: 'hacer',
      present: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen' },
      preterite: { yo: 'hice', tu: 'hiciste', el: 'hizo', nosotros: 'hicimos', vosotros: 'hicisteis', ellos: 'hicieron' },
      future: { yo: 'haré', tu: 'harás', el: 'hará', nosotros: 'haremos', vosotros: 'haréis', ellos: 'harán' },
    },
    'ir': {
      infinitive: 'ir',
      present: { yo: 'voy', tu: 'vas', el: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' },
      preterite: { yo: 'fui', tu: 'fuiste', el: 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' },
      future: { yo: 'iré', tu: 'irás', el: 'irá', nosotros: 'iremos', vosotros: 'iréis', ellos: 'irán' },
    },
    'poder': {
      infinitive: 'poder',
      present: { yo: 'puedo', tu: 'puedes', el: 'puede', nosotros: 'podemos', vosotros: 'podéis', ellos: 'pueden' },
      preterite: { yo: 'pude', tu: 'pudiste', el: 'pudo', nosotros: 'pudimos', vosotros: 'pudisteis', ellos: 'pudieron' },
      future: { yo: 'podré', tu: 'podrás', el: 'podrá', nosotros: 'podremos', vosotros: 'podréis', ellos: 'podrán' },
    },
    'decir': {
      infinitive: 'decir',
      present: { yo: 'digo', tu: 'dices', el: 'dice', nosotros: 'decimos', vosotros: 'decís', ellos: 'dicen' },
      preterite: { yo: 'dije', tu: 'dijiste', el: 'dijo', nosotros: 'dijimos', vosotros: 'dijisteis', ellos: 'dijeron' },
      future: { yo: 'diré', tu: 'dirás', el: 'dirá', nosotros: 'diremos', vosotros: 'diréis', ellos: 'dirán' },
    },
    'venir': {
      infinitive: 'venir',
      present: { yo: 'vengo', tu: 'vienes', el: 'viene', nosotros: 'venimos', vosotros: 'venís', ellos: 'vienen' },
      preterite: { yo: 'vine', tu: 'viniste', el: 'vino', nosotros: 'vinimos', vosotros: 'vinisteis', ellos: 'vinieron' },
      future: { yo: 'vendré', tu: 'vendrás', el: 'vendrá', nosotros: 'vendremos', vosotros: 'vendréis', ellos: 'vendrán' },
    },
    'querer': {
      infinitive: 'querer',
      present: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
      preterite: { yo: 'quise', tu: 'quisiste', el: 'quiso', nosotros: 'quisimos', vosotros: 'quisisteis', ellos: 'quisieron' },
      future: { yo: 'querré', tu: 'querrás', el: 'querrá', nosotros: 'querremos', vosotros: 'querréis', ellos: 'querrán' },
    },
    'saber': {
      infinitive: 'saber',
      present: { yo: 'sé', tu: 'sabes', el: 'sabe', nosotros: 'sabemos', vosotros: 'sabéis', ellos: 'saben' },
      preterite: { yo: 'supe', tu: 'supiste', el: 'supo', nosotros: 'supimos', vosotros: 'supisteis', ellos: 'supieron' },
      future: { yo: 'sabré', tu: 'sabrás', el: 'sabrá', nosotros: 'sabremos', vosotros: 'sabréis', ellos: 'sabrán' },
    },
  };
  
  return irregularVerbs[verb] || null;
}

/**
 * Gets conjugation for regular Spanish verbs
 * Supports -ar, -er, and -ir verbs
 * 
 * @param verb - Verb infinitive
 * @returns Conjugation table
 */
function getRegularVerbConjugation(verb: string): VerbConjugation {
  const stem = verb.slice(0, -2);
  const ending = verb.slice(-2);
  
  const conjugation: VerbConjugation = {
    infinitive: verb,
  };
  
  // Present tense
  if (ending === 'ar') {
    conjugation.present = {
      yo: `${stem}o`,
      tu: `${stem}as`,
      el: `${stem}a`,
      nosotros: `${stem}amos`,
      vosotros: `${stem}áis`,
      ellos: `${stem}an`,
    };
  } else if (ending === 'er') {
    conjugation.present = {
      yo: `${stem}o`,
      tu: `${stem}es`,
      el: `${stem}e`,
      nosotros: `${stem}emos`,
      vosotros: `${stem}éis`,
      ellos: `${stem}en`,
    };
  } else if (ending === 'ir') {
    conjugation.present = {
      yo: `${stem}o`,
      tu: `${stem}es`,
      el: `${stem}e`,
      nosotros: `${stem}imos`,
      vosotros: `${stem}ís`,
      ellos: `${stem}en`,
    };
  }
  
  // Preterite (past) tense
  if (ending === 'ar') {
    conjugation.preterite = {
      yo: `${stem}é`,
      tu: `${stem}aste`,
      el: `${stem}ó`,
      nosotros: `${stem}amos`,
      vosotros: `${stem}asteis`,
      ellos: `${stem}aron`,
    };
  } else if (ending === 'er' || ending === 'ir') {
    conjugation.preterite = {
      yo: `${stem}í`,
      tu: `${stem}iste`,
      el: `${stem}ió`,
      nosotros: `${stem}imos`,
      vosotros: `${stem}isteis`,
      ellos: `${stem}ieron`,
    };
  }
  
  // Future tense (same for all endings)
  conjugation.future = {
    yo: `${verb}é`,
    tu: `${verb}ás`,
    el: `${verb}á`,
    nosotros: `${verb}emos`,
    vosotros: `${verb}éis`,
    ellos: `${verb}án`,
  };
  
  return conjugation;
}

