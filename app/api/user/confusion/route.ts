/**
 * API Endpoint: Get User Confusion Insight
 * 
 * Returns the top confusion pattern for display in dashboard insights
 * Phase 18.3.6: Returns null for free users (premium-gated)
 * 
 * @endpoint GET /api/user/confusion
 */

import { NextResponse } from 'next/server';
import { getTopConfusion } from '@/lib/services/interference-detection';
import { getSession } from '@/lib/backend/auth';

export async function GET() {
  try {
    // Get authenticated user
    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get top confusion pattern for user
    // Note: getTopConfusion already includes premium check (Phase 18.3.6)
    // - Premium users: returns top confusion if any
    // - Free users: returns null (feature gated)
    const topConfusion = await getTopConfusion(session.userId);

    if (!topConfusion) {
      // No confusion patterns found or user is free tier
      return NextResponse.json({ confusion: null });
    }

    // Return confusion insight data
    return NextResponse.json({
      confusion: {
        word1: topConfusion.word1,
        word2: topConfusion.word2,
        word1Id: topConfusion.word1Id,
        word2Id: topConfusion.word2Id,
        occurrences: topConfusion.occurrences,
        confusionScore: topConfusion.confusionScore,
        lastOccurrence: topConfusion.lastOccurrence,
      }
    });

  } catch (error) {
    console.error('Error fetching confusion insight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confusion insight' },
      { status: 500 }
    );
  }
}
