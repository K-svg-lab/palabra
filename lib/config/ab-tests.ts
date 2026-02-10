/**
 * A/B Test Configuration (Phase 18.2.3)
 * 
 * Defines all active experiments for feature validation.
 * Used to randomly assign users to control/treatment groups
 * and measure retention/learning outcome differences.
 * 
 * @module ab-tests-config
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  startDate: Date;
  endDate?: Date;
  groups: ABTestGroup[];
  metrics: MetricType[];
  active: boolean;
  minimumSampleSize: number; // Users per group
  minimumDuration: number; // Days
}

export interface ABTestGroup {
  id: string;
  name: string;
  description: string;
  allocation: number; // % of users (0-1, must sum to 1.0)
  features: FeatureFlags;
}

export interface FeatureFlags {
  // Phase 18.1 Features
  aiExamples: boolean;
  retrievalVariation: boolean;
  interleavedPractice: boolean;
  
  // Phase 18.2 Features
  interferenceDetection: boolean;
  deepLearningMode: boolean;
  
  // Future features
  socialFeatures?: boolean;
  gamification?: boolean;
}

export type MetricType =
  | 'day1Retention'
  | 'day7Retention'
  | 'day30Retention'
  | 'day90Retention'
  | 'avgAccuracy'
  | 'wordsAdded'
  | 'studyTime'
  | 'sessionCompletion';

// ============================================================================
// DEFAULT FEATURE FLAGS
// ============================================================================

/**
 * Default features for new users (no experiment)
 */
export const DEFAULT_FEATURES: FeatureFlags = {
  aiExamples: true,
  retrievalVariation: true,
  interleavedPractice: true,
  interferenceDetection: true,
  deepLearningMode: false, // Opt-in
};

// ============================================================================
// ACTIVE A/B TESTS
// ============================================================================

/**
 * All active A/B tests
 * 
 * NOTE: Only ONE test should be active at a time for clean results.
 * Sequential testing prevents confounding variables.
 */
