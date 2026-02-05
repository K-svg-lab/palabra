/**
 * Part of Speech Validation Service
 * 
 * Validates that example sentences use the target word with the correct part of speech.
 * Prevents issues like showing "Yo libro muchas batallas" (verb) when looking up
 * "libro" as a noun (book).
 * 
 * @module lib/services/pos-validation
 */

import type { PartOfSpeech } from '@/lib/types/vocabulary';

/**
 * Result of POS validation for an example sentence
 */
export interface POSValidationResult {
  /** Whether the word is used with the expected POS */
  isValid: boolean;
  /** Confidence score (0-1) of the validation */
  confidence: number;
  /** Detected POS usage in the sentence */
  detectedPOS?: PartOfSpeech;
  /** Reason for validation result (for debugging) */
  reason?: string;
}

/**
 * Validates that an example sentence uses the word with the expected part of speech
 * 
 * @param sentence - The Spanish sentence to validate
 * @param word - The Spanish word to check (should appear in sentence)
 * @param expectedPOS - The expected part of speech
 * @returns Validation result with confidence score
 * 
 * @example
 * // Valid: "libro" used as noun
 * validateExamplePOS("El libro está en la mesa", "libro", "noun")
 * // => { isValid: true, confidence: 0.95, detectedPOS: "noun" }
 * 
 * // Invalid: "libro" used as verb
 * validateExamplePOS("Yo libro muchas batallas", "libro", "noun")
 * // => { isValid: false, confidence: 0.85, detectedPOS: "verb" }
 */
export function validateExamplePOS(
  sentence: string,
  word: string,
  expectedPOS: PartOfSpeech
): POSValidationResult {
  const normalizedSentence = sentence.toLowerCase().trim();
  const normalizedWord = word.toLowerCase().trim();

  // Find the word in the sentence
  const wordPosition = findWordPosition(normalizedSentence, normalizedWord);
  
  if (wordPosition === -1) {
    return {
      isValid: false,
      confidence: 0,
      reason: 'Word not found in sentence',
    };
  }

  // Extract context around the word (3 words before and after)
  const context = extractContext(normalizedSentence, normalizedWord, wordPosition);

  // Validate based on expected POS
  switch (expectedPOS) {
    case 'noun':
      return validateNounUsage(normalizedWord, context, normalizedSentence);
    case 'verb':
      return validateVerbUsage(normalizedWord, context, normalizedSentence);
    case 'adjective':
      return validateAdjectiveUsage(normalizedWord, context, normalizedSentence);
    case 'adverb':
      return validateAdverbUsage(normalizedWord, context, normalizedSentence);
    case 'preposition':
    case 'pronoun':
    case 'conjunction':
    case 'interjection':
      // These are closed-class words - if the word matches, it's used correctly
      return {
        isValid: true,
        confidence: 0.95,
        detectedPOS: expectedPOS,
        reason: 'Closed-class word - assumed correct',
      };
    default:
      return {
        isValid: true,
        confidence: 0.5,
        reason: 'Unknown POS - assuming valid',
      };
  }
}

/**
 * Context words around the target word
 */
interface WordContext {
  /** Words appearing before the target word */
  before: string[];
  /** The target word itself */
  word: string;
  /** Words appearing after the target word */
  after: string[];
}

/**
 * Extracts contextual words around the target word
 */
function extractContext(
  sentence: string,
  word: string,
  position: number,
  range: number = 3
): WordContext {
  const words = sentence.split(/\s+/);
  const wordIndex = words.findIndex((w, i) => i >= Math.floor(position / (sentence.length / words.length)) && w.includes(word));

  const before = words.slice(Math.max(0, wordIndex - range), wordIndex);
  const after = words.slice(wordIndex + 1, Math.min(words.length, wordIndex + range + 1));

  return {
    before,
    word: words[wordIndex] || word,
    after,
  };
}

/**
 * Validates noun usage in context
 */
