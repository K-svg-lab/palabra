/**
 * Admin Stats API (Phase 18.2.4)
 * 
 * Aggregates all analytics data for admin dashboard.
 * Includes retention metrics, cost breakdown, feature usage, and user engagement.
 * 
 * @module app/api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { 
  getRetentionTrends,
  getMethodPerformance,
  getAtRiskUsers,
} from '@/lib/services/retention-analytics';
import { 
  getCurrentMonthCostReport,
  getCostBreakdown,
} from '@/lib/services/ai-cost-control';
import { prisma } from '@/lib/backend/db';

// ============================================================================
// GET HANDLER - Admin Stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permission
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });

    if (!user || user.email !== adminEmail) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);

    // ========================================================================
    // AGGREGATE ALL STATS
    // ========================================================================

    // 1. Overall metrics
    const totalUsers = await prisma.user.count();
    const totalWords = await prisma.vocabularyItem.count();
    const totalReviews = await prisma.reviewAttempt.count();
    const totalSessions = await prisma.reviewSession.count();

    // 2. Retention metrics
    const retentionTrends = await getRetentionTrends(daysBack);

    // 3. Cost metrics
    const costReport = await getCurrentMonthCostReport();
    const costBreakdown = await getCostBreakdown(daysBack);

    // 4. Method performance
    const methodPerformance = await getMethodPerformance(undefined, daysBack);

    // 5. User engagement
    const atRiskUsers = await getAtRiskUsers();

    // 6. Feature adoption (from UserCohort.featureAdoption JSON)
    const featureAdoption = await getFeatureAdoptionStats();

    // 7. Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: yesterday } },
    });

    const recentReviews = await prisma.reviewAttempt.count({
      where: { reviewedAt: { gte: yesterday } },
    });

    const recentWords = await prisma.vocabularyItem.count({
      where: { createdAt: { gte: yesterday } },
    });

    // 8. A/B test summary
    const abTestSummary = await getABTestSummary();

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    return NextResponse.json({
      overall: {
        totalUsers,
        totalWords,
        totalReviews,
        totalSessions,
        avgWordsPerUser: totalUsers > 0 ? totalWords / totalUsers : 0,
        avgReviewsPerUser: totalUsers > 0 ? totalReviews / totalUsers : 0,
      },
      recent: {
        signups: recentSignups,
        reviews: recentReviews,
        wordsAdded: recentWords,
      },
      retention: {
        trends: retentionTrends,
        atRiskUsers: atRiskUsers.length,
      },
      costs: {
        current: costReport,
        breakdown: costBreakdown,
      },
      methods: methodPerformance,
      featureAdoption,
      abTests: abTestSummary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get feature adoption statistics
 * Aggregates featureAdoption JSON from UserCohort table
 */
async function getFeatureAdoptionStats(): Promise<{
  feature: string;
  usersEnabled: number;
  totalUsers: number;
  adoptionRate: number;
}[]> {
  try {
    const cohorts = await prisma.userCohort.findMany({
      select: {
        featureAdoption: true,
      },
    });

    const totalUsers = cohorts.length;
    if (totalUsers === 0) return [];

    // Aggregate feature usage
    const featureMap = new Map<string, number>();

    for (const cohort of cohorts) {
      if (!cohort.featureAdoption || typeof cohort.featureAdoption !== 'object') {
        continue;
      }

      const adoption = cohort.featureAdoption as Record<string, any>;

      // Count each feature flag
      for (const [feature, value] of Object.entries(adoption)) {
        // Skip metrics (e.g., interleaving_enabled_sessions)
        if (feature.includes('_sessions') || feature.includes('_accuracy')) {
          continue;
        }

        if (value === 1 || value === true) {
          featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
        }
      }
    }

    // Build response
    const features = Array.from(featureMap.entries()).map(([feature, count]) => ({
      feature,
      usersEnabled: count,
      totalUsers,
      adoptionRate: count / totalUsers,
    }));

    return features.sort((a, b) => b.adoptionRate - a.adoptionRate);
  } catch (error) {
    console.error('Failed to get feature adoption stats:', error);
    return [];
  }
}

/**
 * Get A/B test summary
 * Returns count of active tests and completion status
 */
async function getABTestSummary(): Promise<{
  activeTests: number;
  completedTests: number;
  totalExperimentUsers: number;
}> {
  try {
    const cohorts = await prisma.userCohort.findMany({
      select: {
        experimentGroup: true,
      },
    });

    const totalExperimentUsers = cohorts.filter((c) => c.experimentGroup).length;

    // Note: Active/completed tests would come from config
    // For now, return basic counts
    return {
      activeTests: 0, // Would come from ab-tests.ts config
      completedTests: 0,
      totalExperimentUsers,
    };
  } catch (error) {
    console.error('Failed to get A/B test summary:', error);
    return {
      activeTests: 0,
      completedTests: 0,
      totalExperimentUsers: 0,
    };
  }
}
