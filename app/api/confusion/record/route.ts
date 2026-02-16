/**
 * API endpoint to record confusion between two words
 * 
 * Phase 18.2.1: Interference Detection System
 * Called automatically when user confuses similar words during review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/backend/auth';
import { recordConfusion } from '@/lib/services/interference-detection';
import { prisma } from '@/lib/backend/db';
import { levenshteinDistance } from '@/lib/services/interference-detection';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { correctWordId, userAnswer, direction } = body;

    // Validate required fields
    if (!correctWordId || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: correctWordId, userAnswer' },
        { status: 400 }
      );
    }

    // Get the correct word
    const correctWord = await prisma.vocabularyItem.findUnique({
      where: { id: correctWordId },
      select: { 
        id: true, 
        spanish: true, 
        english: true,
        userId: true 
      }
    });

    if (!correctWord) {
      return NextResponse.json(
        { error: 'Vocabulary word not found' },
        { status: 404 }
      );
    }

    // Verify word belongs to user
    if (correctWord.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all user's vocabulary to find similar word
    const allWords = await prisma.vocabularyItem.findMany({
      where: { 
        userId: session.userId,
        isDeleted: false,
      },
      select: { 
        id: true, 
        spanish: true, 
        english: true 
      }
    });

    // Determine the correct answer based on direction
    const correctAnswer = direction === 'spanish-to-english' 
      ? correctWord.english 
      : correctWord.spanish;
    
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Find words similar to user's answer (check both Spanish and English)
    let confusedWordId: string | null = null;
    let bestSimilarity = 0;
    const SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold

    for (const word of allWords) {
      // Skip the correct word itself
      if (word.id === correctWordId) continue;

      // Check Spanish similarity
      const spanishDistance = levenshteinDistance(
        userAnswerLower,
        word.spanish.toLowerCase()
      );
      const spanishMaxLen = Math.max(userAnswerLower.length, word.spanish.length);
      const spanishSimilarity = 1 - spanishDistance / spanishMaxLen;

      // Check English similarity
      const englishDistance = levenshteinDistance(
        userAnswerLower,
        word.english.toLowerCase()
      );
      const englishMaxLen = Math.max(userAnswerLower.length, word.english.length);
      const englishSimilarity = 1 - englishDistance / englishMaxLen;

      // Use the highest similarity
      const maxSimilarity = Math.max(spanishSimilarity, englishSimilarity);

      if (maxSimilarity >= SIMILARITY_THRESHOLD && maxSimilarity > bestSimilarity) {
        bestSimilarity = maxSimilarity;
        confusedWordId = word.id;
      }
    }

    // If we found a similar word, record the confusion
    if (confusedWordId) {
      await recordConfusion(session.userId, correctWordId, confusedWordId);
      
      console.log('[Confusion Recording] ✅ Recorded:', {
        userId: session.userId,
        correctWord: correctAnswer,
        userAnswer,
        similarity: (bestSimilarity * 100).toFixed(1) + '%'
      });

      return NextResponse.json({ 
        success: true,
        confusionRecorded: true,
        similarity: bestSimilarity
      });
    }

    // No similar word found - this was just a random error
    console.log('[Confusion Recording] ℹ️ No similar word found for answer:', userAnswer);
    return NextResponse.json({ 
      success: true,
      confusionRecorded: false,
      reason: 'No similar word found'
    });

  } catch (error) {
    console.error('[Confusion Recording] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