function validateNounUsage(
  word: string,
  context: WordContext,
  fullSentence: string
): POSValidationResult {
  // Spanish definite articles
  const definiteArticles = ['el', 'la', 'los', 'las'];
  // Spanish indefinite articles
  const indefiniteArticles = ['un', 'una', 'unos', 'unas'];
  // Spanish prepositions that typically precede nouns
  const nounPrepositions = ['de', 'del', 'a', 'al', 'en', 'con', 'sin', 'sobre', 'entre', 'por', 'para'];
  // Possessive adjectives
  const possessives = ['mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras'];
  // Demonstrative adjectives
  const demonstratives = ['este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas'];

  let confidence = 0;
  let posIndicators: string[] = [];

  // Check for article before noun
  if (context.before.some(w => definiteArticles.includes(w) || indefiniteArticles.includes(w))) {
    confidence += 0.40;
    posIndicators.push('article');
  }

  // Check for preposition before noun
  if (context.before.some(w => nounPrepositions.includes(w))) {
    confidence += 0.30;
    posIndicators.push('preposition');
  }

  // Check for possessive before noun
  if (context.before.some(w => possessives.includes(w))) {
    confidence += 0.35;
    posIndicators.push('possessive');
  }

  // Check for demonstrative before noun
  if (context.before.some(w => demonstratives.includes(w))) {
    confidence += 0.35;
    posIndicators.push('demonstrative');
  }

  // Check if word is NOT being used as verb (verb indicators would contradict noun usage)
  const verbIndicators = ['yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas'];
  const hasSubjectPronoun = context.before.some(w => verbIndicators.includes(w));
  
  if (hasSubjectPronoun && context.word === word) {
    // Strong evidence this is a verb, not a noun
    return {
      isValid: false,
      confidence: 0.85,
      detectedPOS: 'verb',
      reason: 'Subject pronoun detected - likely verb usage',
    };
  }

  // Normalize confidence to 0-1 range
  confidence = Math.min(confidence, 1.0);

  return {
    isValid: confidence >= 0.30, // Lower threshold - nouns can appear without articles
    confidence,
    detectedPOS: 'noun',
    reason: confidence >= 0.30 
      ? `Noun indicators found: ${posIndicators.join(', ')}`
      : 'No clear noun indicators',
  };
}

/**
 * Validates verb usage in context
 */
function validateVerbUsage(
  word: string,
  context: WordContext,
  fullSentence: string
): POSValidationResult {
  // Subject pronouns
  const subjectPronouns = ['yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'usted', 'ustedes'];
  // Reflexive pronouns
  const reflexivePronouns = ['me', 'te', 'se', 'nos', 'os'];
  // Negation and verb modifiers
  const verbModifiers = ['no', 'nunca', 'siempre', 'jamás', 'también', 'tampoco'];
  // Auxiliary verbs
  const auxiliaryVerbs = ['he', 'has', 'ha', 'hemos', 'habéis', 'han', 'haber'];
  // Modal verbs
  const modalVerbs = ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden', 'debo', 'debes', 'debe', 'debemos', 'debéis', 'deben', 'quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'];

  let confidence = 0;
  let posIndicators: string[] = [];

  // Check for subject pronoun before verb
  if (context.before.some(w => subjectPronouns.includes(w))) {
    confidence += 0.45;
    posIndicators.push('subject pronoun');
  }

  // Check for reflexive pronoun (strong verb indicator)
  if (context.before.some(w => reflexivePronouns.includes(w))) {
    confidence += 0.40;
    posIndicators.push('reflexive pronoun');
  }

  // Check for verb modifiers
  if (context.before.some(w => verbModifiers.includes(w))) {
    confidence += 0.25;
    posIndicators.push('verb modifier');
  }

  // Check for auxiliary or modal verbs
  if (context.before.some(w => auxiliaryVerbs.includes(w) || modalVerbs.includes(w))) {
    confidence += 0.30;
    posIndicators.push('auxiliary/modal verb');
  }

  // Check if word ends in typical verb conjugation endings
  const verbEndings = ['o', 'as', 'a', 'amos', 'áis', 'an', 'é', 'aste', 'ó', 'imos', 'isteis', 'ieron', 'aba', 'abas', 'ábamos', 'abais', 'aban', 'ía', 'ías', 'íamos', 'íais', 'ían'];
  if (verbEndings.some(ending => context.word.endsWith(ending))) {
    confidence += 0.20;
    posIndicators.push('verb conjugation ending');
  }

  // Check if word is IMMEDIATELY preceded by article (would indicate noun usage)
  // Only flag as noun if article is within 2 words before the target word
  const articles = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];
  const hasImmediateArticle = context.before.slice(-2).some(w => articles.includes(w));
  
  if (hasImmediateArticle && !context.before.some(w => reflexivePronouns.includes(w))) {
    // Check if there's a subject pronoun (which would override article detection)
    const hasSubjectPronoun = context.before.some(w => subjectPronouns.includes(w));
    
    if (!hasSubjectPronoun) {
      // Strong evidence this is a noun, not a verb
      return {
        isValid: false,
        confidence: 0.85,
        detectedPOS: 'noun',
        reason: 'Article immediately before word - likely noun usage',
      };
    }
  }

  // Normalize confidence
  confidence = Math.min(confidence, 1.0);

  return {
    isValid: confidence >= 0.35,
    confidence,
    detectedPOS: 'verb',
    reason: confidence >= 0.35
      ? `Verb indicators found: ${posIndicators.join(', ')}`
      : 'No clear verb indicators',
  };
}

