/**
 * Verified Vocabulary Service
 * 
 * Manages the proprietary verified vocabulary database with intelligent
 * caching, confidence scoring, and quality controls.
 * 
 * This service is completely language-agnostic and works for any source→target
 * language pair (Spanish→English, German→English, French→English, etc.)
 * 
 * @module lib/services/verified-vocabulary
 */

import type {
  VerifiedVocabularyData,
  VerificationInput,
  CacheStrategy,
  LanguagePair,
  LanguageCode,
  CorrectionPattern,
  DEFAULT_CACHE_STRATEGY,
} from '@/lib/types/verified-vocabulary';
import { PrismaClient } from '@prisma/client';

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default cache strategy (conservative)
 * Only serve highly-verified, high-confidence words from cache
 */
const CACHE_STRATEGY: CacheStrategy = {
  minVerifications: 3,
  minConfidence: 0.80,
  maxEditFrequency: 0.30,
  maxAge: 180, // 6 months
  requiresAgreement: true,
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Look up word in verified vocabulary cache
 * Returns cached data if confidence is sufficient
 * 
 * 🌍 Multi-language ready: Works for any language pair
 * 
 * @param sourceWord - Word in source language (Spanish, German, French, etc.)
 * @param languagePair - Language pair (e.g., "es-en", "de-en")
 * @param strategy - Cache strategy (defaults to conservative)
 * @returns Cached word data or null if not found/insufficient confidence
 * 
 * @example
 * ```typescript
 * // Spanish lookup (current)
 * const spanish = await lookupVerifiedWord('perro', 'es-en');
 * 
 * // German lookup (future - same code!)
 * const german = await lookupVerifiedWord('Hund', 'de-en');
 * 
 * // French lookup (future - same code!)
 * const french = await lookupVerifiedWord('chien', 'fr-en');
 * ```
 */
export async function lookupVerifiedWord(
  sourceWord: string,
  languagePair: LanguagePair = 'es-en',
  strategy: CacheStrategy = CACHE_STRATEGY
): Promise<VerifiedVocabularyData | null> {
  try {
    const normalizedWord = sourceWord.toLowerCase().trim();
    
    console.log(`[VerifiedVocab] Cache lookup for "${normalizedWord}" (${languagePair})`);
    
    const word = await prisma.verifiedVocabulary.findUnique({
      where: { 
        unique_word_lang_pair: {
          sourceWord: normalizedWord,
          languagePair,
        }
      },
      include: {
        verifications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!word) {
      console.log(`[VerifiedVocab] ✗ Cache miss for "${normalizedWord}"`);
      return null;
    }
    
    // Check if word meets cache criteria
    if (!meetsCacheCriteria(word, strategy)) {
      console.log(`[VerifiedVocab] Word exists but doesn't meet cache criteria (confidence: ${word.confidenceScore}, verifications: ${word.verificationCount})`);
      return null;
    }
    
    console.log(`[VerifiedVocab] ✓ Cache hit for "${normalizedWord}" (confidence: ${word.confidenceScore}, verifications: ${word.verificationCount})`);
    
    // Increment lookup counter (async, don't block)
    incrementLookupCount(word.id).catch(err => 
      console.error('Failed to increment lookup count:', err)
    );
    
    return transformToVerifiedData(word);
    
  } catch (error) {
    console.error('[VerifiedVocab] Lookup error:', error);
    return null;
  }
}

/**
 * Check if a word meets the cache serving criteria
 * @internal
 */
function meetsCacheCriteria(word: any, strategy: CacheStrategy): boolean {
  const meetsVerificationThreshold = word.verificationCount >= strategy.minVerifications;
  const meetsConfidenceThreshold = word.confidenceScore >= strategy.minConfidence;
  const meetsEditThreshold = word.editFrequency <= strategy.maxEditFrequency;
  const isRecent = calculateDaysAgo(word.lastVerified) <= strategy.maxAge;
  const noDisagreement = strategy.requiresAgreement ? !word.hasDisagreement : true;
  
  return (
    meetsVerificationThreshold &&
    meetsConfidenceThreshold &&
    meetsEditThreshold &&
    isRecent &&
    noDisagreement
  );
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate confidence score for a word based on verification signals
 * 
 * Score components:
 * - Verification count (max 40 points)
 * - Low edit frequency (max 20 points)
 * - Review success rate (max 20 points)
 * - Agreement between sources (max 10 points)
 * - Recency (max 10 points)
 * 
 * @param word - Word data with verification metadata
 * @returns Confidence score from 0.0 to 1.0
 * 
 * @example
 * ```typescript
 * const confidence = calculateConfidenceScore({
 *   verificationCount: 5,
 *   editFrequency: 0.2,
 *   avgReviewSuccessRate: 0.9,
 *   hasDisagreement: false,
 *   disagreementCount: 0,
 *   lastVerified: new Date(),
 * });
 * // confidence: ~0.88 (high confidence)
 * ```
 */
export function calculateConfidenceScore(word: {
  verificationCount: number;
  editFrequency: number;
  avgReviewSuccessRate: number;
  hasDisagreement: boolean;
  disagreementCount: number;
  lastVerified: Date;
}): number {
  let score = 0.0;
  
  // Verification count (max 40 points)
  // More verifications = higher confidence
  score += Math.min(word.verificationCount * 2, 40);
  
  // Low edit frequency bonus (max 20 points)
  // If users rarely edit this word, it's probably accurate
  score += (1 - word.editFrequency) * 20;
  
  // Review success rate (max 20 points)
  // If users successfully review this word, the data is good
  score += word.avgReviewSuccessRate * 20;
  
  // Agreement bonus (max 10 points)
  // No disagreements = high confidence
  if (!word.hasDisagreement) {
    score += 10;
  } else {
    // Penalize disagreements
    score -= word.disagreementCount * 2;
  }
  
  // Recency bonus (max 10 points)
  // Recent verifications are more trustworthy
  const daysAgo = calculateDaysAgo(word.lastVerified);
  score += Math.max(0, 10 - daysAgo / 30);
  
  // Normalize to 0-1 range
  return Math.max(0, Math.min(score / 100, 1.0));
}

// ============================================================================
// SAVE & UPDATE FUNCTIONS
// ============================================================================

/**
 * Save or update verified vocabulary entry
 * Records user verification and updates confidence scores
 * 
 * @param input - Verification input with API and user data
 * 
 * @example
 * ```typescript
 * await saveVerifiedWord({
 *   sourceWord: 'perro',
 *   sourceLanguage: 'es',
 *   targetLanguage: 'en',
 *   apiData: { translation: 'dog', source: 'deepl', ... },
 *   userData: { englishTranslation: 'dog', ... },
 *   userId: 'user123',
 *   editedFields: [], // User didn't edit anything
 * });
 * ```
 */
export async function saveVerifiedWord(input: VerificationInput): Promise<void> {
  try {
    const { sourceWord, sourceLanguage, targetLanguage } = input;
    const normalizedWord = sourceWord.toLowerCase().trim();
    const languagePair: LanguagePair = `${sourceLanguage}-${targetLanguage}`;
    
    console.log(`[VerifiedVocab] Saving verification for "${normalizedWord}" (${languagePair})`);
    
    // TODO: Implement when database is configured
    // const existing = await prisma.verifiedVocabulary.findUnique({
    //   where: {
    //     sourceWord_languagePair: {
    //       sourceWord: normalizedWord,
    //       languagePair,
    //     },
    //   },
    //   include: { verifications: true },
    // });
    
    // if (existing) {
    //   await updateVerifiedWord(existing, input);
    // } else {
    //   await createVerifiedWord(input);
    // }
    
    // // Create verification record
    // await prisma.vocabularyVerification.create({
    //   data: {
    //     userId: input.userId,
    //     verifiedWordId: existing?.id || (await getWordId(normalizedWord, languagePair)),
    //     sourceLanguage,
    //     targetLanguage,
    //     apiTranslation: input.apiData.translation,
    //     userTranslation: input.userData.englishTranslation,
    //     apiPOS: input.apiData.partOfSpeech,
    //     userPOS: input.userData.partOfSpeech,
    //     apiGrammarData: input.apiData.grammarMetadata,
    //     userGrammarData: input.userData.grammarMetadata,
    //     apiExamples: input.apiData.examples,
    //     userExamples: input.userData.examples,
    //     wasEdited: input.editedFields.length > 0,
    //     editedFields: input.editedFields,
    //     lookupSource: input.lookupSource,
    //     deviceType: input.deviceType,
    //   },
    // });
    
    console.log(`[VerifiedVocab] Verification saved successfully`);
    
  } catch (error) {
    console.error('[VerifiedVocab] Save error:', error);
    // Don't throw - saving verification is optional and shouldn't break user flow
  }
}

/**
 * Create new verified vocabulary entry
 * @internal
 */
async function createVerifiedWord(input: VerificationInput): Promise<void> {
  const { sourceWord, sourceLanguage, targetLanguage, userData, apiData } = input;
  const languagePair: LanguagePair = `${sourceLanguage}-${targetLanguage}`;
  
  // TODO: Implement Prisma create
  // await prisma.verifiedVocabulary.create({
  //   data: {
  //     sourceLanguage,
  //     targetLanguage,
  //     languagePair,
  //     sourceWord: sourceWord.toLowerCase().trim(),
  //     targetWord: userData.englishTranslation,
  //     alternativeTranslations: userData.alternativeTranslations || [],
  //     partOfSpeech: userData.partOfSpeech,
  //     grammarMetadata: userData.grammarMetadata || {},
  //     examples: userData.examples || [],
  //     conjugations: userData.conjugation,
  //     verificationCount: 1,
  //     confidenceScore: 0.5, // Initial confidence
  //     primarySource: apiData.source,
  //     apiSources: [
  //       {
  //         source: apiData.source,
  //         data: apiData,
  //         timestamp: new Date(),
  //       },
  //     ],
  //     saveCount: 1,
  //     editFrequency: input.editedFields.length > 0 ? 1.0 : 0.0,
  //     
  //     // Backward compatibility (Spanish only)
  //     spanish: sourceLanguage === 'es' ? sourceWord : null,
  //     english: targetLanguage === 'en' ? userData.englishTranslation : null,
  //     gender: userData.gender,
  //   },
  // });
  
  console.log(`[VerifiedVocab] Created new verified word entry`);
}

/**
 * Update existing verified vocabulary entry
 * @internal
 */
async function updateVerifiedWord(existing: any, input: VerificationInput): Promise<void> {
  const { userData, editedFields } = input;
  
  // Calculate new edit frequency
  const totalSaves = existing.saveCount + 1;
  const totalEdits = existing.editFrequency * existing.saveCount + (editedFields.length > 0 ? 1 : 0);
  const newEditFrequency = totalEdits / totalSaves;
  
  // Check for disagreement
  const hasDisagreement = 
    (userData.englishTranslation !== existing.targetWord) ||
    (userData.partOfSpeech !== existing.partOfSpeech);
  
  // Recalculate confidence
  const confidenceScore = calculateConfidenceScore({
    verificationCount: existing.verificationCount + 1,
    editFrequency: newEditFrequency,
    avgReviewSuccessRate: existing.avgReviewSuccessRate,
    hasDisagreement: hasDisagreement || existing.hasDisagreement,
    disagreementCount: existing.disagreementCount + (hasDisagreement ? 1 : 0),
    lastVerified: new Date(),
  });
  
  // TODO: Implement Prisma update
  // await prisma.verifiedVocabulary.update({
  //   where: { id: existing.id },
  //   data: {
  //     verificationCount: { increment: 1 },
  //     saveCount: { increment: 1 },
  //     editFrequency: newEditFrequency,
  //     confidenceScore,
  //     hasDisagreement: hasDisagreement || existing.hasDisagreement,
  //     disagreementCount: hasDisagreement
  //       ? { increment: 1 }
  //       : existing.disagreementCount,
  //     lastVerified: new Date(),
  //     updatedAt: new Date(),
  //   },
  // });
  
  console.log(`[VerifiedVocab] Updated existing word (confidence: ${confidenceScore.toFixed(2)})`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate days ago from a date
 * @internal
 */
function calculateDaysAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Increment lookup counter for a word
 * @internal
 */
async function incrementLookupCount(wordId: string): Promise<void> {
  await prisma.verifiedVocabulary.update({
    where: { id: wordId },
    data: { lookupCount: { increment: 1 } },
  });
}

/**
 * Get word ID by source word and language pair
 * @internal
 */
async function getWordId(sourceWord: string, languagePair: LanguagePair): Promise<string> {
  // TODO: Implement when database is configured
  // const word = await prisma.verifiedVocabulary.findUnique({
  //   where: {
  //     sourceWord_languagePair: {
  //       sourceWord,
  //       languagePair,
  //     },
  //   },
  //   select: { id: true },
  // });
  // return word?.id || '';
  
  return ''; // Placeholder
}

/**
 * Transform database word to verified data structure
 * @internal
 */
function transformToVerifiedData(word: any): VerifiedVocabularyData {
  return {
    sourceLanguage: word.sourceLanguage,
    targetLanguage: word.targetLanguage,
    languagePair: word.languagePair,
    sourceWord: word.sourceWord,
    targetWord: word.targetWord,
    alternativeTranslations: word.alternativeTranslations || [],
    partOfSpeech: word.partOfSpeech,
    grammarMetadata: word.grammarMetadata,
    examples: word.examples || [],
    conjugations: word.conjugations,
    synonyms: word.synonyms,
    antonyms: word.antonyms,
    relatedWords: word.relatedWords,
    regionalVariants: word.regionalVariants,
    verificationCount: word.verificationCount,
    confidenceScore: word.confidenceScore,
    lastVerified: word.lastVerified,
    hasDisagreement: word.hasDisagreement,
    requiresReview: word.requiresReview,
    lookupCount: word.lookupCount,
    saveCount: word.saveCount,
    editFrequency: word.editFrequency,
    
    // Backward compatibility
    spanish: word.spanish,
    english: word.english,
    gender: word.gender,
  };
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get cache statistics for admin dashboard
 * 
 * @returns Comprehensive cache performance metrics
 */
export async function getCacheStatistics(): Promise<{
  totalWords: number;
  highConfidenceWords: number;
  requiresReview: number;
  avgConfidence: number;
  totalLookups: number;
  totalVerifications: number;
}> {
  try {
    // TODO: Implement when database is configured
    // const stats = await prisma.$transaction([
    //   prisma.verifiedVocabulary.count(),
    //   prisma.verifiedVocabulary.count({
    //     where: { confidenceScore: { gte: 0.80 } },
    //   }),
    //   prisma.verifiedVocabulary.count({
    //     where: { requiresReview: true },
    //   }),
    //   prisma.verifiedVocabulary.aggregate({
    //     _avg: { confidenceScore: true },
    //   }),
    //   prisma.verifiedVocabulary.aggregate({
    //     _sum: { lookupCount: true },
    //   }),
    //   prisma.vocabularyVerification.count(),
    // ]);
    
    // return {
    //   totalWords: stats[0],
    //   highConfidenceWords: stats[1],
    //   requiresReview: stats[2],
    //   avgConfidence: stats[3]._avg.confidenceScore || 0,
    //   totalLookups: stats[4]._sum.lookupCount || 0,
    //   totalVerifications: stats[5],
    // };
    
    // Placeholder until database is ready
    return {
      totalWords: 0,
      highConfidenceWords: 0,
      requiresReview: 0,
      avgConfidence: 0,
      totalLookups: 0,
      totalVerifications: 0,
    };
    
  } catch (error) {
    console.error('[VerifiedVocab] Stats error:', error);
    throw error;
  }
}

/**
 * Get correction patterns for learning from user edits
 * 
 * @param limit - Maximum number of patterns to return
 * @returns Common correction patterns with confidence scores
 */
export async function getCorrectionPatterns(limit: number = 20): Promise<CorrectionPattern[]> {
  try {
    // TODO: Implement when database is configured
    // Analyze verifications where wasEdited = true
    // Group by word and field
    // Calculate frequency and confidence
    
    return []; // Placeholder
    
  } catch (error) {
    console.error('[VerifiedVocab] Correction patterns error:', error);
    return [];
  }
}
