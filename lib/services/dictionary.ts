/**
 * Dictionary Service
 * 
 * Provides word metadata, example sentences, and linguistic information
 * for Spanish vocabulary using Wiktionary API and fallback sources.
 * 
 * Now includes POS validation for example sentences (Phase 16.1)
 * 
 * @module lib/services/dictionary
 */

import type { Gender, PartOfSpeech } from '@/lib/types/vocabulary';
import { validateExamplePOS, type POSValidationResult } from './pos-validation';

export interface DictionaryResult {
  word: string;
  gender?: Gender;
  partOfSpeech?: PartOfSpeech;
  examples: ExampleSentence[];
  definition?: string;
  synonyms?: string[];
  source: 'wiktionary' | 'fallback' | 'cache';
}

export interface ExampleSentence {
  spanish: string;
  english: string;
  source?: string;
  context?: 'formal' | 'informal' | 'neutral';
  /** POS validation result (Phase 16.1) */
  posValidation?: POSValidationResult;
}

export interface DictionaryError {
  error: string;
  message: string;
  fallbackAvailable: boolean;
}

/**
 * Fetches dictionary data for a Spanish word from Wiktionary
 * 
 * @param word - Spanish word to look up
 * @returns Dictionary data including gender, part of speech, and examples
 */
export async function lookupWord(word: string): Promise<DictionaryResult> {
  if (!word || word.trim().length === 0) {
    throw {
      error: 'INVALID_INPUT',
      message: 'Word cannot be empty',
      fallbackAvailable: false,
    } as DictionaryError;
  }

  try {
    // Use Wiktionary API to fetch word data
    const response = await fetch(
      `https://es.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Word not found, use intelligent heuristics
        const partOfSpeech = inferPartOfSpeechFromWord(word);
        // Only assign gender to nouns (all other parts of speech have no grammatical gender)
        const gender = partOfSpeech === 'noun' ? inferGenderFromWord(word) : undefined;
        
        return {
          word,
          gender,
          partOfSpeech,
          examples: [],
          source: 'fallback',
        };
      }
      throw new Error(`Dictionary API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract part of speech and gender from extract text
    const partOfSpeech = extractPartOfSpeech(data.extract || '');
    // Only assign gender to nouns (all other parts of speech have no grammatical gender)
    const gender = partOfSpeech === 'noun' ? extractGender(data.extract || '', word, partOfSpeech) : undefined;

    return {
      word,
      partOfSpeech,
      gender,
      examples: [],
      definition: data.extract,
      source: 'wiktionary',
    };
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    
    // Return data with intelligent heuristics
    const partOfSpeech = inferPartOfSpeechFromWord(word);
    // Only assign gender to nouns (all other parts of speech have no grammatical gender)
    const gender = partOfSpeech === 'noun' ? inferGenderFromWord(word) : undefined;
    
    return {
      word,
      gender,
      partOfSpeech,
      examples: [],
      source: 'fallback',
    };
  }
}

/**
 * Scores an example sentence based on quality metrics
 * Higher score = better quality (more context, natural length)
 */
function scoreExampleQuality(spanish: string, english: string): number {
  let score = 0;
  
  // Word count scoring (prefer sentences with 5-15 words)
  const spanishWords = spanish.trim().split(/\s+/).length;
  const englishWords = english.trim().split(/\s+/).length;
  
  if (spanishWords >= 5 && spanishWords <= 15) {
    score += 10;
  } else if (spanishWords >= 3 && spanishWords <= 20) {
    score += 5;
  }
  
  // Prefer complete sentences with punctuation
  if (spanish.match(/[.!?]$/)) {
    score += 5;
  }
  
  // Bonus for sentences with commas (more complex/contextual)
  if (spanish.includes(',')) {
    score += 3;
  }
  
  // Penalize very short sentences (< 3 words)
  if (spanishWords < 3) {
    score -= 10;
  }
  
  // Penalize very long sentences (> 25 words - too complex)
  if (spanishWords > 25) {
    score -= 5;
  }
  
  // Bonus for balanced translation length (good sign of quality)
  const ratio = Math.min(spanishWords, englishWords) / Math.max(spanishWords, englishWords);
  if (ratio > 0.7) {
    score += 3;
  }
  
  return score;
}

/**
 * Checks if a sentence contains the exact word (respecting word boundaries)
 * This prevents matching "caro" when searching for "cara"
 * For verbs, also matches conjugated forms (e.g., "desviar" matches "desvía", "desviaron")
 * For reflexive verbs, matches both attached and separated pronouns
 */
function containsExactWord(sentence: string, word: string): boolean {
  const normalizedSentence = sentence.toLowerCase();
  const normalizedWord = word.toLowerCase();
  
  // First, try exact word match with word boundaries
  const exactPattern = new RegExp(`\\b${normalizedWord}\\b`, 'i');
  if (exactPattern.test(normalizedSentence)) {
    return true;
  }
  
  // Check if it's a reflexive verb (ends with -arse, -erse, -irse)
  const isReflexive = normalizedWord.match(/^(.+)(arse|erse|irse)$/);
  
  if (isReflexive) {
    const baseVerb = isReflexive[1]; // e.g., "meterse" → "met"
    const ending = isReflexive[2]; // e.g., "erse"
    
    // Reflexive pronouns that can appear before the verb
    const reflexivePronouns = ['me', 'te', 'se', 'nos', 'os'];
    
    // Check for separated reflexive forms: "me meto", "te metes", "se mete", etc.
    for (const pronoun of reflexivePronouns) {
      // Match pronoun followed by verb stem
      // Examples: "meterse" → matches "me meto", "se mete", "nos metemos"
      const separatedPattern = new RegExp(`\\b${pronoun}\\s+${baseVerb}`, 'i');
      if (separatedPattern.test(normalizedSentence)) {
        return true;
      }
    }
    
    // Also check for attached forms: "metiéndose", "meterse"
    const attachedPattern = new RegExp(`\\b${baseVerb}`, 'i');
    if (attachedPattern.test(normalizedSentence)) {
      return true;
    }
  }
  
  // For Spanish verbs (infinitives ending in -ar, -er, -ir), also match verb stem
  // This allows "desviar" to match "desvía", "desviaron", "desviando", etc.
  if (normalizedWord.endsWith('ar') || normalizedWord.endsWith('er') || normalizedWord.endsWith('ir')) {
    // Get verb stem by removing the infinitive ending
    const stem = normalizedWord.slice(0, -2); // Remove -ar/-er/-ir
    
    // Match stem at word boundary (handles all conjugations and compound forms)
    // Examples: desviar → desvi → matches "desvía", "desviaron", "desviando", "desviarla"
    const stemPattern = new RegExp(`\\b${stem}`, 'i');
    return stemPattern.test(normalizedSentence);
  }
  
  // For non-verbs, require exact match
  return false;
}

/**
 * Fetches example sentences for a Spanish word
 * 
 * Uses multiple sources to find natural example sentences with translations
 * Prioritizes longer, more contextual examples
 * Ensures examples contain the EXACT word being searched
 * Now includes POS validation (Phase 16.1) to ensure examples use the word correctly
 * 
 * @param word - Spanish word to find examples for
 * @param partOfSpeech - Optional part of speech for validation
 * @param limit - Maximum number of examples to return (default: 5)
 * @returns Array of example sentences with translations and POS validation
 */
export async function getExamples(
  word: string,
  partOfSpeech?: PartOfSpeech,
  limit: number = 5
): Promise<ExampleSentence[]> {
  try {
    // Fetch more results from Tatoeba to have better selection
    const response = await fetch(
      `https://tatoeba.org/en/api_v0/search?from=spa&to=eng&query=${encodeURIComponent(word)}&orphans=no&unapproved=no&limit=30`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Examples API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return generateFallbackExample(word);
    }

    // Process examples with quality scoring, context detection, and POS validation
    const examples: Array<ExampleSentence & { score: number }> = data.results
      .map((result: any) => ({
        spanish: result.text,
        english: result.translations?.[0]?.[0]?.text || '',
        source: 'tatoeba',
        context: detectSentenceContext(result.text),
        score: 0,
        posValidation: undefined,
      }))
      .filter((ex: any) => {
        // Only include if:
        // 1. Translation exists
        // 2. Spanish sentence contains the EXACT word (with word boundaries)
        return ex.english && containsExactWord(ex.spanish, word);
      })
      .map((ex: any) => {
        // Calculate quality score
        const qualityScore = scoreExampleQuality(ex.spanish, ex.english);
        
        // Validate POS if provided
        let posValidation: POSValidationResult | undefined;
        if (partOfSpeech) {
          posValidation = validateExamplePOS(ex.spanish, word, partOfSpeech);
          
          // Log validation failures for monitoring
          if (!posValidation.isValid) {
            console.log(
              `[POS Validation] Filtered example for "${word}" (${partOfSpeech}):`,
              `"${ex.spanish}"`,
              `- Reason: ${posValidation.reason}`
            );
          }
        }
        
        return {
          ...ex,
          score: qualityScore,
          posValidation,
        };
      })
      .filter((ex: any) => {
        // NEW: Filter out examples that fail POS validation
        // Only apply filter if POS is provided and confidence threshold is met
        if (partOfSpeech && ex.posValidation) {
          // Use a moderate confidence threshold (0.30) to avoid being too strict
          // This allows examples that might be valid but lack strong indicators
          return ex.posValidation.isValid && ex.posValidation.confidence >= 0.30;
        }
        return true; // Keep example if no POS validation needed
      });

    // Sort by quality score (highest first)
    examples.sort((a, b) => b.score - a.score);

    // Take top examples up to the limit
    const topExamples = examples.slice(0, limit).map(({ spanish, english, source, context, posValidation }) => ({
      spanish,
      english,
      source,
      context,
      posValidation,
    }));

    return topExamples.length > 0 ? topExamples : generateFallbackExample(word);
  } catch (error) {
    console.error('Examples fetch error:', error);
    return generateFallbackExample(word);
  }
}

/**
 * Detects the formality context of a Spanish sentence
 * Identifies formal/informal usage patterns
 * 
 * @param sentence - Spanish sentence
 * @returns Context classification
 */
function detectSentenceContext(sentence: string): 'formal' | 'informal' | 'neutral' {
  const lower = sentence.toLowerCase();
  
  // Formal indicators
  const formalIndicators = [
    'usted', 'ustedes', 'señor', 'señora', 'estimado',
    'distinguido', 'atentamente', 'cordialmente'
  ];
  
  // Informal indicators
  const informalIndicators = [
    'tú', 'vos', 'che', 'güey', 'tío', 'colega',
    'mano', 'pana', 'compa'
  ];
  
  const hasFormal = formalIndicators.some(indicator => lower.includes(indicator));
  const hasInformal = informalIndicators.some(indicator => lower.includes(indicator));
  
  if (hasFormal && !hasInformal) return 'formal';
  if (hasInformal && !hasFormal) return 'informal';
  return 'neutral';
}

/**
 * Generates contextual example sentences when API lookup fails
 * Creates more natural, longer examples based on word type
 * 
 * @param word - Spanish word
 * @returns Fallback example sentence with context
 */
function generateFallbackExample(word: string): ExampleSentence[] {
  // Check if it's a verb (infinitive)
  if (word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir')) {
    return [
      {
        spanish: `Me gustaría aprender a ${word} correctamente en español.`,
        english: `I would like to learn to ${word} correctly in Spanish.`,
        source: 'generated',
      },
    ];
  }
  
  // For nouns and adjectives, create a more contextual sentence
  return [
    {
      spanish: `La palabra "${word}" es muy útil cuando estudio español.`,
      english: `The word "${word}" is very useful when I study Spanish.`,
      source: 'generated',
    },
  ];
}

/**
 * Extracts part of speech from Wiktionary extract text
 * Prioritizes more specific matches and checks for Spanish grammatical terms
 * 
 * @param text - Extract text from Wiktionary
 * @returns Detected part of speech
 */
function extractPartOfSpeech(text: string): PartOfSpeech | undefined {
  const lower = text.toLowerCase();
  
  // Check for adjective first (often appears before noun in definitions)
  // Spanish: adjetivo, adj.
  // English: adjective, adj.
  if (lower.match(/\badjetivo\b/) || lower.match(/\badjective\b/) || 
      lower.match(/\badj\.\b/)) {
    return 'adjective';
  }
  
  // Verbs
  // Spanish: verbo, v.
  // English: verb, v.
  if (lower.match(/\bverbo\b/) || lower.match(/\bverb\b/) || 
      lower.match(/\bv\.\b/)) {
    return 'verb';
  }
  
  // Nouns (check after adjective to avoid false positives)
  // Spanish: sustantivo, s., m., f.
  // English: noun, n.
  if (lower.match(/\bsustantivo\b/) || lower.match(/\bnoun\b/) || 
      lower.match(/\bs\.\b/) || lower.match(/\bn\.\b/)) {
    return 'noun';
  }
  
  // Adverbs
  // Spanish: adverbio, adv.
  // English: adverb, adv.
  if (lower.match(/\badverbio\b/) || lower.match(/\badverb\b/) || 
      lower.match(/\badv\.\b/)) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/dictionary.ts:387',message:'Extracted ADVERB from Wiktionary',data:{result:'adverb'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return 'adverb';
  }
  
  // Prepositions
  // Spanish: preposición, prep.
  // English: preposition, prep.
  if (lower.match(/\bpreposición\b/) || lower.match(/\bpreposition\b/) || 
      lower.match(/\bprep\.\b/)) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/dictionary.ts:395',message:'Extracted PREPOSITION from Wiktionary',data:{result:'preposition'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return 'preposition';
  }
  
  // Pronouns
  // Spanish: pronombre, pron.
  // English: pronoun, pron.
  if (lower.match(/\bpronombre\b/) || lower.match(/\bpronoun\b/) || 
      lower.match(/\bpron\.\b/)) {
    return 'pronoun';
  }
  
  // Conjunctions
  // Spanish: conjunción, conj.
  // English: conjunction, conj.
  if (lower.match(/\bconjunción\b/) || lower.match(/\bconjunction\b/) || 
      lower.match(/\bconj\.\b/)) {
    return 'conjunction';
  }
  
  // Interjections
  // Spanish: interjección, interj.
  // English: interjection, interj.
  if (lower.match(/\binterjección\b/) || lower.match(/\binterjection\b/) || 
      lower.match(/\binterj\.\b/)) {
    return 'interjection';
  }
  
  
  return undefined;
}