/**
 * Validates adjective usage in context
 */
function validateAdjectiveUsage(
  word: string,
  context: WordContext,
  fullSentence: string
): POSValidationResult {
  // Copular verbs (ser/estar) - expanded list
  const copularVerbs = ['es', 'son', 'era', 'eran', 'fue', 'fueron', 'está', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron', 'estoy', 'estás', 'sea', 'sean'];
  // Articles (adjectives often follow nouns which follow articles)
  const articles = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];
  // Possessives
  const possessives = ['mi', 'tu', 'su', 'mis', 'tus', 'sus', 'nuestro', 'nuestra', 'vuestro', 'vuestra'];

  let confidence = 0;
  let posIndicators: string[] = [];

  // Check for copular verb + adjective pattern (IMMEDIATE precedence)
  const lastWord = context.before[context.before.length - 1];
  if (copularVerbs.includes(lastWord)) {
    confidence += 0.55;
    posIndicators.push('copular verb');
  }

  // In Spanish, adjectives typically follow nouns
  // Check if preceded by a word that could be a noun (often after articles)
  const hasArticleInBefore = context.before.some(w => articles.includes(w));
  const hasPossessiveInBefore = context.before.some(w => possessives.includes(w));
  
  if ((hasArticleInBefore || hasPossessiveInBefore) && context.before.length >= 1) {
    // Pattern: article/possessive + (noun) + adjective
    confidence += 0.25;
    posIndicators.push('post-nominal position');
  }

  // Check for typical adjective endings
  const adjectiveEndings = ['o', 'a', 'os', 'as', 'e', 'es', 'ante', 'iente', 'oso', 'osa', 'able', 'ible'];
  if (adjectiveEndings.some(ending => context.word.endsWith(ending))) {
    confidence += 0.10;
    posIndicators.push('adjective ending');
  }

  // Bonus: check for comparative structures (más/menos + adjective)
  if (context.before.includes('más') || context.before.includes('menos') || context.before.includes('muy') || context.before.includes('tan')) {
    confidence += 0.35;
    posIndicators.push('comparative/superlative');
  }

  // Normalize confidence
  confidence = Math.min(confidence, 1.0);

  return {
    isValid: confidence >= 0.30,
    confidence,
    detectedPOS: 'adjective',
    reason: confidence >= 0.30
      ? `Adjective indicators found: ${posIndicators.join(', ')}`
      : 'No clear adjective indicators',
  };
}

/**
 * Validates adverb usage in context
 */
function validateAdverbUsage(
  word: string,
  context: WordContext,
  fullSentence: string
): POSValidationResult {
  // Adverbs typically modify verbs, adjectives, or other adverbs
  // Common positions: before verbs, before adjectives, at sentence start/end

  let confidence = 0;
  let posIndicators: string[] = [];

  // Known Spanish adverbs (high confidence)
  const commonAdverbs = new Set([
    'siempre', 'nunca', 'jamás', 'también', 'tampoco', 'muy', 'bien', 'mal',
    'aquí', 'ahí', 'allí', 'cerca', 'lejos', 'hoy', 'ayer', 'mañana', 'ahora',
    'luego', 'después', 'antes', 'pronto', 'tarde', 'temprano', 'más', 'menos',
    'mucho', 'poco', 'bastante', 'demasiado', 'casi', 'apenas', 'solo', 'solamente',
  ]);

  if (commonAdverbs.has(context.word)) {
    confidence += 0.85;
    posIndicators.push('common adverb');
  }

  // Check for -mente ending (most common Spanish adverb pattern)
  if (context.word.endsWith('mente')) {
    confidence += 0.90;
    posIndicators.push('-mente ending');
  }

  // Check if modifying an adjective (muy, bastante, demasiado + adjective)
  const adjectiveModifiers = ['muy', 'bastante', 'demasiado', 'más', 'menos', 'poco', 'mucho', 'tan'];
  if (adjectiveModifiers.includes(context.word)) {
    confidence += 0.40;
    posIndicators.push('adjective modifier');
  }

  // Check for verb modification context
  if (context.before.length > 0 || context.after.length > 0) {
    confidence += 0.10;
    posIndicators.push('contextual position');
  }

  // Normalize confidence
  confidence = Math.min(confidence, 1.0);

  return {
    isValid: confidence >= 0.30,
    confidence,
    detectedPOS: 'adverb',
    reason: confidence >= 0.30
      ? `Adverb indicators found: ${posIndicators.join(', ')}`
      : 'No clear adverb indicators',
  };
}

