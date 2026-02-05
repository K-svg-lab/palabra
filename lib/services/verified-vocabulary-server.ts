/**
 * Verified Vocabulary Server-Side Service
 * 
 * This file contains the server-only database operations for verified vocabulary.
 * It should ONLY be imported by API routes and server components.
 */

import 'server-only';
import { prisma } from './prisma-client';
import type {
  VerifiedVocabularyData,
  VerificationInput,
  CacheStrategy,
  LanguagePair,
} from '@/lib/types/verified-vocabulary';
import { calculateConfidenceScore, CACHE_STRATEGY } from './verified-vocabulary';

/**
 * Look up word in verified vocabulary cache (SERVER-ONLY)
 */
export async function lookupVerifiedWordServer(
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
 */
function meetsCacheCriteria(word: any, strategy: CacheStrategy): boolean {
  const meetsVerificationThreshold = word.verificationCount >= strategy.minVerifications;
  const meetsConfidenceThreshold = word.confidenceScore >= strategy.minConfidence;
  const meetsEditThreshold = word.editFrequency <= strategy.maxEditFrequency;
  
  // Check age (days)
  const lastVerifiedDate = word.lastVerified instanceof Date ? word.lastVerified : new Date(word.lastVerified);
  const daysAgo = Math.floor((Date.now() - lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24));
  const meetsAgeThreshold = daysAgo <= strategy.maxAge;
  
  // Check agreement
  const meetsAgreementThreshold = !strategy.requiresAgreement || !word.hasDisagreement;
  
  return (
    meetsVerificationThreshold &&
    meetsConfidenceThreshold &&
    meetsEditThreshold &&
    meetsAgeThreshold &&
    meetsAgreementThreshold
  );
}

/**
 * Transform database word to verified data structure
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
    primarySource: word.primarySource,
    apiSources: word.apiSources,
    hasDisagreement: word.hasDisagreement,
    disagreementCount: word.disagreementCount,
    requiresReview: word.requiresReview,
    isOffensive: word.isOffensive,
    lookupCount: word.lookupCount,
    saveCount: word.saveCount,
    editFrequency: word.editFrequency,
    avgReviewSuccessRate: word.avgReviewSuccessRate,
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
    lastRefreshedAt: word.lastRefreshedAt,
  };
}

/**
 * Increment lookup counter for a word
 */
async function incrementLookupCount(wordId: string): Promise<void> {
  await prisma.verifiedVocabulary.update({
    where: { id: wordId },
    data: { lookupCount: { increment: 1 } },
  });
}
