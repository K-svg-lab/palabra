/**
 * Vocabulary Lookup API Route
 * 
 * Handles automated vocabulary lookup by coordinating translation,
 * dictionary, and example sentence services.
 * 
 * @module app/api/vocabulary/lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedTranslation } from '@/lib/services/translation';
import { getCompleteWordData } from '@/lib/services/dictionary';
import { getWordRelationships, getVerbConjugation } from '@/lib/services/word-relationships';
import { getWordImages } from '@/lib/services/images';
import { trackWordLookup, detectDeviceType } from '@/lib/services/analytics';
import { crossValidateTranslations, getCrossValidationExplanation, getConfidencePenalty } from '@/lib/services/cross-validation';
import type { TranslationSource } from '@/lib/services/cross-validation';
import { getRaeDefinition, mapRaeCategoryToPartOfSpeech } from '@/lib/services/rae';
import type { RaeDefinition } from '@/lib/services/rae';
import { PrismaClient } from '@prisma/client';
import type { PartOfSpeech } from '@/lib/types/vocabulary';
import type { LanguagePair, VerifiedVocabularyData, CacheStrategy } from '@/lib/types/verified-vocabulary';
import { generateExamples } from '@/lib/services/ai-example-generator';
import type { CEFRLevel } from '@/lib/types/proficiency';
import { getSession } from '@/lib/backend/auth';

// Prisma client singleton (API route only - proper Next.js pattern)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Cache strategy for verified vocabulary
const CACHE_STRATEGY: CacheStrategy = {
  minVerifications: 3,
  minConfidence: 0.80,
  maxEditFrequency: 0.30,
  maxAge: 180, // 6 months
  requiresAgreement: true,
};

/**
 * Converts gerund (-ing) forms to infinitive base form
 * Examples: "selecting" -> "select", "eating" -> "eat"
 */
function gerundToInfinitive(word: string): string {
  // Handle common irregular patterns first
  const irregulars: Record<string, string> = {
    'being': 'be',
    'seeing': 'see',
    'having': 'have',
    'doing': 'do',
    'going': 'go',
    'lying': 'lie',
    'dying': 'die',
    'tying': 'tie',
  };
  
  const lower = word.toLowerCase();
  if (irregulars[lower]) {
    return irregulars[lower];
  }
  
  // Pattern: -ing ending
  if (!lower.endsWith('ing')) {
    return word;
  }
  
  // Remove -ing
  let base = lower.slice(0, -3);
  
  // Pattern: doubling consonant (running -> run, getting -> get)
  if (base.length >= 3) {
    const lastTwo = base.slice(-2);
    const lastChar = lastTwo[1];
    const secondLast = lastTwo[0];
    
    // If last two chars are the same consonant, remove one
    if (lastChar === secondLast && !'aeiou'.includes(lastChar)) {
      base = base.slice(0, -1);
    }
  }
  
  // Pattern: -e dropping (making -> make, taking -> take)
  // Check if adding 'e' makes a common verb
  const withE = base + 'e';
  const commonEVerbs = ['make', 'take', 'give', 'come', 'write', 'use', 'have', 'like', 'love', 'move', 'change', 'place', 'leave', 'live', 'serve', 'close', 'lose', 'choose', 'force', 'save'];
  if (commonEVerbs.includes(withE)) {
    return withE;
  }
  
  // Pattern: -ie to -y (lying -> lie, dying -> die)
  if (base.endsWith('y')) {
    // Already handled by irregular patterns above
    return base;
  }
  
  return base;
}

/**
 * Checks if a word is likely a specific Part of Speech
 */
