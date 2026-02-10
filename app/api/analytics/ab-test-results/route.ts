/**
 * A/B Test Results API (Phase 18.2.3)
 * 
 * Returns retention and performance metrics for A/B test groups.
 * Admin-only endpoint for monitoring experiment effectiveness.
 * 
 * @module api/analytics/ab-test-results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/backend/prisma/client';
import { ACTIVE_AB_TESTS, getTestById, type ABTest } from '@/lib/config/ab-tests';

// ============================================================================
// TYPES
// ============================================================================

interface GroupResults {
  groupId: string;
  groupName: string;
  userCount: number;
  day1Retention: number; // percentage
  day7Retention: number;
  day30Retention: number;
  day90Retention: number;
  avgAccuracy: number; // percentage
  avgWordsAdded: number;
  avgStudyTime: number; // minutes
  lift: number; // percentage vs control
}

interface ABTestResults {
  test: {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate?: Date;
  };
  groups: GroupResults[];
  pValue: number;
  significant: boolean;
  readyForAnalysis: boolean;
  daysRunning: number;
}

// ============================================================================
// API ENDPOINT
// ============================================================================

/**
 * GET /api/analytics/ab-test-results?testId=xxx
 * 
 * Returns A/B test results with statistical significance.
 * Admin-only endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // TODO: Add isAdmin field to User model
    // For now, check if email matches admin email from env
    const isAdmin = user?.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get test ID from query params
    const testId = request.nextUrl.searchParams.get('testId');

    if (!testId) {
      return NextResponse.json(
        { error: 'testId parameter required' },
        { status: 400 }
      );
    }

    // Get test configuration
    const test = getTestById(testId);

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Calculate results for each group
    const groupResults: GroupResults[] = [];

    for (const group of test.groups) {
      const results = await calculateGroupResults(test, group.id);
      groupResults.push(results);
    }

    // Calculate lift (treatment vs control)
    const controlGroup = groupResults.find(g => g.groupId === 'control');
    const treatmentGroups = groupResults.filter(g => g.groupId !== 'control');

    if (controlGroup) {
      for (const treatment of treatmentGroups) {
        treatment.lift = treatment.day30Retention - controlGroup.day30Retention;
      }
    }

    // Calculate statistical significance
    const pValue = calculatePValue(groupResults);
    const significant = pValue < 0.05;

    // Check if test is ready for analysis
    const daysRunning = Math.floor(
      (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const readyForAnalysis =
      daysRunning >= test.minimumDuration &&
      groupResults.every(g => g.userCount >= test.minimumSampleSize);

    const response: ABTestResults = {
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        startDate: test.startDate,
        endDate: test.endDate,
      },
      groups: groupResults,
      pValue,
      significant,
      readyForAnalysis,
      daysRunning,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[A/B Test Results API] Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate results for a specific group
 * 
 * @param test - A/B test
 * @param groupId - Group ID
 * @returns Group results
 */
async function calculateGroupResults(
  test: ABTest,
  groupId: string
): Promise<GroupResults> {
  // Get all cohorts in this group
  const cohorts = await prisma.userCohort.findMany({
    where: {
      experimentGroup: groupId,
      cohortDate: {
        gte: test.startDate,
        ...(test.endDate && { lte: test.endDate }),
      },
    },
  });

  const totalUsers = cohorts.length;

  if (totalUsers === 0) {
    return {
      groupId,
      groupName: test.groups.find(g => g.id === groupId)?.name || groupId,
      userCount: 0,
      day1Retention: 0,
      day7Retention: 0,
      day30Retention: 0,
      day90Retention: 0,
      avgAccuracy: 0,
      avgWordsAdded: 0,
      avgStudyTime: 0,
      lift: 0,
    };
  }

  // Calculate retention rates
  const day1Active = cohorts.filter(c => c.day1Active).length;
  const day7Active = cohorts.filter(c => c.day7Active).length;
  const day30Active = cohorts.filter(c => c.day30Active).length;
  const day90Active = cohorts.filter(c => c.day90Active).length;

  // Calculate averages
  const avgAccuracy = cohorts.reduce((sum, c) => sum + (c.avgAccuracy || 0), 0) / totalUsers;
  const avgWordsAdded = cohorts.reduce((sum, c) => sum + c.totalWordsAdded, 0) / totalUsers;
  const avgSessionLength = cohorts.reduce((sum, c) => sum + (c.avgSessionLength || 0), 0) / totalUsers;

  return {
    groupId,
    groupName: test.groups.find(g => g.id === groupId)?.name || groupId,
    userCount: totalUsers,
    day1Retention: (day1Active / totalUsers) * 100,
    day7Retention: (day7Active / totalUsers) * 100,
    day30Retention: (day30Active / totalUsers) * 100,
    day90Retention: (day90Active / totalUsers) * 100,
    avgAccuracy: avgAccuracy * 100,
    avgWordsAdded,
    avgStudyTime: avgSessionLength,
    lift: 0, // Calculated later
  };
}

/**
 * Calculate p-value using chi-square test
 * 
 * Tests if difference between groups is statistically significant.
 * 
 * @param groups - Group results
 * @returns p-value (0-1, <0.05 = significant)
 */
function calculatePValue(groups: GroupResults[]): number {
  if (groups.length < 2) return 1.0;

  // Use Day 30 retention for significance test
  const control = groups.find(g => g.groupId === 'control');
  const treatment = groups.find(g => g.groupId === 'treatment');

  if (!control || !treatment) {
    // No control/treatment groups
    return 1.0;
  }

  // Chi-square test for proportions
  const n1 = control.userCount;
  const n2 = treatment.userCount;
  const p1 = control.day30Retention / 100;
  const p2 = treatment.day30Retention / 100;

  // Sample sizes too small
  if (n1 < 30 || n2 < 30) {
    return 1.0; // Not enough data
  }

  // Pooled proportion
  const x1 = Math.round(n1 * p1);
  const x2 = Math.round(n2 * p2);
  const pooledP = (x1 + x2) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

  if (se === 0) return 1.0;

  // Z-score
  const z = Math.abs(p1 - p2) / se;

  // Convert to p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(z));

  return Math.max(0, Math.min(1, pValue));
}

/**
 * Cumulative distribution function for standard normal distribution
 * 
 * @param z - Z-score
 * @returns Cumulative probability
 */
function normalCDF(z: number): number {
  // Approximation using error function
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - p : p;
}
