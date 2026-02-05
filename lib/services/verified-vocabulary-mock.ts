/**
 * Mock version of verified vocabulary service for UI testing
 * This temporarily overrides the real service to return mock cached data
 */

import type {
  VerifiedVocabularyData,
  LanguagePair,
  CacheStrategy,
} from '../types/verified-vocabulary';
import type { PartOfSpeech } from '../types/vocabulary';

/**
 * Mock cached vocabulary data for testing the cache indicators UI
 */
const MOCK_CACHED_WORDS: Record<string, VerifiedVocabularyData> = {
  'perro-es-en': {
    sourceLanguage: 'es',
    targetLanguage: 'en',
    languagePair: 'es-en',
    sourceWord: 'perro',
    targetWord: 'dog',
    alternativeTranslations: ['hound', 'pup', 'pooch'],
    partOfSpeech: 'noun' as PartOfSpeech,
    grammarMetadata: {
      gender: 'masculine',
      plural: 'perros',
    },
    examples: [
      {
        spanish: 'El perro es muy amigable',
        english: 'The dog is very friendly',
      },
      {
        spanish: 'Mi perro se llama Max',
        english: 'My dog is called Max',
      },
    ],
    conjugations: undefined,
    synonyms: ['can'],
    antonyms: ['gato'],
    relatedWords: ['cachorro', 'mascota'],
    regionalVariants: [],
    verificationCount: 5,
    confidenceScore: 0.88,
    lastVerified: new Date('2026-02-01T12:00:00Z'),
    hasDisagreement: false,
    requiresReview: false,
    lookupCount: 42,
    saveCount: 12,
    editFrequency: 0.05,
  },
  'gato-es-en': {
    sourceLanguage: 'es',
    targetLanguage: 'en',
    languagePair: 'es-en',
    sourceWord: 'gato',
    targetWord: 'cat',
    alternativeTranslations: ['feline', 'kitty'],
    partOfSpeech: 'noun' as PartOfSpeech,
    grammarMetadata: {
      gender: 'masculine',
      plural: 'gatos',
    },
    examples: [
      {
        spanish: 'El gato está durmiendo',
        english: 'The cat is sleeping',
      },
    ],
    conjugations: undefined,
    synonyms: ['felino'],
    antonyms: ['perro'],
    relatedWords: ['gatito', 'mascota'],
    regionalVariants: [],
    verificationCount: 8,
    confidenceScore: 0.92,
    lastVerified: new Date('2026-02-03T09:00:00Z'),
    hasDisagreement: false,
    requiresReview: false,
    lookupCount: 67,
    saveCount: 18,
    editFrequency: 0.03,
  },
  'hola-es-en': {
    sourceLanguage: 'es',
    targetLanguage: 'en',
    languagePair: 'es-en',
    sourceWord: 'hola',
    targetWord: 'hello',
    alternativeTranslations: ['hi', 'hey', 'greetings'],
    partOfSpeech: 'interjection' as PartOfSpeech,
    grammarMetadata: {},
    examples: [
      {
        spanish: '¡Hola! ¿Cómo estás?',
        english: 'Hello! How are you?',
      },
    ],
    conjugations: undefined,
    synonyms: ['saludos'],
    antonyms: ['adiós'],
    relatedWords: ['bienvenido', 'buenos días'],
    regionalVariants: [],
    verificationCount: 15,
    confidenceScore: 0.95,
    lastVerified: new Date('2026-02-04T16:00:00Z'),
    hasDisagreement: false,
    requiresReview: false,
    lookupCount: 128,
    saveCount: 35,
    editFrequency: 0.02,
  },
  'casa-es-en': {
    sourceLanguage: 'es',
    targetLanguage: 'en',
    languagePair: 'es-en',
    sourceWord: 'casa',
    targetWord: 'house',
    alternativeTranslations: ['home', 'residence'],
    partOfSpeech: 'noun' as PartOfSpeech,
    grammarMetadata: {
      gender: 'feminine',
      plural: 'casas',
    },
    examples: [
      {
        spanish: 'Mi casa es grande',
        english: 'My house is big',
      },
    ],
    conjugations: undefined,
    synonyms: ['hogar', 'vivienda'],
    antonyms: [],
    relatedWords: ['apartamento', 'edificio'],
    regionalVariants: [],
    verificationCount: 3,
    confidenceScore: 0.82,
    lastVerified: new Date('2026-02-02T11:00:00Z'),
    hasDisagreement: false,
    requiresReview: false,
    lookupCount: 23,
    saveCount: 8,
    editFrequency: 0.12,
  },
};

/**
 * Mock lookup function that returns cached data if available
 * Use this for UI testing by importing from this file instead of the real service
 */
export async function lookupVerifiedWord(
  sourceWord: string,
  languagePair: LanguagePair = 'es-en',
  strategy?: CacheStrategy
): Promise<VerifiedVocabularyData | null> {
  const normalizedWord = sourceWord.toLowerCase().trim();
  const cacheKey = `${normalizedWord}-${languagePair}`;
  
  console.log(`[Mock VerifiedVocab] Looking up "${normalizedWord}" (${languagePair})`);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  const cachedData = MOCK_CACHED_WORDS[cacheKey];
  
  if (cachedData) {
    console.log(`[Mock VerifiedVocab] ✓ Cache hit for "${normalizedWord}" (confidence: ${cachedData.confidenceScore.toFixed(2)})`);
    return cachedData;
  }
  
  console.log(`[Mock VerifiedVocab] ✗ Cache miss for "${normalizedWord}"`);
  return null;
}

/**
 * Get mock cache statistics for testing
 */
export function getMockCacheStatistics() {
  const words = Object.values(MOCK_CACHED_WORDS);
  
  return {
    totalWords: words.length,
    avgConfidenceScore: words.reduce((sum, w) => sum + w.confidenceScore, 0) / words.length,
    avgVerificationCount: words.reduce((sum, w) => sum + w.verificationCount, 0) / words.length,
    highConfidenceCount: words.filter((w) => w.confidenceScore >= 0.9).length,
    mediumConfidenceCount: words.filter((w) => w.confidenceScore >= 0.8 && w.confidenceScore < 0.9).length,
    lowConfidenceCount: words.filter((w) => w.confidenceScore < 0.8).length,
  };
}

/**
 * List all mock cached words
 */
export function listMockCachedWords(): string[] {
  return Object.values(MOCK_CACHED_WORDS).map((w) => w.sourceWord);
}