function matchesPartOfSpeech(word: string, pos: PartOfSpeech | undefined): boolean {
  if (!pos) return true; // No POS filter, accept all
  
  const lower = word.toLowerCase();
  
  switch (pos) {
    case 'verb':
      // REJECT: Obvious gerunds (-ing forms)
      if (lower.endsWith('ing')) {
        return false;
      }
      
      // REJECT: Common noun suffixes
      if (lower.endsWith('tion') || lower.endsWith('ment') || lower.endsWith('ness') || 
          lower.endsWith('ity') || lower.endsWith('ance') || lower.endsWith('ence')) {
        return false;
      }
      
      // REJECT: Obvious nouns (manual list of common nouns that appear as alternatives)
      const commonNouns = ['food', 'meal', 'dish', 'intake', 'consumption', 'beverage', 'drink'];
      if (commonNouns.includes(lower)) {
        return false;
      }
      
      // ACCEPT: Phrasal verbs (e.g., "go out", "put on")
      const words = lower.split(' ');
      if (words.length === 2 || words.length === 3) {
        const particles = ['up', 'down', 'in', 'out', 'on', 'off', 'away', 'back', 'over', 'through'];
        if (particles.includes(words[words.length - 1])) {
          return true; // Likely phrasal verb
        }
      }
      
      // ACCEPT: Single words that don't look like nouns/adjectives
      if (words.length === 1) {
        return true;
      }
      
      // ACCEPT: "to" + verb constructions
      if (lower.startsWith('to ')) {
        return true;
      }
      
      return true;
      
    case 'noun':
      // REJECT: Obvious verbs (infinitives with "to")
      if (lower.startsWith('to ')) {
        return false;
      }
      
      // REJECT: Obvious verb forms
      if (lower.endsWith('ing') || lower.endsWith('ed')) {
        return false;
      }
      
      // ACCEPT: Most other forms
      return true;
      
    case 'adjective':
      // REJECT: Gerunds/verbs
      if (lower.endsWith('ing') || lower.startsWith('to ')) {
        return false;
      }
      
      // REJECT: Obvious noun suffixes
      if (lower.endsWith('tion') || lower.endsWith('ment') || lower.endsWith('ness')) {
        return false;
      }
      
      return true;
      
    case 'adverb':
      // ACCEPT: -ly endings (most adverbs)
      if (lower.endsWith('ly')) {
        return true;
      }
      
      // REJECT: Obvious verbs/nouns/adjectives
      if (lower.endsWith('ing') || lower.startsWith('to ') || lower.endsWith('tion')) {
        return false;
      }
      
      return true;
      
    default:
      // For other POS types, accept all
      return true;
  }
}

/**
 * Strips leading "to" from verb infinitives
 * Examples: "to process" -> "process", "to eat" -> "eat"
 */
function stripLeadingTo(phrase: string): string {
  const trimmed = phrase.trim();
  if (trimmed.startsWith('to ')) {
    return trimmed.substring(3);
  }
  return trimmed;
}

/**
 * Strips trailing prepositions from verb phrases
 * Examples: "kidnap to" -> "kidnap", "look at" -> "look"
 */
function stripTrailingPrepositions(phrase: string): string {
  const prepositions = ['to', 'at', 'in', 'on', 'for', 'with', 'from', 'by', 'of', 'about'];
  const words = phrase.trim().split(' ');
  
  // If last word is a preposition, remove it
  if (words.length > 1 && prepositions.includes(words[words.length - 1])) {
    return words.slice(0, -1).join(' ');
  }
  
  return phrase;
}

/**
 * Checks if a phrase contains pronouns or is just a pronoun
 * Examples: "you", "you return", "I go", etc.
 */
function containsPronoun(phrase: string): boolean {
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  const words = phrase.toLowerCase().trim().split(' ');
  
  // Reject if ANY word is a pronoun
  return words.some(word => pronouns.includes(word));
}

/**
 * Filters and normalizes alternative translations to match the Part of Speech
 */
