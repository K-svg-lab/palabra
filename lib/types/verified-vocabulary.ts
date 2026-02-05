/**
 * Verified Vocabulary Type Definitions
 * 
 * Types for the proprietary verified vocabulary database system.
 * Supports multi-language architecture for future expansion.
 * 
 * @module lib/types/verified-vocabulary
 */

import type { Gender, PartOfSpeech, ExampleSentence, VerbConjugation } from './vocabulary';

// ============================================================================
// MULTI-LANGUAGE SUPPORT
// ============================================================================

/**
 * Supported language codes (ISO 639-1)
 * Easily expandable - just add new language codes here
 */
export type LanguageCode = 
  | 'es'  // Spanish
  | 'en'  // English
  | 'de'  // German
  | 'fr'  // French
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'ja'  // Japanese
  | 'zh'  // Mandarin Chinese
  | 'ko'  // Korean
  | 'ar'  // Arabic
  | 'ru'; // Russian

/**
 * Language pair format: "source-target" (e.g., "es-en", "de-en")
 * Used for fast lookups and filtering
 */
export type LanguagePair = `${LanguageCode}-${LanguageCode}`;

// ============================================================================
// GRAMMAR METADATA (Language-Specific)
// ============================================================================

/**
 * Flexible grammar metadata structure
 * Each language can store its unique grammatical features in JSON
 * This avoids database schema changes when adding new languages
 */
export interface GrammarMetadata {
  // Spanish-specific fields
  gender?: 'masculine' | 'feminine' | 'neutral';
  
  // German-specific fields
  case?: 'nominative' | 'accusative' | 'dative' | 'genitive';
  article?: 'der' | 'die' | 'das';
  
  // Japanese-specific fields
  kanji?: string;
  hiragana?: string;
  katakana?: string;
  formality?: 'casual' | 'polite' | 'formal';
  
  // French-specific fields
  liaison?: boolean;
  elision?: boolean;
  
  // Arabic-specific fields
  diacritics?: boolean;
  pluralForms?: string[];
  
  // Mandarin-specific fields
  simplified?: string;
  traditional?: string;
  pinyin?: string;
  tones?: number[];
  
  // Universal fields (applicable to multiple languages)
  plural?: string;
  irregularForms?: Record<string, string>;
  [key: string]: any; // Allow additional language-specific fields
}

// ============================================================================
// REGIONAL VARIANTS
// ============================================================================

/**
 * Spanish regions for dialect tracking
 */
export type SpanishRegion = 
  | 'spain'
  | 'mexico'
  | 'argentina'
  | 'colombia'
  | 'chile'
  | 'peru'
  | 'venezuela'
  | 'cuba'
  | 'other';

/**
 * Regional variant of a word
 * Example: "coche" (Spain) vs "carro" (Mexico) vs "auto" (Argentina)
 */
export interface RegionalVariant {
  region: SpanishRegion | string; // Allow other regions for future languages
  term: string;
  isPreferred: boolean;
  usage: 'common' | 'formal' | 'slang' | 'archaic';
}

// ============================================================================
// VERIFIED VOCABULARY DATA
// ============================================================================

/**
 * Core verified vocabulary data structure
 * This is what gets returned from cache lookups
 */
export interface VerifiedVocabularyData {
  // Multi-language identifiers
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  languagePair: LanguagePair;
  
  // Core translation data
  sourceWord: string;              // The word in source language
  targetWord: string;              // Primary translation in target language
  alternativeTranslations: string[];
  
  // Universal metadata
  partOfSpeech?: PartOfSpeech;
  grammarMetadata?: GrammarMetadata; // Flexible language-specific data
  
  // Rich content
  examples: ExampleSentence[];
  conjugations?: VerbConjugation;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  regionalVariants?: RegionalVariant[];
  
  // Verification metadata
  verificationCount: number;
  confidenceScore: number;      // 0.0 to 1.0
  lastVerified: Date;
  
  // Quality indicators
  hasDisagreement: boolean;
  requiresReview: boolean;
  
  // Usage statistics
  lookupCount: number;
  saveCount: number;
  editFrequency: number;        // Percentage of times users edited this word
  
  // Backward compatibility (Spanish-specific, deprecated)
  /** @deprecated Use sourceWord instead */
  spanish?: string;
  /** @deprecated Use targetWord instead */
  english?: string;
  /** @deprecated Use grammarMetadata.gender instead */
  gender?: Gender;
}

// ============================================================================
// VERIFICATION INPUT
// ============================================================================

/**
 * Data structure for recording a user's verification of a word
 * Captures both API suggestions and user's final choices
 */
export interface VerificationInput {
  // Source word and language context
  sourceWord: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  
  // API data (what was suggested)
  apiData: {
    translation: string;
    alternativeTranslations?: string[];
    partOfSpeech?: PartOfSpeech;
    grammarMetadata?: GrammarMetadata;
    examples?: ExampleSentence[];
    conjugation?: VerbConjugation;
    source: string; // "deepl", "mymemory", etc.
  };
  
