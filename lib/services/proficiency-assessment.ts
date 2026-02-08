/**
 * Proficiency Assessment Service (Phase 18.1.1)
 * Assesses user proficiency based on performance data
 * Suggests level adjustments after 20+ reviews
 * 
 * SERVER-ONLY - Contains Prisma logic
 */

import { prisma } from '@/lib/backend/db';
import { CEFR_LEVELS, type CEFRLevel } from '@/lib/types/proficiency';

// Re-export for API routes
export { CEFR_LEVELS, type CEFRLevel } from '@/lib/types/proficiency';

export interface PerformanceData {
  reviewCount: number;
  avgAccuracy: number;
  avgResponseTime: number;
  masteredWords: number;
  strugglingWords: number;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface ProficiencyAssessment {
  suggestedLevel: CEFRLevel;
  confidence: number; // 0-1
  reason: string;
  currentLevel: CEFRLevel;
  shouldNotify: boolean; // Whether to show notification to user
}

/**
 * Get user's performance metrics
 */
async function getUserPerformance(userId: string): Promise<PerformanceData> {
  // Get all reviews
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { reviewDate: 'desc' },
    take: 100, // Last 100 reviews for analysis
  });

  if (reviews.length === 0) {
    return {
      reviewCount: 0,
      avgAccuracy: 0,
      avgResponseTime: 0,
      masteredWords: 0,
      strugglingWords: 0,
      recentTrend: 'stable',
    };
  }

  // Calculate accuracy
  const correctCount = reviews.filter(r => r.correct).length;
  const avgAccuracy = correctCount / reviews.length;

  // Calculate average response time
  const avgResponseTime = reviews.reduce((sum, r) => sum + r.timeSpent, 0) / reviews.length;

  // Get mastered words (words user hasn't reviewed in 30+ days and was correct last time)
  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where: {
      userId,
      status: 'mastered',
    },
  });
  const masteredWords = vocabularyItems.length;

  // Get struggling words (words with low ease factor or recent failures)
  const strugglingWords = await prisma.vocabularyItem.count({
    where: {
      userId,
      OR: [
        { easeFactor: { lt: 2.0 } }, // Low ease factor
        { status: 'learning' },
        {
          reviews: {
            some: {
              correct: false,
              reviewDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
        },
      ],
    },
  });

  // Determine trend by comparing recent vs older performance
  const recentReviews = reviews.slice(0, 20);
  const olderReviews = reviews.slice(20, 40);
  
  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentReviews.length >= 10 && olderReviews.length >= 10) {
    const recentAccuracy = recentReviews.filter(r => r.correct).length / recentReviews.length;
    const olderAccuracy = olderReviews.filter(r => r.correct).length / olderReviews.length;
    const diff = recentAccuracy - olderAccuracy;
    
    if (diff > 0.1) recentTrend = 'improving';
    else if (diff < -0.1) recentTrend = 'declining';
  }

  return {
    reviewCount: reviews.length,
    avgAccuracy,
    avgResponseTime,
    masteredWords,
    strugglingWords,
    recentTrend,
  };
}

/**
 * Assess user proficiency and suggest level adjustment
 */
export async function assessUserProficiency(
  userId: string
): Promise<ProficiencyAssessment> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      languageLevel: true,
      levelAssessedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const currentLevel = (user.languageLevel || 'B1') as CEFRLevel;
  const performance = await getUserPerformance(userId);

  // Not enough data yet
  if (performance.reviewCount < 20) {
    return {
      suggestedLevel: currentLevel,
      confidence: 0.3,
      reason: 'Keep practicing! We need at least 20 reviews to assess your level accurately.',
      currentLevel,
      shouldNotify: false,
    };
  }

  // Don't assess too frequently (wait at least 14 days)
  if (user.levelAssessedAt) {
    const daysSinceAssessment = Math.floor(
      (Date.now() - user.levelAssessedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceAssessment < 14) {
      return {
        suggestedLevel: currentLevel,
        confidence: 0.5,
        reason: 'Your level was recently assessed. Keep practicing!',
        currentLevel,
        shouldNotify: false,
      };
    }
  }

  const levelIndex = CEFR_LEVELS.indexOf(currentLevel);

  // Excellent performance - suggest level up
  if (
    performance.avgAccuracy > 0.85 &&
    performance.avgResponseTime < 3000 &&
    performance.masteredWords > 20 &&
    performance.recentTrend !== 'declining'
  ) {
    // Don't suggest beyond C2
    if (levelIndex >= CEFR_LEVELS.length - 1) {
      return {
        suggestedLevel: currentLevel,
        confidence: 0.9,
        reason: `You're at the highest level (${currentLevel})! Keep practicing to maintain mastery.`,
        currentLevel,
        shouldNotify: false,
      };
    }

    const nextLevel = CEFR_LEVELS[levelIndex + 1];
    return {
      suggestedLevel: nextLevel,
      confidence: 0.8,
      reason: `Great job! Your ${(performance.avgAccuracy * 100).toFixed(0)}% accuracy and ${performance.masteredWords} mastered words suggest you're ready for ${nextLevel} content.`,
      currentLevel,
      shouldNotify: true,
    };
  }

  // Struggling significantly - suggest level down
  if (
    performance.avgAccuracy < 0.60 &&
    performance.strugglingWords > 10 &&
    performance.recentTrend !== 'improving'
  ) {
    // Don't suggest below A1
    if (levelIndex <= 0) {
      return {
        suggestedLevel: currentLevel,
        confidence: 0.7,
        reason: `Take your time with ${currentLevel} content. Focus on words you find challenging.`,
        currentLevel,
        shouldNotify: false,
      };
    }

    const prevLevel = CEFR_LEVELS[levelIndex - 1];
    return {
      suggestedLevel: prevLevel,
      confidence: 0.75,
      reason: `Your ${(performance.avgAccuracy * 100).toFixed(0)}% accuracy suggests ${prevLevel} content might be a better fit right now. You can always level up later!`,
      currentLevel,
      shouldNotify: true,
    };
  }

  // Current level is appropriate
  return {
    suggestedLevel: currentLevel,
    confidence: 0.9,
    reason: `Your ${(performance.avgAccuracy * 100).toFixed(0)}% accuracy shows ${currentLevel} is perfect for you right now.`,
    currentLevel,
    shouldNotify: false,
  };
}

/**
 * Update user's proficiency level
 */
export async function updateUserLevel(
  userId: string,
  newLevel: CEFRLevel,
  confidence?: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      languageLevel: newLevel,
      assessedLevel: newLevel,
      levelAssessedAt: new Date(),
      levelConfidence: confidence || 1.0,
    },
  });
}

// Note: getLevelDescription is now in @/lib/types/proficiency
export { getLevelDescription } from '@/lib/types/proficiency';

/**
 * Get recommended vocabulary level based on CEFR
 */
export function getRecommendedVocabLevel(cefrLevel: CEFRLevel): string {
  const mapping: Record<CEFRLevel, string> = {
    A1: 'beginner',
    A2: 'beginner',
    B1: 'intermediate',
    B2: 'intermediate',
    C1: 'advanced',
    C2: 'advanced',
  };
  return mapping[cefrLevel];
}
