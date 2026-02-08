/**
 * Interleaving Analytics API Route
 * Tracks interleaving session metrics (Phase 18.1.5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/backend/auth';
import { trackInterleavingSession } from '@/lib/services/retention-analytics';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sessionId,
      interleavingEnabled,
      switchRate,
      maxConsecutive,
      avgConsecutive,
      totalWords,
      accuracy,
      completionRate,
    } = body;

    // Track interleaving session
    await trackInterleavingSession({
      sessionId,
      userId: session.user.id,
      interleavingEnabled,
      switchRate,
      maxConsecutive,
      avgConsecutive,
      totalWords,
      accuracy,
      completionRate,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track interleaving session:', error);
    // Non-critical, return success anyway
    return NextResponse.json({ success: true });
  }
}
