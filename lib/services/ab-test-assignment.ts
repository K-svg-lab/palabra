/**
 * A/B Test Assignment Service (Phase 18.2.3)
 * 
 * Assigns users to experiment groups on signup and manages
 * feature flag retrieval for conditional rendering.
 * 
 * Core Principles:
 * - Random assignment on first visit
 * - Stable assignment (user stays in same group)
 * - Feature flags control what user sees
 * - No cross-contamination between groups
 * 
 * @module ab-test-assignment
 */

import { prisma } from '@/lib/backend/db';
import {
  getActiveTest,
  DEFAULT_FEATURES,
  type ABTest,
  type ABTestGroup,
  type FeatureFlags,
} from '@/lib/config/ab-tests';

// ============================================================================
// USER ASSIGNMENT
// ============================================================================

/**
 * Assign user to active experiments
 * 
 * Called when user signs up or first visits the app.
 * Randomly assigns to control or treatment group.
 * 
 * @param userId - User ID
 */
export async function assignUserToExperiments(userId: string): Promise<void> {
  const activeTest = getActiveTest();
  
  if (!activeTest) {
    console.log('[A/B Test] No active test, using default features');
    
    // No active test - use default features
    await updateUserFeatureFlags(userId, DEFAULT_FEATURES, null);
    return;
  }

  // Select group based on allocation percentages
  const group = selectGroup(activeTest.groups);
  
  console.log(
    `[A/B Test] User ${userId} assigned to ${activeTest.id}:${group.id} (${group.name})`
  );

  // Update user cohort with assignment
  await updateUserFeatureFlags(userId, group.features, group.id);
}

/**
 * Select group for user based on allocation
 * 
 * Uses weighted random selection based on group.allocation values.
 * 
 * @param groups - Array of test groups
 * @returns Selected group
 */
function selectGroup(groups: ABTestGroup[]): ABTestGroup {
  const random = Math.random();
  let cumulative = 0;

  for (const group of groups) {
    cumulative += group.allocation;
    if (random < cumulative) {
      return group;
    }
  }

  // Fallback (shouldn't happen if allocations sum to 1.0)
  console.warn('[A/B Test] Allocation fallback triggered');
  return groups[0];
}

/**
 * Update user's feature flags in database
 * 
 * @param userId - User ID
 * @param features - Feature flags
 * @param experimentGroup - Experiment group ID (null if no active test)
 */
async function updateUserFeatureFlags(
  userId: string,
  features: FeatureFlags,
  experimentGroup: string | null
): Promise<void> {
  await prisma.userCohort.upsert({
    where: { userId },
    update: {
      experimentGroup,
      featureFlags: features as any,
    },
    create: {
      userId,
      cohortDate: new Date(),
      cohortWeek: getISOWeek(new Date()),
      cohortMonth: getYearMonth(new Date()),
      experimentGroup,
      featureFlags: features as any,
    },
  });
}

// ============================================================================
// FEATURE FLAG RETRIEVAL
// ============================================================================

/**
 * Get feature flags for user
 * 
 * Returns the user's assigned feature flags.
 * If user not in cohort, assigns them first.
 * 
 * @param userId - User ID
 * @returns Feature flags
 */
export async function getUserFeatureFlags(
  userId: string
): Promise<FeatureFlags> {
  let cohort = await prisma.userCohort.findUnique({
    where: { userId },
    select: { featureFlags: true, experimentGroup: true },
  });

  // If user not in cohort, assign them now
  if (!cohort) {
    await assignUserToExperiments(userId);
    
    cohort = await prisma.userCohort.findUnique({
      where: { userId },
      select: { featureFlags: true, experimentGroup: true },
    });
  }

  return (cohort?.featureFlags as FeatureFlags) || DEFAULT_FEATURES;
}

/**
 * Check if specific feature is enabled for user
 * 
 * @param userId - User ID
 * @param feature - Feature name
 * @returns True if enabled
 */
export async function hasFeature(
  userId: string,
  feature: keyof FeatureFlags
): Promise<boolean> {
  const flags = await getUserFeatureFlags(userId);
  return flags[feature] === true;
}

// ============================================================================
// GUEST USER HANDLING
// ============================================================================

/**
 * Get feature flags for guest user
 * 
 * Guests always get default features.
 * 
 * @returns Default feature flags
 */
export function getGuestFeatureFlags(): FeatureFlags {
  return DEFAULT_FEATURES;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get ISO week string (YYYY-Www)
 * 
 * @param date - Date
 * @returns ISO week string
 */
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Get year-month string (YYYY-MM)
 * 
 * @param date - Date
 * @returns Year-month string
 */
function getYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================================================
// EXPERIMENT VALIDATION
// ============================================================================

/**
 * Check if user's cohort has enough data for analysis
 * 
 * @param userId - User ID
 * @returns True if cohort is ready for analysis
 */
export async function isCohortReadyForAnalysis(
  userId: string
): Promise<boolean> {
  const cohort = await prisma.userCohort.findUnique({
    where: { userId },
  });

  if (!cohort) return false;

  const activeTest = getActiveTest();
  if (!activeTest) return false;

  // Check if cohort is old enough
  const daysSinceSignup = Math.floor(
    (Date.now() - cohort.cohortDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceSignup >= activeTest.minimumDuration;
}

/**
 * Get experiment group for user
 * 
 * @param userId - User ID
 * @returns Experiment group ID or null
 */
export async function getUserExperimentGroup(
  userId: string
): Promise<string | null> {
  const cohort = await prisma.userCohort.findUnique({
    where: { userId },
    select: { experimentGroup: true },
  });

  return cohort?.experimentGroup || null;
}
