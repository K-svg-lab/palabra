/**
 * Phase 18.1.3: AI Examples Polling Endpoint
 * 
 * GET /api/vocabulary/examples?word=xxx&level=B1
 * 
 * Checks if AI examples are cached and ready for a word.
 * Used by progressive loading UI to fetch examples after initial lookup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { type CEFRLevel } from '@/lib/types/proficiency';
import { getSession } from '@/lib/backend/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    
    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter required' },
        { status: 400 }
      );
    }

    // Get user's proficiency level
    const session = await getSession();
    const user = session?.userId ? await prisma.user.findUnique({
      where: { id: session.userId },
      select: { languageLevel: true },
    }) : null;
    
    const userLevel = (user?.languageLevel as CEFRLevel) || 'B1';

    // Check if AI examples are cached
    const cached = await prisma.verifiedVocabulary.findFirst({
      where: {
        sourceWord: word.toLowerCase().trim(),
        aiExamplesGenerated: true,
      },
      select: { 
        aiExamplesByLevel: true,
        aiExamplesGeneratedAt: true,
      },
    });

    if (!cached?.aiExamplesByLevel) {
      return NextResponse.json({
        ready: false,
        message: 'Examples still generating...',
      });
    }

    // Extract examples for user's level
    const cachedByLevel = cached.aiExamplesByLevel as any;
    const examples = cachedByLevel[userLevel];

    if (!examples || examples.length === 0) {
      return NextResponse.json({
        ready: false,
        message: 'Examples still generating...',
      });
    }

    return NextResponse.json({
      ready: true,
      examples,
      generatedAt: cached.aiExamplesGeneratedAt,
      level: userLevel,
    });

  } catch (error) {
    console.error('[Examples API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    );
  }
}
