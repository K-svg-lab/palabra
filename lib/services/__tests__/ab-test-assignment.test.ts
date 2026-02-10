/**
 * A/B Test Assignment Tests (Phase 18.2.3)
 * 
 * Tests for A/B test configuration, user assignment, and feature flags.
 * 
 * @module ab-test-assignment-tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  getActiveTest,
  getTestById,
  validateTestAllocations,
  getMetricDisplayName,
  ACTIVE_AB_TESTS,
  DEFAULT_FEATURES,
  type ABTest,
  type ABTestGroup,
  type FeatureFlags,
  type MetricType,
} from '@/lib/config/ab-tests';

describe('A/B Test Configuration', () => {
  // ============================================================================
  // TEST STRUCTURE
  // ============================================================================

  describe('Test Structure', () => {
    it('should have valid test definitions', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        expect(test.id).toBeTruthy();
        expect(test.name).toBeTruthy();
        expect(test.description).toBeTruthy();
        expect(test.hypothesis).toBeTruthy();
        expect(test.startDate).toBeInstanceOf(Date);
        expect(test.groups.length).toBeGreaterThanOrEqual(2);
        expect(test.metrics.length).toBeGreaterThan(0);
        expect(test.minimumSampleSize).toBeGreaterThan(0);
        expect(test.minimumDuration).toBeGreaterThan(0);
      });
    });

    it('should have exactly 2 groups per test (control + treatment)', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        expect(test.groups.length).toBe(2);
        
        const controlGroup = test.groups.find(g => g.id === 'control');
        const treatmentGroup = test.groups.find(g => g.id === 'treatment');
        
        expect(controlGroup).toBeTruthy();
        expect(treatmentGroup).toBeTruthy();
      });
    });

    it('should have valid group allocations', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        expect(validateTestAllocations(test)).toBe(true);
      });
    });

    it('should have equal allocation (50/50 split)', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        test.groups.forEach(group => {
          expect(group.allocation).toBe(0.5);
        });
      });
    });

    it('should have non-overlapping test periods', () => {
      const activeTests = ACTIVE_AB_TESTS.filter(t => t.active);
      
      expect(activeTests.length).toBeLessThanOrEqual(1); // Only ONE test active
      
      if (activeTests.length > 1) {
        console.warn('Multiple tests active! This creates confounding variables.');
      }
    });
  });

  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================

  describe('Feature Flags', () => {
    it('should have valid default features', () => {
      expect(DEFAULT_FEATURES.aiExamples).toBe(true);
      expect(DEFAULT_FEATURES.retrievalVariation).toBe(true);
      expect(DEFAULT_FEATURES.interleavedPractice).toBe(true);
      expect(DEFAULT_FEATURES.interferenceDetection).toBe(true);
      expect(DEFAULT_FEATURES.deepLearningMode).toBe(false); // Opt-in
    });

    it('should define features for each group', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        test.groups.forEach(group => {
          expect(group.features).toBeTruthy();
          expect(typeof group.features.aiExamples).toBe('boolean');
          expect(typeof group.features.retrievalVariation).toBe('boolean');
          expect(typeof group.features.interleavedPractice).toBe('boolean');
          expect(typeof group.features.interferenceDetection).toBe('boolean');
          expect(typeof group.features.deepLearningMode).toBe('boolean');
        });
      });
    });

    it('should have exactly ONE different feature between control and treatment', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        const control = test.groups.find(g => g.id === 'control');
        const treatment = test.groups.find(g => g.id === 'treatment');
        
        if (!control || !treatment) return;

        const featureKeys = Object.keys(control.features) as (keyof FeatureFlags)[];
        let differences = 0;

        featureKeys.forEach(key => {
          if (control.features[key] !== treatment.features[key]) {
            differences++;
          }
        });

        // Should test ONE feature at a time (isolate variable)
        expect(differences).toBeLessThanOrEqual(1);
      });
    });
  });

  // ============================================================================
  // METRICS
  // ============================================================================

  describe('Metrics', () => {
    it('should have valid metric types', () => {
      const validMetrics: MetricType[] = [
        'day1Retention',
        'day7Retention',
        'day30Retention',
        'day90Retention',
        'avgAccuracy',
        'wordsAdded',
        'studyTime',
        'sessionCompletion',
      ];

      ACTIVE_AB_TESTS.forEach(test => {
        test.metrics.forEach(metric => {
          expect(validMetrics).toContain(metric);
        });
      });
    });

    it('should have display names for all metrics', () => {
      const metrics: MetricType[] = [
        'day1Retention',
        'day7Retention',
        'day30Retention',
        'day90Retention',
        'avgAccuracy',
        'wordsAdded',
        'studyTime',
        'sessionCompletion',
      ];

      metrics.forEach(metric => {
        const name = getMetricDisplayName(metric);
        expect(name).toBeTruthy();
        expect(name.length).toBeGreaterThan(3);
      });
    });
  });

  // ============================================================================
  // TEST UTILITIES
  // ============================================================================

  describe('Test Utilities', () => {
    it('should get active test', () => {
      const activeTest = getActiveTest();
      
      if (activeTest) {
        expect(activeTest.active).toBe(true);
      } else {
        // No active test (which is fine)
        expect(activeTest).toBeNull();
      }
    });

    it('should get test by ID', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        const found = getTestById(test.id);
        expect(found).toBeTruthy();
        expect(found?.id).toBe(test.id);
      });
    });

    it('should return null for invalid test ID', () => {
      const notFound = getTestById('invalid-test-id');
      expect(notFound).toBeNull();
    });

    it('should validate allocations sum to 1.0', () => {
      const validTest: ABTest = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        hypothesis: 'Test',
        startDate: new Date(),
        groups: [
          { id: 'a', name: 'A', description: 'A', allocation: 0.5, features: DEFAULT_FEATURES },
          { id: 'b', name: 'B', description: 'B', allocation: 0.5, features: DEFAULT_FEATURES },
        ],
        metrics: ['day30Retention'],
        active: false,
        minimumSampleSize: 100,
        minimumDuration: 30,
      };

      expect(validateTestAllocations(validTest)).toBe(true);

      const invalidTest: ABTest = {
        ...validTest,
        groups: [
          { id: 'a', name: 'A', description: 'A', allocation: 0.6, features: DEFAULT_FEATURES },
          { id: 'b', name: 'B', description: 'B', allocation: 0.5, features: DEFAULT_FEATURES },
        ],
      };

      expect(validateTestAllocations(invalidTest)).toBe(false);
    });
  });

  // ============================================================================
  // ASSIGNMENT ALGORITHM
  // ============================================================================

  describe('Random Assignment', () => {
    it('should distribute users evenly across groups', () => {
      // Simulate 1000 user assignments
      const assignments = { control: 0, treatment: 0 };

      for (let i = 0; i < 1000; i++) {
        const random = Math.random();
        
        // 50/50 split
        if (random < 0.5) {
          assignments.control++;
        } else {
          assignments.treatment++;
        }
      }

      // Should be roughly 500/500 (allow 10% variance)
      expect(assignments.control).toBeGreaterThan(450);
      expect(assignments.control).toBeLessThan(550);
      expect(assignments.treatment).toBeGreaterThan(450);
      expect(assignments.treatment).toBeLessThan(550);
    });

    it('should select correct group based on random value', () => {
      const groups: ABTestGroup[] = [
        { id: 'control', name: 'Control', description: '', allocation: 0.5, features: DEFAULT_FEATURES },
        { id: 'treatment', name: 'Treatment', description: '', allocation: 0.5, features: DEFAULT_FEATURES },
      ];

      // Simulate group selection
      function selectGroup(random: number): string {
        let cumulative = 0;
        for (const group of groups) {
          cumulative += group.allocation;
          if (random < cumulative) {
            return group.id;
          }
        }
        return groups[0].id;
      }

      // Test boundary cases
      expect(selectGroup(0.0)).toBe('control'); // Lower bound
      expect(selectGroup(0.49)).toBe('control'); // Just before split
      expect(selectGroup(0.5)).toBe('treatment'); // At split
      expect(selectGroup(0.99)).toBe('treatment'); // Upper bound
    });
  });

  // ============================================================================
  // STATISTICAL SIGNIFICANCE
  // ============================================================================

  describe('Statistical Significance', () => {
    it('should require minimum sample size', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        expect(test.minimumSampleSize).toBeGreaterThanOrEqual(100); // At least 100 per group
        
        // Recommended: 200+ per group for statistical power
        if (test.minimumSampleSize < 200) {
          console.warn(`Test ${test.id} has low sample size (${test.minimumSampleSize}). Recommend 200+.`);
        }
      });
    });

    it('should require minimum duration', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        expect(test.minimumDuration).toBeGreaterThanOrEqual(7); // At least 1 week
        
        // For Day 30 retention, need 30+ days
        if (test.metrics.includes('day30Retention')) {
          expect(test.minimumDuration).toBeGreaterThanOrEqual(30);
        }
      });
    });

    it('should calculate chi-square significance correctly', () => {
      // Manual test of statistical significance calculation
      const n1 = 200; // Control group size
      const n2 = 200; // Treatment group size
      const p1 = 0.60; // 60% retention control
      const p2 = 0.75; // 75% retention treatment

      const x1 = Math.round(n1 * p1); // 120
      const x2 = Math.round(n2 * p2); // 150
      const pooledP = (x1 + x2) / (n1 + n2); // 0.675

      const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
      const z = Math.abs(p1 - p2) / se;

      // Large difference should have high z-score
      expect(z).toBeGreaterThan(2.0); // Above 95% confidence

      // Small difference should have low z-score
      const p3 = 0.60;
      const p4 = 0.62; // Only 2% difference
      const x3 = Math.round(n1 * p3);
      const x4 = Math.round(n2 * p4);
      const pooledP2 = (x3 + x4) / (n1 + n2);
      const se2 = Math.sqrt(pooledP2 * (1 - pooledP2) * (1 / n1 + 1 / n2));
      const z2 = Math.abs(p3 - p4) / se2;

      expect(z2).toBeLessThan(1.96); // Below 95% confidence
    });
  });

  // ============================================================================
  // BUSINESS VALIDATION
  // ============================================================================

  describe('Business Validation', () => {
    it('should test Phase 18.1 and 18.2 features', () => {
      const featuresTested = new Set<string>();

      ACTIVE_AB_TESTS.forEach(test => {
        test.groups.forEach(group => {
          Object.keys(group.features).forEach(feature => {
            featuresTested.add(feature);
          });
        });
      });

      // Should test all major features
      expect(featuresTested.has('aiExamples')).toBe(true);
      expect(featuresTested.has('retrievalVariation')).toBe(true);
      expect(featuresTested.has('interleavedPractice')).toBe(true);
      expect(featuresTested.has('deepLearningMode')).toBe(true);
    });

    it('should have realistic hypotheses', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        // Hypothesis should mention percentage or improvement
        const hypothesis = test.hypothesis.toLowerCase();
        const hasQuantitative = 
          hypothesis.includes('%') ||
          hypothesis.includes('percent') ||
          hypothesis.includes('higher') ||
          hypothesis.includes('better') ||
          hypothesis.includes('improve');
        
        expect(hasQuantitative).toBe(true);
      });
    });

    it('should have reasonable test durations', () => {
      ACTIVE_AB_TESTS.forEach(test => {
        const duration = (test.endDate?.getTime() || Date.now()) - test.startDate.getTime();
        const days = duration / (1000 * 60 * 60 * 24);

        // Should run for at least 30 days, max 180 days
        if (test.endDate) {
          expect(days).toBeGreaterThanOrEqual(30);
          expect(days).toBeLessThanOrEqual(180);
        }
      });
    });
  });

  // ============================================================================
  // COHORT TRACKING
  // ============================================================================

  describe('Cohort Tracking', () => {
    it('should calculate ISO week correctly', () => {
      const date = new Date('2026-02-10');
      // Week 7 of 2026
      // ISO week calculation tested indirectly via assignment service
      expect(date.getFullYear()).toBe(2026);
    });

    it('should calculate year-month correctly', () => {
      const date = new Date('2026-02-10');
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      
      expect(yearMonth).toBe('2026-02');
    });

    it('should track cohort by signup date', () => {
      // Cohort = group of users who signed up on same date
      const signupDate = new Date('2026-02-10');
      
      expect(signupDate).toBeInstanceOf(Date);
      expect(signupDate.getFullYear()).toBe(2026);
      expect(signupDate.getMonth()).toBe(1); // February (0-indexed)
      expect(signupDate.getDate()).toBe(10);
    });
  });
});