/**
 * Normalize Spanish text for matching (remove accents, convert to lowercase)
 */
function normalizeSpanish(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

/**
 * Finds the position of a word in a sentence
 * Handles conjugated forms, accents, and word boundaries
 */
function findWordPosition(sentence: string, word: string): number {
  const normalizedSentence = normalizeSpanish(sentence);
  const normalizedWord = normalizeSpanish(word);

  // First try exact match
  const exactPattern = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'i');
  const exactMatch = normalizedSentence.match(exactPattern);
  if (exactMatch && exactMatch.index !== undefined) {
    return exactMatch.index;
  }

  // For verbs, try to match stem more aggressively
  if (normalizedWord.endsWith('ar') || normalizedWord.endsWith('er') || normalizedWord.endsWith('ir')) {
    // Get base stem (remove infinitive ending)
    let stem = normalizedWord.slice(0, -2);
    
    // Handle stem-changing verbs (e→ie, o→ue, e→i patterns)
    // Try multiple stem variations
    const stemVariations = [
      stem, // Original stem
      stem.replace(/e$/, 'ie'), // e→ie (pensar→pienso)
      stem.replace(/o$/, 'ue'), // o→ue (dormir→duermo)
      stem.replace(/e$/, 'i'),  // e→i (pedir→pido)
    ];
    
    for (const variation of stemVariations) {
      const stemPattern = new RegExp(`\\b${escapeRegex(variation)}\\w*\\b`, 'i');
      const stemMatch = normalizedSentence.match(stemPattern);
      if (stemMatch && stemMatch.index !== undefined) {
        return stemMatch.index;
      }
    }
  }

  // For reflexive verbs (levantarse), check for separated forms (se levanta)
  if (normalizedWord.endsWith('arse') || normalizedWord.endsWith('erse') || normalizedWord.endsWith('irse')) {
    const baseStem = normalizedWord.slice(0, -4); // Remove -arse/-erse/-irse
    const reflexivePattern = new RegExp(`\\b(me|te|se|nos|os)\\s+${escapeRegex(baseStem)}\\w*\\b`, 'i');
    const reflexiveMatch = normalizedSentence.match(reflexivePattern);
    if (reflexiveMatch && reflexiveMatch.index !== undefined) {
      return reflexiveMatch.index + (reflexiveMatch[1]?.length || 0) + 1; // Position after pronoun
    }
  }

  return -1;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Batch validates multiple example sentences
 * Useful for filtering a list of examples
 * 
 * @param examples - Array of example sentences with the word
 * @param word - The Spanish word being validated
 * @param expectedPOS - Expected part of speech
 * @returns Array of validation results, one per example
 */
export function batchValidateExamples(
  examples: Array<{ spanish: string; english: string }>,
  word: string,
  expectedPOS: PartOfSpeech
): Array<POSValidationResult & { example: { spanish: string; english: string } }> {
  return examples.map(example => ({
    ...validateExamplePOS(example.spanish, word, expectedPOS),
    example,
  }));
}

/**
 * Filters examples to only include those with valid POS usage
 * 
 * @param examples - Array of example sentences
 * @param word - The Spanish word
 * @param expectedPOS - Expected part of speech
 * @param minConfidence - Minimum confidence threshold (default: 0.30)
 * @returns Filtered array with only valid examples
 */
export function filterValidExamples(
  examples: Array<{ spanish: string; english: string }>,
  word: string,
  expectedPOS: PartOfSpeech,
  minConfidence: number = 0.30
): Array<{ spanish: string; english: string }> {
  const validated = batchValidateExamples(examples, word, expectedPOS);
  return validated
    .filter(v => v.isValid && v.confidence >= minConfidence)
    .map(v => v.example);
}