/**
 * Extracts gender from Wiktionary extract text or word ending
 * 
 * @param text - Extract text from Wiktionary
 * @param word - The Spanish word
 * @param partOfSpeech - Optional part of speech (gender not applicable to adjectives)
 * @returns Detected gender (undefined for adjectives)
 */
function extractGender(text: string, word: string, partOfSpeech?: PartOfSpeech): Gender | undefined {
  // Only nouns have grammatical gender (all other parts of speech should not have gender assigned)
  if (partOfSpeech !== 'noun') {
    return undefined;
  }
  
  const lower = text.toLowerCase();
  
  // Check for explicit gender markers in text
  if (lower.includes('masculino') || lower.includes('masculine') || lower.includes('m.')) {
    return 'masculine';
  }
  if (lower.includes('femenino') || lower.includes('feminine') || lower.includes('f.')) {
    return 'feminine';
  }
  
  // Infer from word ending (common Spanish patterns) - only for nouns
  if (word.endsWith('o')) return 'masculine';
  if (word.endsWith('a')) return 'feminine';
  if (word.endsWith('e') || word.endsWith('ción') || word.endsWith('dad')) {
    // Many words ending in -e are masculine, but -ción and -dad are feminine
    if (word.endsWith('ción') || word.endsWith('dad')) {
      return 'feminine';
    }
  }
  
  return undefined;
}

