/**
 * User Proficiency API Route (Phase 18.1.1)
 * Handles updating user proficiency level
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/backend/auth';
import { prisma } from '@/lib/backend/db';
import { CEFR_LEVELS, updateUserLevel, type CEFRLevel } from '@/lib/services/proficiency-assessment';

/**
 * PUT /api/user/proficiency
 * Update user's proficiency level
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { languageLevel, nativeLanguage, targetLanguage, dailyGoal } = body;

    // Validate proficiency level if provided
    if (languageLevel && !CEFR_LEVELS.includes(languageLevel as CEFRLevel)) {
      return NextResponse.json(
        { error: 'Invalid proficiency level. Must be one of: A1, A2, B1, B2, C1, C2' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (languageLevel) updateData.languageLevel = languageLevel;
    if (nativeLanguage) updateData.nativeLanguage = nativeLanguage;
    if (targetLanguage) updateData.targetLanguage = targetLanguage;
    if (dailyGoal !== undefined) updateData.dailyGoal = dailyGoal;

    // Update user's proficiency data
    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    // Return success
    return NextResponse.json({
      success: true,
      ...updateData,
    });
  } catch (error) {
    console.error('Failed to update proficiency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/proficiency
 * Get user's current proficiency level and assessment
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's proficiency data
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        languageLevel: true,
        assessedLevel: true,
        levelAssessedAt: true,
        levelConfidence: true,
        nativeLanguage: true,
        targetLanguage: true,
        dailyGoal: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get proficiency assessment if user has enough reviews
    const reviewCount = await prisma.review.count({
      where: { userId: session.userId },
    });

    let assessment = null;
    if (reviewCount >= 20) {
      try {
        const { assessUserProficiency } = await import('@/lib/services/proficiency-assessment');
        assessment = await assessUserProficiency(session.userId);
      } catch (error) {
        console.log('Proficiency assessment failed:', error);
      }
    }

    return NextResponse.json({
      ...user,
      reviewCount,
      assessment,
    });
  } catch (error) {
    console.error('Failed to get proficiency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
