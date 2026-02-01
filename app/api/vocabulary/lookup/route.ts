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

export async function POST(request: NextRequest) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const cleanWord = word.trim().toLowerCase();

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

    // Fetch enhanced features in parallel (non-blocking) with 5-second timeout
    const timeoutPromise = (promise: Promise<any>, timeoutMs: number) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
      ]);
    };
    
    const [relationshipsResult, conjugationResult, imagesResult] = await Promise.allSettled([
      timeoutPromise(getWordRelationships(cleanWord, dictionary?.partOfSpeech), 5000),
      dictionary?.partOfSpeech === 'verb' ? timeoutPromise(getVerbConjugation(cleanWord), 5000) : Promise.resolve(null),
      timeoutPromise(getWordImages(cleanWord, translation?.primary, 3), 5000),
    ]);

    const relationships = relationshipsResult.status === 'fulfilled' ? relationshipsResult.value : undefined;
    const conjugation = conjugationResult.status === 'fulfilled' ? conjugationResult.value : undefined;
    const images = imagesResult.status === 'fulfilled' ? imagesResult.value : undefined;

    // Combine results with enhanced translations
    const response = {
      word: cleanWord,
      translation: translation?.primary || '',
      alternativeTranslations: translation?.alternatives || [],
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
      errors: {
        translation: translationResult.status === 'rejected',
        dictionary: dictionaryResult.status === 'rejected',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vocabulary lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup vocabulary' },
      { status: 500 }
    );
  }
}