/**
 * Performs complete dictionary lookup including examples with POS validation
 * 
 * @param word - Spanish word to look up
 * @returns Complete dictionary result with POS-validated examples
 */
export async function getCompleteWordData(
  word: string
): Promise<DictionaryResult> {
  // First get word data to determine part of speech
  const wordData = await lookupWord(word);
  
  // Then fetch examples with POS validation
  const examples = await getExamples(word, wordData.partOfSpeech);

  return {
    ...wordData,
    examples,
  };
}

/**
 * Infers gender from Spanish word patterns
 * Uses common Spanish linguistic rules
 * Note: Gender is only applicable to nouns, not adjectives
 * 
 * @param word - Spanish word
 * @returns Inferred gender or undefined
 */
function inferGenderFromWord(word: string): Gender | undefined {
  const lower = word.toLowerCase();
  
  // If it's a known adjective, don't assign gender
  if (COMMON_ADJECTIVES.has(lower)) {
    return undefined;
  }
  
  // Common masculine endings
  if (lower.endsWith('o') && !lower.endsWith('mano')) {
    return 'masculine';
  }
  
  // Common feminine endings
  if (lower.endsWith('a') && !lower.endsWith('ma') && !lower.endsWith('ta')) {
    return 'feminine';
  }
  
  // Words ending in -ción, -sión, -dad, -tad, -tud are feminine
  if (lower.endsWith('ción') || lower.endsWith('sión') || 
      lower.endsWith('dad') || lower.endsWith('tad') || lower.endsWith('tud')) {
    return 'feminine';
  }
  
  // Words ending in -ma are often masculine (el problema, el sistema)
  if (lower.endsWith('ma')) {
    return 'masculine';
  }
  
  // Most words ending in consonants (l, r, n, j, z, s) are masculine
  // Examples: el papel, el amor, el pan, el reloj, el pez, el mes
  // Note: -ión is feminine (already handled above)
  const lastChar = lower.slice(-1);
  if (lastChar === 'l' || lastChar === 'r' || lastChar === 'n' || 
      lastChar === 'j' || lastChar === 'z' || lastChar === 's') {
    return 'masculine';
  }
  
  // Words ending in -e could be either, don't guess
  return undefined;
}