function filterAndNormalizeAlternatives(
  alternatives: string[],
  partOfSpeech: PartOfSpeech | undefined,
  primaryTranslation: string
): string[] {
  const normalized = alternatives.map(alt => {
    let result = alt.trim();
    
    // For verbs: Strip "to" prefix AND trailing prepositions
    if (partOfSpeech === 'verb') {
      result = stripLeadingTo(result);
      result = stripTrailingPrepositions(result);
      
      // ONLY convert gerunds (words ending in 'ing') to infinitive
      if (result.endsWith('ing')) {
        result = gerundToInfinitive(result);
      }
    }
    
    return result;
  });
  
  // Remove duplicates after normalization
  const unique = Array.from(new Set(normalized));
  
  // Filter by quality and POS
  const filtered = unique.filter(alt => {
    // Reject if contains pronouns
    if (containsPronoun(alt)) {
      return false;
    }
    
    // Reject duplicates of primary translation
    if (alt.toLowerCase() === primaryTranslation.toLowerCase()) {
      return false;
    }
    
    // Minimum length: reject very short words (< 3 chars) that are likely fragments
    if (alt.length < 3) {
      return false;
    }
    
    // POS filter
    return matchesPartOfSpeech(alt, partOfSpeech);
  });
  
  return filtered;
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
 * Extract a simple translation from a Wiktionary definition
 * Example: "a dog; a canine" -> "dog"
 */
function extractTranslationFromDefinition(definition: string): string | null {
  if (!definition) return null;
  
  // Remove leading articles and get first phrase before semicolon or comma
  let cleaned = definition.trim().toLowerCase();
  cleaned = cleaned.replace(/^(a|an|the)\s+/, '');
  
  // Get first part before punctuation
  const firstPart = cleaned.split(/[;,]/)[0].trim();
  
  // Only return if it's a simple word or short phrase (< 3 words)
  const words = firstPart.split(' ');
  if (words.length <= 3 && firstPart.length > 2) {
    return firstPart;
  }
  
  return null;
}

/**
 * Transform database word to verified data structure
 * Only includes fields defined in VerifiedVocabularyData type
 */
function transformToVerifiedData(word: any): VerifiedVocabularyData {
  return {
    // Multi-language identifiers
    sourceLanguage: word.sourceLanguage,
    targetLanguage: word.targetLanguage,
    languagePair: word.languagePair,
    
    // Core translation data
    sourceWord: word.sourceWord,
    targetWord: word.targetWord,
    alternativeTranslations: word.alternativeTranslations || [],
    
    // Universal metadata
    partOfSpeech: word.partOfSpeech,
    grammarMetadata: word.grammarMetadata,
    
    // Rich content
    examples: word.examples || [],
    conjugations: word.conjugations,
    synonyms: word.synonyms,
    antonyms: word.antonyms,
    relatedWords: word.relatedWords,
    regionalVariants: word.regionalVariants,
    
    // Verification metadata
    verificationCount: word.verificationCount,
    confidenceScore: word.confidenceScore,
    lastVerified: word.lastVerified,
    
    // Quality indicators
    hasDisagreement: word.hasDisagreement,
    requiresReview: word.requiresReview,
    
    // Usage statistics
    lookupCount: word.lookupCount,
    saveCount: word.saveCount,
    editFrequency: word.editFrequency,
    
    // Backward compatibility
    gender: word.grammarMetadata?.gender,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { word, languagePair = 'es-en' } = await request.json();

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const cleanWord = word.trim().toLowerCase();

    // ═══════════════════════════════════════════════════════════════════
    // TIER 1: CHECK VERIFIED VOCABULARY CACHE (Phase 16)
    // 🚀 Performance: ~50ms (vs ~2000ms for API calls)
    // ═══════════════════════════════════════════════════════════════════
    const startTime = Date.now();
    let cachedWord: VerifiedVocabularyData | null = null;
    
    try {
      // Lookup word in verified cache
      const dbWord = await prisma.verifiedVocabulary.findUnique({
        where: { 
          unique_word_lang_pair: {
            sourceWord: cleanWord,
            languagePair: languagePair as LanguagePair,
          }
        },
        include: {
          verifications: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      
      // Check if word meets cache criteria
      if (dbWord && meetsCacheCriteria(dbWord, CACHE_STRATEGY)) {
        cachedWord = transformToVerifiedData(dbWord);
        
        // Increment lookup counter (async, don't block)
        prisma.verifiedVocabulary.update({
          where: { id: dbWord.id },
          data: { lookupCount: { increment: 1 } },
        }).catch(err => console.error('Failed to increment lookup count:', err));
      }
    } catch (error) {
      console.error('[Verified Cache] Lookup error:', error);
      // Continue to API fallback
    }
    
    if (cachedWord) {
      const cacheTime = Date.now() - startTime;
      console.log(`✅ [Lookup] CACHE HIT for "${cleanWord}" (${cacheTime}ms, confidence: ${cachedWord.confidenceScore.toFixed(2)})`);
      
      // Phase 18.1.3: Get AI examples for user's proficiency level
      let levelExamples: any[] = cachedWord.examples || [];
      try {
        const session = await getSession();
        const user = session?.userId ? await prisma.user.findUnique({
          where: { id: session.userId },
          select: { languageLevel: true },
        }) : null;
        
        const userLevel = (user?.languageLevel as CEFRLevel) || 'B1';
        const aiResult = await generateExamples({
          word: cleanWord,
          translation: cachedWord.targetWord,
          partOfSpeech: cachedWord.partOfSpeech || undefined,
          level: userLevel,
          count: 3,
        });
        
        if (aiResult.examples.length > 0) {
          levelExamples = aiResult.examples;
        }
      } catch (error) {
        console.debug('[AI Examples] Skipping for cached word:', error);
        // Use dictionary examples as fallback
      }
      
      // Track analytics (async, non-blocking)
      const [sourceLang, targetLang] = (languagePair as string).split('-');
      trackWordLookup(prisma, {
        sourceWord: cleanWord,
        sourceLanguage: sourceLang || 'es',
        targetLanguage: targetLang || 'en',
        languagePair: languagePair as string,
        fromCache: true,
        responseTime: cacheTime,
        translationFound: true,
        examplesFound: levelExamples.length,
        confidenceScore: cachedWord.confidenceScore,
        apiSource: undefined,
        apiCallsCount: 0,
        deviceType: detectDeviceType(request.headers.get('user-agent') || undefined),
      }).catch(err => console.error('[Analytics] Failed to track cache hit:', err));
      
      // Return cached data (instant, high-quality, verified by multiple users)
      return NextResponse.json({
        word: cleanWord,
        translation: cachedWord.targetWord,
        alternativeTranslations: cachedWord.alternativeTranslations,
        translationConfidence: cachedWord.confidenceScore,
        translationSource: 'verified-cache',
        gender: cachedWord.grammarMetadata?.gender || cachedWord.gender,
        partOfSpeech: cachedWord.partOfSpeech,
        examples: levelExamples,
        definition: undefined,
        synonyms: cachedWord.synonyms,
        relationships: {
          synonyms: cachedWord.synonyms,
          antonyms: cachedWord.antonyms,
          related: cachedWord.relatedWords,
        },
        conjugation: cachedWord.conjugations,
        images: undefined, // Images not cached
        
        // 🍎 Cache metadata (for UI indicators)
        fromCache: true,
        cacheMetadata: {
          verificationCount: cachedWord.verificationCount,
          confidenceScore: cachedWord.confidenceScore,
          lastVerified: cachedWord.lastVerified,
        },
        
        errors: {
          translation: false,
          dictionary: false,
        },
      });
    }
    
    console.log(`⏳ [Lookup] Cache MISS for "${cleanWord}", fetching from APIs...`);

    // ═══════════════════════════════════════════════════════════════════
    // TIER 2: FETCH FROM EXTERNAL APIS (existing logic)
    // Phase 16.1 Task 3: Added RAE as authoritative source
    // ═══════════════════════════════════════════════════════════════════
    // Fetch translation, dictionary, and RAE data in parallel
    const [translationResult, dictionaryResult, raeResult] = await Promise.allSettled([
      getEnhancedTranslation(cleanWord),
      getCompleteWordData(cleanWord),
      getRaeDefinition(cleanWord), // RAE: Authoritative Spanish dictionary
    ]);

    // Process enhanced translation result
    const translation =
      translationResult.status === 'fulfilled'
        ? translationResult.value
        : null;

    // Process dictionary result
    const dictionary =
      dictionaryResult.status === 'fulfilled'
        ? dictionaryResult.value
        : null;

    // Process RAE result (Phase 16.1 Task 3)
    const rae: RaeDefinition | null =
      raeResult.status === 'fulfilled'
        ? raeResult.value
        : null;
    
    if (rae) {
      console.log(`✅ [RAE] Found authoritative definition for "${cleanWord}" (${rae.category})`);
    } else {
      console.log(`ℹ️ [RAE] No definition found for "${cleanWord}" (may not be in RAE dictionary)`);
    }

    // Fetch enhanced features in parallel (non-blocking) with shorter timeouts for speed
    const timeoutPromise = (promise: Promise<any>, timeoutMs: number) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
      ]);
    };
    
    const [relationshipsResult, conjugationResult, imagesResult] = await Promise.allSettled([
      timeoutPromise(getWordRelationships(cleanWord, dictionary?.partOfSpeech), 3000), // Reduced from 5s to 3s
      dictionary?.partOfSpeech === 'verb' ? timeoutPromise(getVerbConjugation(cleanWord), 3000) : Promise.resolve(null), // Reduced from 5s to 3s
      timeoutPromise(getWordImages(cleanWord, translation?.primary, 3), 2000), // Reduced from 5s to 2s (images less critical)
    ]);

    const relationships = relationshipsResult.status === 'fulfilled' ? relationshipsResult.value : undefined;
    const conjugation = conjugationResult.status === 'fulfilled' ? conjugationResult.value : undefined;
    const images = imagesResult.status === 'fulfilled' ? imagesResult.value : undefined;

    // Filter and normalize alternative translations to match Part of Speech
    const rawAlternatives = translation?.alternatives || [];
    const filteredAlternatives = filterAndNormalizeAlternatives(
      rawAlternatives,
      dictionary?.partOfSpeech,
      translation?.primary || ''
    );

    // ═══════════════════════════════════════════════════════════════════
    // CROSS-VALIDATION: Compare translations from multiple sources
    // Phase 16.1 Task 2 - Flag discrepancies for user review
    // Phase 16.1 Task 3 - Include RAE as authoritative source
    // ═══════════════════════════════════════════════════════════════════
    const translationSources: TranslationSource[] = [];
    
    // Add RAE source FIRST (authoritative - Phase 16.1 Task 3)
    if (rae?.definitions && rae.definitions.length > 0) {
      // RAE provides Spanish definitions, not English translations
      // We use it to validate POS, gender, and as authoritative tiebreaker
      // Note: RAE definitions are in Spanish, so we don't add to translation cross-validation
      // Instead, we use it to validate the translation API results
    }
    
    // Add translation API source (DeepL or MyMemory)
    if (translation?.primary) {
      translationSources.push({
        source: translation.source === 'deepl' ? 'deepl' : 'mymemory',
        translation: translation.primary,
        confidence: translation.confidence,
        alternatives: rawAlternatives,
      });
    }
    
    // Add dictionary/Wiktionary source (if different from translation)
    if (dictionary?.definition && dictionary.definition !== translation?.primary) {
      // Wiktionary sometimes provides a definition that includes translation
      const wiktionaryTranslation = extractTranslationFromDefinition(dictionary.definition);
      if (wiktionaryTranslation) {
        translationSources.push({
          source: 'wiktionary',
          translation: wiktionaryTranslation,
          confidence: 0.70, // Moderate confidence for extracted translations
        });
      }
    }
    
    // Run cross-validation if we have multiple sources
    let crossValidation = null;
    let adjustedConfidence = translation?.confidence;
    
    if (translationSources.length >= 2) {
      crossValidation = crossValidateTranslations(translationSources);
      
      // Adjust confidence based on agreement level
      if (adjustedConfidence) {
        const penalty = getConfidencePenalty(crossValidation.agreementLevel);
        adjustedConfidence = adjustedConfidence * penalty;
      }
      
      console.log(`🔍 [Cross-Validation] "${cleanWord}": ${crossValidation.hasDisagreement ? 'DISAGREEMENT' : 'AGREEMENT'} (${Math.round(crossValidation.agreementLevel * 100)}% agreement)`);
      
      if (crossValidation.hasDisagreement) {
        console.log(`   └─ ${getCrossValidationExplanation(crossValidation)}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // MERGE DATA: Prioritize RAE for authoritative metadata
    // Phase 16.1 Task 3 - Use RAE for gender, POS, synonyms when available
    // ═══════════════════════════════════════════════════════════════════
    
    // Prioritize RAE for POS and gender (authoritative)
    const finalPartOfSpeech = rae?.category 
      ? mapRaeCategoryToPartOfSpeech(rae.category) || dictionary?.partOfSpeech
      : dictionary?.partOfSpeech;
    
    const finalGender = rae?.gender || dictionary?.gender;
    
    // Merge synonyms from all sources
    const mergedSynonyms = [
      ...(dictionary?.synonyms || []),
      ...(rae?.synonyms || []),
    ];
    const uniqueSynonyms = mergedSynonyms.length > 0 ? [...new Set(mergedSynonyms)] : undefined;
    
    // Merge antonyms
    const mergedAntonyms = [
      ...(relationships?.antonyms || []),
      ...(rae?.antonyms || []),
    ];
    const uniqueAntonyms = mergedAntonyms.length > 0 ? [...new Set(mergedAntonyms)] : undefined;

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 18.1.3: AI-GENERATED CONTEXTUAL EXAMPLES
    // Fast cache check, fallback to dictionary, async generation for next time
    // ═══════════════════════════════════════════════════════════════════
    let aiExamples: any[] = [];
    try {
      // Get user's proficiency level (from session or default to B1)
      const session = await getSession();
      const user = session?.userId ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { languageLevel: true },
      }) : null;
      
      const userLevel = (user?.languageLevel as CEFRLevel) || 'B1';
      
      // ⚡ PERFORMANCE OPTIMIZATION: Check cache first (instant)
      const cached = await prisma.verifiedVocabulary.findFirst({
        where: {
          sourceWord: cleanWord,
          aiExamplesGenerated: true,
        },
        select: { aiExamplesByLevel: true },
      });

      if (cached?.aiExamplesByLevel) {
        // Extract examples for user's level from cached data
        const cachedByLevel = cached.aiExamplesByLevel as any;
        if (cachedByLevel[userLevel]) {
          aiExamples = cachedByLevel[userLevel];
          console.log(`[AI Examples] ⚡ Cache HIT for "${cleanWord}" (${userLevel}) - Instant response`);
        }
      }

      // If not cached, start generation in background (don't block response)
      if (aiExamples.length === 0) {
        console.log(`[AI Examples] Cache MISS for "${cleanWord}" (${userLevel}) - Will generate async`);
        
        // Fire-and-forget: Generate in background for next request
        // Client will poll /api/vocabulary/examples endpoint for result
        generateExamples({
          word: cleanWord,
          translation: translation?.primary || '',
          partOfSpeech: finalPartOfSpeech || undefined,
          level: userLevel,
          count: 1,
        }).then((result) => {
          console.log(
            `[AI Examples] ✨ Background generation complete for "${cleanWord}" (${userLevel})` +
            ` - ${result.examples.length} examples cached` +
            (result.cost ? ` - Cost: $${result.cost.toFixed(4)}` : '')
          );
        }).catch((error) => {
          console.error(`[AI Examples] Background generation failed for "${cleanWord}":`, error);
        });
      }
    } catch (error) {
      console.error(`[AI Examples] Failed for "${cleanWord}":`, error);
      // Continue without AI examples - dictionary examples will be used
    }

    // Combine results with enhanced translations
    const response = {
      word: cleanWord,
      translation: translation?.primary || '',
      alternativeTranslations: filteredAlternatives,
      translationConfidence: adjustedConfidence, // Adjusted based on cross-validation
      translationSource: translation?.source || 'fallback',
      gender: finalGender,
      partOfSpeech: finalPartOfSpeech,
      examples: aiExamples.length > 0 ? aiExamples : (dictionary?.examples || []),
      definition: dictionary?.definition, // Wiktionary definition provides additional context/meanings
      synonyms: uniqueSynonyms,
      // Enhanced Phase 7 features
      relationships: relationships ? {
        ...relationships,
        synonyms: uniqueSynonyms || relationships.synonyms,
        antonyms: uniqueAntonyms || relationships.antonyms,
      } : undefined,
      conjugation: conjugation || undefined,
      images,
      
      // 🍎 Cache metadata (false for API lookups)
      fromCache: false,
      cacheMetadata: undefined,
      
      // 🔍 Cross-validation metadata (Phase 16.1 Task 2)
      crossValidation: crossValidation ? {
        hasDisagreement: crossValidation.hasDisagreement,
        agreementLevel: crossValidation.agreementLevel,
        recommendation: crossValidation.recommendation,
        explanation: getCrossValidationExplanation(crossValidation),
        sources: crossValidation.sources.map(s => ({
          source: s.source,
          translation: s.translation,
        })),
        disagreements: crossValidation.disagreements,
      } : undefined,
      
      // 📚 RAE metadata (Phase 16.1 Task 3)
      raeData: rae ? {
        hasRaeDefinition: true,
        category: rae.category,
        gender: rae.gender,
        usage: rae.usage,
        etymology: rae.etymology,
        definitionsCount: rae.definitions.length,
        definitions: rae.definitions.slice(0, 3), // First 3 definitions
        synonyms: rae.synonyms,
        antonyms: rae.antonyms,
      } : undefined,
      
      errors: {
        translation: translationResult.status === 'rejected',
        dictionary: dictionaryResult.status === 'rejected',
        rae: raeResult.status === 'rejected',
      },
    };

    // Debug logging
    console.log('[Lookup API] Enhanced translation result:', {
      primary: translation?.primary,
      rawAlternatives: rawAlternatives,
      filteredAlternatives: filteredAlternatives,
      partOfSpeech: dictionary?.partOfSpeech,
      alternativesCount: filteredAlternatives.length
    });

    // Track analytics (async, non-blocking)
    const apiTime = Date.now() - startTime;
    const [sourceLang, targetLang] = (languagePair as string).split('-');
    const apiCallsCount = (translationResult.status === 'fulfilled' ? 1 : 0) +
                          (dictionaryResult.status === 'fulfilled' ? 1 : 0);
    
    trackWordLookup(prisma, {
      sourceWord: cleanWord,
      sourceLanguage: sourceLang || 'es',
      targetLanguage: targetLang || 'en',
      languagePair: languagePair as string,
      fromCache: false,
      responseTime: apiTime,
      translationFound: !!translation?.primary,
      examplesFound: dictionary?.examples?.length || 0,
      confidenceScore: adjustedConfidence,
      apiSource: translation?.source,
      apiCallsCount,
      // Cross-validation metadata (Phase 16.1 Task 2)
      hasDisagreement: crossValidation?.hasDisagreement,
      agreementLevel: crossValidation?.agreementLevel,
      disagreementSources: crossValidation ? JSON.stringify(crossValidation.sources) : undefined,
      deviceType: detectDeviceType(request.headers.get('user-agent') || undefined),
    }).catch(err => console.error('[Analytics] Failed to track API lookup:', err));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vocabulary lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vocabulary' },
      { status: 500 }
    );
  }
}

