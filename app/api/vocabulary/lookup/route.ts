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
import { lookupVerifiedWord } from '@/lib/services/verified-vocabulary';
import type { PartOfSpeech } from '@/lib/types/vocabulary';
import type { LanguagePair } from '@/lib/types/verified-vocabulary';

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
    const cachedWord = await lookupVerifiedWord(cleanWord, languagePair as LanguagePair);
    
    if (cachedWord) {
      const cacheTime = Date.now() - startTime;
      console.log(`✅ [Lookup] CACHE HIT for "${cleanWord}" (${cacheTime}ms, confidence: ${cachedWord.confidenceScore.toFixed(2)})`);
      
      // Return cached data (instant, high-quality, verified by multiple users)
      return NextResponse.json({
        word: cleanWord,
        translation: cachedWord.targetWord,
        alternativeTranslations: cachedWord.alternativeTranslations,
        translationConfidence: cachedWord.confidenceScore,
        translationSource: 'verified-cache',
        gender: cachedWord.grammarMetadata?.gender || cachedWord.gender,
        partOfSpeech: cachedWord.partOfSpeech,
        examples: cachedWord.examples,
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
    // ═══════════════════════════════════════════════════════════════════
    // Fetch enhanced translation (with alternatives) and dictionary data in parallel
    const [translationResult, dictionaryResult] = await Promise.allSettled([
      getEnhancedTranslation(cleanWord),
      getCompleteWordData(cleanWord),
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

    // Combine results with enhanced translations
    const response = {
      word: cleanWord,
      translation: translation?.primary || '',
      alternativeTranslations: filteredAlternatives,
      translationConfidence: translation?.confidence,
      translationSource: translation?.source || 'fallback',
      gender: dictionary?.gender,
      partOfSpeech: dictionary?.partOfSpeech,
      examples: dictionary?.examples || [],
      definition: dictionary?.definition, // Wiktionary definition provides additional context/meanings
      synonyms: dictionary?.synonyms,
      // Enhanced Phase 7 features
      relationships,
      conjugation: conjugation || undefined,
      images,
      
      // 🍎 Cache metadata (false for API lookups)
      fromCache: false,
      cacheMetadata: undefined,
      
      errors: {
        translation: translationResult.status === 'rejected',
        dictionary: dictionaryResult.status === 'rejected',
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vocabulary lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vocabulary' },
      { status: 500 }
    );
  }
}