/**
 * Common Spanish prepositions (closed class - complete list)
 * These are function words that connect nouns, pronouns, and phrases
 */
const COMMON_PREPOSITIONS = new Set([
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante',
  'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según',
  'sin', 'so', 'sobre', 'tras', 'versus', 'vía',
]);

/**
 * Common Spanish adverbs (most common)
 * Adverbs modify verbs, adjectives, or other adverbs
 */
const COMMON_ADVERBS = new Set([
  // Frequency
  'siempre', 'nunca', 'jamás', 'a menudo', 'frecuentemente', 'raramente',
  'a veces', 'todavía', 'aún', 'ya',
  // Manner (non -mente)
  'bien', 'mal', 'así', 'mejor', 'peor', 'despacio', 'deprisa',
  // Degree
  'muy', 'mucho', 'poco', 'bastante', 'demasiado', 'más', 'menos', 'tan', 'tanto',
  // Time
  'hoy', 'ayer', 'mañana', 'ahora', 'luego', 'después', 'antes', 'pronto', 'tarde', 'temprano',
  // Place
  'aquí', 'ahí', 'allí', 'acá', 'allá', 'donde', 'cerca', 'lejos', 'arriba', 'abajo',
  'delante', 'detrás', 'dentro', 'fuera', 'encima', 'debajo',
  // Affirmation/Negation
  'sí', 'no', 'también', 'tampoco',
]);