export const ACTIVE_AB_TESTS: ABTest[] = [
  // ============================================================================
  // TEST 1: AI-Generated Examples Validation
  // ============================================================================
  {
    id: 'ai-examples-validation',
    name: 'AI-Generated Examples Impact',
    description: 'Test if AI-generated contextual examples improve retention vs. no examples',
    hypothesis: 'Users with AI examples will show 15-20% higher 30-day retention',
    startDate: new Date('2026-02-15'),
    endDate: new Date('2026-05-15'), // 90 days
    minimumSampleSize: 200, // 200 users per group
    minimumDuration: 30, // Need 30 days minimum for Day 30 retention
    groups: [
      {
        id: 'control',
        name: 'Control Group',
        description: 'Basic vocabulary lookup without AI examples',
        allocation: 0.5,
        features: {
          aiExamples: false, // ❌ No AI examples
          retrievalVariation: false, // Traditional only (baseline)
          interleavedPractice: false,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
      {
        id: 'treatment',
        name: 'AI Examples Group',
        description: 'Full AI-generated contextual examples',
        allocation: 0.5,
        features: {
          aiExamples: true, // ✅ AI examples enabled
          retrievalVariation: false, // Traditional only (isolate variable)
          interleavedPractice: false,
          interferenceDetection: false,
          deepLearningMode: false,
        },
      },
    ],
    metrics: [
      'day7Retention',
      'day30Retention',
      'day90Retention',
      'avgAccuracy',
      'wordsAdded',
    ],
    active: false, // Start after Phase 18.2 complete
  },

  // ============================================================================
  // TEST 2: Retrieval Variation Validation
  // ============================================================================
  {
    id: 'retrieval-variation-validation',
    name: 'Retrieval Variation Impact',
    description: 'Test if varied retrieval methods improve retention vs. traditional only',
    hypothesis: 'Users with 5 retrieval methods will show 20%+ higher retention',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-05-30'), // 90 days
    minimumSampleSize: 200,
    minimumDuration: 30,
    groups: [
      {
        id: 'control',
        name: 'Traditional Only',
        description: 'Classic flashcard method only',
        allocation: 0.5,
        features: {
          aiExamples: true, // Baseline includes proven features
          retrievalVariation: false, // ❌ Traditional only
          interleavedPractice: true,
          interferenceDetection: true,
          deepLearningMode: false,
        },
      },
      {
        id: 'treatment',
        name: '5 Varied Methods',
        description: 'All 5 retrieval practice methods',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true, // ✅ All 5 methods
          interleavedPractice: true,
          interferenceDetection: true,
          deepLearningMode: false,
        },
      },
    ],
    metrics: [
      'day30Retention',
      'day90Retention',
      'avgAccuracy',
      'sessionCompletion',
    ],
    active: false, // Run after AI examples test
  },

  // ============================================================================
  // TEST 3: Interleaved Practice Validation
  // ============================================================================
  {
    id: 'interleaved-practice-validation',
    name: 'Interleaved Practice Impact',
    description: 'Test if interleaved practice improves retention vs. blocked practice',
    hypothesis: 'Interleaved practice will show 30-40% higher retention (research: 43%)',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'), // 90 days
    minimumSampleSize: 200,
    minimumDuration: 30,
    groups: [
      {
        id: 'control',
        name: 'Blocked Practice',
        description: 'Words reviewed in original order',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true,
          interleavedPractice: false, // ❌ Blocked practice
          interferenceDetection: true,
          deepLearningMode: false,
        },
      },
      {
        id: 'treatment',
        name: 'Interleaved Practice',
        description: 'Words mixed by POS, age, difficulty',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true,
          interleavedPractice: true, // ✅ Interleaved
          interferenceDetection: true,
          deepLearningMode: false,
        },
      },
    ],
    metrics: [
      'day30Retention',
      'day90Retention',
      'avgAccuracy',
      'studyTime',
    ],
    active: false, // Run after retrieval variation test
  },

  // ============================================================================
  // TEST 4: Deep Learning Mode Validation
  // ============================================================================
  {
    id: 'deep-learning-validation',
    name: 'Deep Learning Mode Impact',
    description: 'Test if elaborative interrogation improves long-term retention',
    hypothesis: 'Deep learning mode will show 10-15% better retention (research: d=0.71)',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-07-30'), // 90 days
    minimumSampleSize: 200,
    minimumDuration: 30,
    groups: [
      {
        id: 'control',
        name: 'Standard Review',
        description: 'Normal review without elaborative prompts',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true,
          interleavedPractice: true,
          interferenceDetection: true,
          deepLearningMode: false, // ❌ No deep learning
        },
      },
      {
        id: 'treatment',
        name: 'Deep Learning Enabled',
        description: 'Elaborative prompts every 12 cards',
        allocation: 0.5,
        features: {
          aiExamples: true,
          retrievalVariation: true,
          interleavedPractice: true,
          interferenceDetection: true,
          deepLearningMode: true, // ✅ Deep learning ON
        },
      },
    ],
    metrics: [
      'day30Retention',
      'day90Retention',
      'avgAccuracy',
      'studyTime',
    ],
    active: false, // Run after interleaved practice test
  },
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Get active A/B test
 * 
 * Only one test should be active at a time.
 * 
 * @returns Active test or null
 */
export function getActiveTest(): ABTest | null {
  const activeTests = ACTIVE_AB_TESTS.filter(t => t.active);
  
  if (activeTests.length === 0) {
    return null;
  }
  
  if (activeTests.length > 1) {
    console.warn('[A/B Tests] Multiple tests active! Using first one.');
  }
  
  return activeTests[0];
}

/**
 * Get test by ID
 * 
 * @param testId - Test ID
 * @returns Test or null
 */
export function getTestById(testId: string): ABTest | null {
  return ACTIVE_AB_TESTS.find(t => t.id === testId) || null;
}

/**
 * Check if test allocations are valid
 * 
 * Group allocations must sum to 1.0
 * 
 * @param test - A/B test
 * @returns True if valid
 */
export function validateTestAllocations(test: ABTest): boolean {
  const sum = test.groups.reduce((acc, group) => acc + group.allocation, 0);
  return Math.abs(sum - 1.0) < 0.0001; // Allow floating point error
}

/**
 * Get metric display name
 * 
 * @param metric - Metric type
 * @returns Human-readable name
 */
export function getMetricDisplayName(metric: MetricType): string {
  const names: Record<MetricType, string> = {
    day1Retention: 'Day 1 Retention',
    day7Retention: 'Day 7 Retention',
    day30Retention: 'Day 30 Retention',
    day90Retention: 'Day 90 Retention',
    avgAccuracy: 'Average Accuracy',
    wordsAdded: 'Words Added',
    studyTime: 'Study Time',
    sessionCompletion: 'Session Completion Rate',
  };
  
  return names[metric] || metric;
}
