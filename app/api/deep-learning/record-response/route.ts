/**
 * API Route: Record Deep Learning Response
 * POST /api/deep-learning/record-response
 * 
 * Saves user's elaborative interrogation response to database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { recordElaborativeResponse } from '@/lib/services/deep-learning';
import type { ElaborativePrompt } from '@/lib/utils/deep-learning-client';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = await verifyAuth(request);
    if (!token || !token.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      wordId,
      promptType,
      question,
      userResponse,
      skipped,
      responseTime,
    } = body;

    // Validate required fields
    if (!wordId || !promptType || !question || typeof skipped !== 'boolean' || typeof responseTime !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct prompt object
    const prompt: ElaborativePrompt = {
      type: promptType,
      question,
      wordId,
      wordSpanish: '', // Not needed for recording
      wordEnglish: '', // Not needed for recording
    };

    // Record response to database
    await recordElaborativeResponse({
      userId: token.userId,
      wordId,
      prompt,
      userResponse: userResponse || null,
      skipped,
      responseTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to record deep learning response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