/**
 * Common Spanish pronouns (closed class)
 * Subject, object, reflexive, and demonstrative pronouns
 */
const COMMON_PRONOUNS = new Set([
  // Subject
  'yo', 'tú', 'usted', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras',
  'ustedes', 'ellos', 'ellas',
  // Object
  'me', 'te', 'se', 'lo', 'la', 'le', 'nos', 'os', 'los', 'las', 'les',
  // Reflexive (standalone)
  'mí', 'ti', 'sí',
  // Possessive
  'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas',
  'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'vuestro', 'vuestra', 'vuestros', 'vuestras',
  // Demonstrative
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'esto', 'eso', 'aquello',
]);

/**
 * Common Spanish conjunctions (closed class)
 * Coordinating and subordinating conjunctions
 */
const COMMON_CONJUNCTIONS = new Set([
  // Coordinating
  'y', 'e', 'o', 'u', 'pero', 'mas', 'sino', 'ni',
  // Subordinating
  'que', 'porque', 'como', 'si', 'cuando', 'aunque', 'mientras', 'donde',
  'pues', 'puesto que', 'ya que', 'sino que',
]);

/**
 * Common Spanish interjections
 * Exclamatory words expressing emotion
 */
const COMMON_INTERJECTIONS = new Set([
  'ah', 'oh', 'eh', 'ay', 'uy', 'hola', 'adiós', 'bravo', 'caramba',
  'ojalá', 'vaya', 'dale', 'ándale',
]);

/**
 * Common Spanish adjectives that don't follow predictable patterns
 * These are frequently used adjectives that need explicit identification
 */