  // User data (what was saved)
  userData: {
    englishTranslation: string;
    alternativeTranslations?: string[];
    partOfSpeech?: PartOfSpeech;
    gender?: Gender;
    grammarMetadata?: GrammarMetadata;
    examples?: ExampleSentence[];
    conjugation?: VerbConjugation;
  };
  
  // User context
  userId: string;
  editedFields: string[]; // Which fields the user changed
  
  // Optional context
  lookupSource?: 'manual' | 'import' | 'voice';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

// ============================================================================
// CACHE STRATEGY
// ============================================================================

/**
 * Configuration for cache serving strategy
 * Determines when to serve from cache vs re-fetch from APIs
 */
export interface CacheStrategy {
  minVerifications: number;    // Minimum user verifications required
  minConfidence: number;       // Minimum confidence score (0.0 to 1.0)
  maxEditFrequency: number;    // Maximum allowed edit percentage
  maxAge: number;              // Maximum age in days before refresh
  requiresAgreement: boolean;  // Whether to require no disagreements
}

/**
 * Default cache strategy (conservative)
 */
export const DEFAULT_CACHE_STRATEGY: CacheStrategy = {
  minVerifications: 3,
  minConfidence: 0.80,
  maxEditFrequency: 0.30,
  maxAge: 180, // 6 months
  requiresAgreement: true,
};

/**
 * Aggressive cache strategy (for common words)
 */
export const AGGRESSIVE_CACHE_STRATEGY: CacheStrategy = {
  minVerifications: 1,
  minConfidence: 0.70,
  maxEditFrequency: 0.40,
  maxAge: 365,
  requiresAgreement: false,
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from verified vocabulary lookup
 * Includes cache metadata for transparency
 */
export interface VerifiedLookupResponse {
  word: string;
  translation: string;
  alternativeTranslations: string[];
  partOfSpeech?: PartOfSpeech;
  gender?: Gender;
  examples: ExampleSentence[];
  conjugation?: VerbConjugation;
  
  // Cache metadata (for debugging and UI)
  fromCache: boolean;
  cacheMetadata?: {
    verificationCount: number;
    confidenceScore: number;
    lastVerified: Date;
  };
  
  // Source information
  translationSource: 'verified-cache' | 'deepl' | 'mymemory' | 'fallback';
  translationConfidence?: number;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Cache performance statistics
 */
export interface CacheStatistics {
  totalWords: number;
  highConfidenceWords: number;
  requiresReview: number;
  avgConfidence: number;
  totalLookups: number;
  totalVerifications: number;
  cacheHitRate: number;
  apiCostSavings: number; // Percentage
  
  // By language pair
  byLanguagePair: Record<LanguagePair, {
    words: number;
    avgConfidence: number;
    lookups: number;
  }>;
}

/**
 * Verification pattern for learning from corrections
 */
export interface CorrectionPattern {
  word: string;
  languagePair: LanguagePair;
  field: string;
  apiValue: string;
  userValue: string;
  frequency: number;
  confidence: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid LanguageCode
 */
export function isLanguageCode(value: string): value is LanguageCode {
  const validCodes: LanguageCode[] = [
    'es', 'en', 'de', 'fr', 'it', 'pt', 'ja', 'zh', 'ko', 'ar', 'ru'
  ];
  return validCodes.includes(value as LanguageCode);
}

/**
 * Type guard to check if a value is a valid LanguagePair
 */
export function isLanguagePair(value: string): value is LanguagePair {
  const parts = value.split('-');
  if (parts.length !== 2) return false;
  return isLanguageCode(parts[0]) && isLanguageCode(parts[1]);
}

/**
 * Parse a language pair string into source and target languages
 * Returns null if the pair is invalid
 */
export function parseLanguagePair(pair: string): {
  source: LanguageCode;
  target: LanguageCode;
} | null {
  if (!isLanguagePair(pair)) {
    return null;
  }
  const [source, target] = pair.split('-') as [LanguageCode, LanguageCode];
  return { source, target };
}

/**
 * Create a language pair from source and target codes
 */
export function createLanguagePair(
  source: LanguageCode,
  target: LanguageCode
): LanguagePair {
  return `${source}-${target}`;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Partial update for verified vocabulary
 * Used for incremental updates without full data
 */
export type VerifiedVocabularyUpdate = Partial<VerifiedVocabularyData> & {
  sourceWord: string;
  languagePair: LanguagePair;
};

/**
 * Query filters for verified vocabulary
 */
export interface VerifiedVocabularyFilters {
  languagePair?: LanguagePair;
  sourceLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  minConfidence?: number;
  requiresReview?: boolean;
  hasDisagreement?: boolean;
  minVerifications?: number;
}