const COMMON_ADJECTIVES = new Set([
  // Size and quantity
  'grande', 'pequeño', 'pequeña', 'largo', 'larga', 'corto', 'corta',
  'alto', 'alta', 'bajo', 'baja', 'ancho', 'ancha', 'estrecho', 'estrecha',
  'gordo', 'gorda', 'delgado', 'delgada', 'grueso', 'gruesa', 'fino', 'fina',
  'enorme', 'diminuto', 'diminuta', 'inmenso', 'inmensa', 'minúsculo', 'minúscula',
  'mucho', 'mucha', 'poco', 'poca', 'varios', 'varias', 'bastante',
  
  // Colors
  'rojo', 'roja', 'azul', 'verde', 'amarillo', 'amarilla', 'negro', 'negra',
  'blanco', 'blanca', 'gris', 'marrón', 'rosa', 'naranja', 'morado', 'morada',
  'violeta', 'celeste', 'dorado', 'dorada', 'plateado', 'plateada',
  
  // Quality and characteristics
  'bueno', 'buena', 'malo', 'mala', 'mejor', 'peor', 'nuevo', 'nueva',
  'viejo', 'vieja', 'joven', 'antiguo', 'antigua', 'moderno', 'moderna',
  'fresco', 'fresca', 'seco', 'seca', 'húmedo', 'húmeda', 'mojado', 'mojada',
  'limpio', 'limpia', 'sucio', 'sucia', 'claro', 'clara', 'oscuro', 'oscura',
  'duro', 'dura', 'blando', 'blanda', 'suave', 'áspero', 'áspera',
  'fuerte', 'débil', 'ligero', 'ligera', 'pesado', 'pesada',
  
  // Temperature and sensation
  'caliente', 'frío', 'fría', 'tibio', 'tibia', 'helado', 'helada',
  
  // Speed and time
  'rápido', 'rápida', 'lento', 'lenta', 'veloz', 'temprano', 'tardío', 'tardía',
  
  // Emotional and psychological
  'feliz', 'triste', 'alegre', 'contento', 'contenta', 'enfadado', 'enfadada',
  'triste', 'nervioso', 'nerviosa', 'tranquilo', 'tranquila', 'preocupado', 'preocupada',
  'cansado', 'cansada', 'aburrido', 'aburrida', 'interesante', 'divertido', 'divertida',
  'hambriento', 'hambrienta', 'sediento', 'sedienta', 'violento', 'violenta',
  'sangriento', 'sangrienta', 'mugriento', 'mugrienta', 'polvoriento', 'polvorienta',
  
  // Difficulty and complexity
  'fácil', 'difícil', 'simple', 'complejo', 'compleja', 'complicado', 'complicada',
  
  // Social and relationship
  'amable', 'simpático', 'simpática', 'antipático', 'antipática', 'agradable',
  'educado', 'educada', 'maleducado', 'maleducada', 'cortés', 'grosero', 'grosera',
  
  // Comparative and superlative
  'mayor', 'menor', 'superior', 'inferior', 'máximo', 'máxima', 'mínimo', 'mínima',
  
  // Other common adjectives
  'bonito', 'bonita', 'feo', 'fea', 'hermoso', 'hermosa', 'bello', 'bella',
  'rico', 'rica', 'pobre', 'caro', 'cara', 'barato', 'barata',
  'lleno', 'llena', 'vacío', 'vacía', 'completo', 'completa',
  'abierto', 'abierta', 'cerrado', 'cerrada', 'público', 'pública', 'privado', 'privada',
  'propio', 'propia', 'ajeno', 'ajena', 'mismo', 'misma', 'otro', 'otra',
  'solo', 'sola', 'único', 'única', 'doble', 'triple', 'múltiple',
  'seguro', 'segura', 'peligroso', 'peligrosa', 'cierto', 'cierta', 'falso', 'falsa',
  'verdadero', 'verdadera', 'real', 'posible', 'imposible', 'probable',
  'necesario', 'necesaria', 'importante', 'principal', 'esencial',
  'normal', 'especial', 'común', 'raro', 'rara', 'extraño', 'extraña',
  'perfecto', 'perfecta', 'imperfecto', 'imperfecta', 'exacto', 'exacta',
  'correcto', 'correcta', 'incorrecto', 'incorrecta', 'preciso', 'precisa',
]);

/**
 * Common Spanish nouns that might be confused with adjectives
 * These should be explicitly identified as nouns
 */
const COMMON_NOUNS = new Set([
  // Time
  'día', 'noche', 'tarde', 'mañana', 'hora', 'momento', 'tiempo', 'año', 'mes', 'semana',
  
  // Places
  'casa', 'calle', 'ciudad', 'país', 'mundo', 'lugar', 'sitio', 'zona',
  
  // People
  'persona', 'hombre', 'mujer', 'niño', 'niña', 'amigo', 'amiga', 'familia',
  
  // Body parts
  'mano', 'cara', 'cabeza', 'ojo', 'boca', 'nariz', 'oreja', 'brazo', 'pierna',
  
  // Things
  'cosa', 'objeto', 'elemento', 'parte', 'punto', 'lado', 'forma', 'manera',
]);

/**
 * Infers part of speech from Spanish word patterns
 * Uses common Spanish linguistic rules and explicit word lists
 * 
 * @param word - Spanish word
 * @returns Inferred part of speech or undefined
 */
function inferPartOfSpeechFromWord(word: string): PartOfSpeech | undefined {
  const lower = word.toLowerCase().trim();
  
  // For multi-word phrases, try to extract the main word (first word for idioms)
  const words = lower.split(/\s+/);
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  
  // Check closed-class words FIRST (prepositions, adverbs, pronouns, conjunctions, interjections)
  // These are definitive and should override pattern matching
  
  if (COMMON_PREPOSITIONS.has(lower) || COMMON_PREPOSITIONS.has(firstWord)) {
    return 'preposition';
  }
  
  if (COMMON_ADVERBS.has(lower) || COMMON_ADVERBS.has(firstWord)) {
    return 'adverb';
  }
  
  if (COMMON_PRONOUNS.has(lower) || COMMON_PRONOUNS.has(firstWord)) {
    return 'pronoun';
  }
  
  if (COMMON_CONJUNCTIONS.has(lower) || COMMON_CONJUNCTIONS.has(firstWord)) {
    return 'conjunction';
  }
  
  if (COMMON_INTERJECTIONS.has(lower) || COMMON_INTERJECTIONS.has(firstWord)) {
    return 'interjection';
  }
  
  // Check explicit word lists for open-class words
  if (COMMON_ADJECTIVES.has(lower) || COMMON_ADJECTIVES.has(lastWord)) {
    return 'adjective';
  }
  
  if (COMMON_NOUNS.has(lower) || COMMON_NOUNS.has(lastWord)) {
    return 'noun';
  }
  
  // Check patterns (also check first word for multi-word phrases)
  
  // Reflexive verb infinitives end in -arse, -erse, -irse (CHECK THESE FIRST!)
  if (lower.endsWith('arse') || lower.endsWith('erse') || lower.endsWith('irse') ||
      firstWord.endsWith('arse') || firstWord.endsWith('erse') || firstWord.endsWith('irse')) {
    return 'verb';
  }
  
  // Regular verb infinitives end in -ar, -er, -ir
  if (lower.endsWith('ar') || lower.endsWith('er') || lower.endsWith('ir') ||
      firstWord.endsWith('ar') || firstWord.endsWith('er') || firstWord.endsWith('ir')) {
    return 'verb';
  }
  
  // Adverbs typically end in -mente
  if (lower.endsWith('mente')) {
    return 'adverb';
  }
  
  // Common adjective endings
  if (lower.endsWith('oso') || lower.endsWith('osa') || 
      lower.endsWith('ivo') || lower.endsWith('iva') ||
      lower.endsWith('able') || lower.endsWith('ible') ||
      lower.endsWith('ante') || lower.endsWith('iente') ||
      lower.endsWith('iento') || lower.endsWith('ienta') ||  // Added -iento/-ienta (hambriento, sediento, violento)
      lower.endsWith('ado') || lower.endsWith('ada') ||
      lower.endsWith('ido') || lower.endsWith('ida')) {
    return 'adjective';
  }
  
  // Words ending in -ción, -sión, -dad, -tad, -tud are almost always nouns
  if (lower.endsWith('ción') || lower.endsWith('sión') || 
      lower.endsWith('dad') || lower.endsWith('tad') || lower.endsWith('tud') ||
      lower.endsWith('miento') || lower.endsWith('anza') || lower.endsWith('encia') ||
      lower.endsWith('ancia')) {
    return 'noun';
  }
  
  // Words ending in -ista can be nouns or adjectives, but default to noun
  if (lower.endsWith('ista')) {
    return 'noun';
  }
  
  // Most words ending in -o or -a that haven't been identified as adjectives are nouns
  // (Animals, objects, concepts: gato, perro, casa, mesa, libro, etc.)
  if (lower.endsWith('o') || lower.endsWith('a')) {
    return 'noun';
  }
  
  // Words ending in -e could be various parts of speech
  if (lower.endsWith('e')) {
    return 'noun'; // Default assumption for -e words (leche, coche, calle, etc.)
  }
  
  // Default to noun for unmatched patterns (most common word class)
  return 'noun';
}

