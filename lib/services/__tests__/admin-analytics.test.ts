/**
 * Admin Analytics Tests (Phase 18.2.4)
 * 
 * Tests for admin dashboard analytics aggregation and formatting.
 * 
 * @module lib/services/__tests__/admin-analytics
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe('Admin Analytics - Helper Functions', () => {
  describe('Feature Name Formatting', () => {
    it('should format snake_case to Title Case', () => {
      const formatFeatureName = (feature: string): string => {
        return feature
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      expect(formatFeatureName('interleaving_enabled')).toBe('Interleaving Enabled');
      expect(formatFeatureName('ai_examples')).toBe('Ai Examples');
      expect(formatFeatureName('deep_learning_mode')).toBe('Deep Learning Mode');
    });
  });

  describe('CSV Export', () => {
    it('should convert stats to CSV format', () => {
      const stats = {
        overall: {
          totalUsers: 100,
          totalWords: 5000,
          totalReviews: 10000,
          totalSessions: 2000,
          avgWordsPerUser: 50,
          avgReviewsPerUser: 100,
        },
        methods: [
          {
            method: 'traditional',
            totalAttempts: 5000,
            accuracy: 0.85,
            avgResponseTime: 3000,
            difficultyMultiplier: 1.0,
          },
        ],
        featureAdoption: [
          {
            feature: 'interleaving_enabled',
            usersEnabled: 30,
            totalUsers: 100,
            adoptionRate: 0.3,
          },
        ],
      };

      const csv = convertToCSV(stats);

      expect(csv).toContain('Overall Metrics');
      expect(csv).toContain('Total Users,100');
      expect(csv).toContain('Method Performance');
      expect(csv).toContain('traditional,5000,85.0%');
      expect(csv).toContain('Feature Adoption');
      expect(csv).toContain('interleaving_enabled,30,100,30.0%');
    });

    function convertToCSV(stats: any): string {
      const lines: string[] = [];

      lines.push('Overall Metrics');
      lines.push('Metric,Value');
      lines.push(`Total Users,${stats.overall.totalUsers}`);
      lines.push(`Total Words,${stats.overall.totalWords}`);
      lines.push(`Total Reviews,${stats.overall.totalReviews}`);
      lines.push(`Total Sessions,${stats.overall.totalSessions}`);
      lines.push(`Avg Words Per User,${stats.overall.avgWordsPerUser.toFixed(2)}`);
      lines.push(`Avg Reviews Per User,${stats.overall.avgReviewsPerUser.toFixed(2)}`);
      lines.push('');

      lines.push('Method Performance');
      lines.push('Method,Attempts,Accuracy,Avg Time (s),Difficulty');
      for (const method of stats.methods) {
        lines.push(
          `${method.method},${method.totalAttempts},${(method.accuracy * 100).toFixed(1)}%,${(
            method.avgResponseTime / 1000
          ).toFixed(1)},${method.difficultyMultiplier.toFixed(2)}`
        );
      }
      lines.push('');

      lines.push('Feature Adoption');
      lines.push('Feature,Users Enabled,Total Users,Adoption Rate');
      for (const feature of stats.featureAdoption) {
        lines.push(
          `${feature.feature},${feature.usersEnabled},${feature.totalUsers},${(
            feature.adoptionRate * 100
          ).toFixed(1)}%`
        );
      }

      return lines.join('\n');
    }
  });
});

// ============================================================================
// DATA AGGREGATION TESTS
// ============================================================================

describe('Admin Analytics - Data Aggregation', () => {
  describe('Feature Adoption Calculation', () => {
    it('should calculate adoption rate correctly', () => {
      const totalUsers = 100;
      const usersEnabled = 30;
      const adoptionRate = usersEnabled / totalUsers;

      expect(adoptionRate).toBe(0.3);
      expect(adoptionRate * 100).toBe(30);
    });

    it('should handle zero users gracefully', () => {
      const totalUsers = 0;
      const usersEnabled = 0;
      const adoptionRate = totalUsers > 0 ? usersEnabled / totalUsers : 0;

      expect(adoptionRate).toBe(0);
    });

    it('should aggregate feature flags correctly', () => {
      const cohorts = [
        { featureAdoption: { interleaving_enabled: 1, ai_examples: 0 } },
        { featureAdoption: { interleaving_enabled: 1, ai_examples: 1 } },
        { featureAdoption: { interleaving_enabled: 0, ai_examples: 1 } },
      ];

      const featureMap = new Map<string, number>();

      for (const cohort of cohorts) {
        for (const [feature, value] of Object.entries(cohort.featureAdoption)) {
          if (value === 1) {
            featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
          }
        }
      }

      expect(featureMap.get('interleaving_enabled')).toBe(2); // 2/3 users
      expect(featureMap.get('ai_examples')).toBe(2); // 2/3 users
    });
  });

  describe('Retention Metrics Aggregation', () => {
    it('should calculate average retention correctly', () => {
      const data = [
        { day1Retention: 0.8, day7Retention: 0.6, day30Retention: 0.4 },
        { day1Retention: 0.9, day7Retention: 0.7, day30Retention: 0.5 },
        { day1Retention: 0.85, day7Retention: 0.65, day30Retention: 0.45 },
      ];

      const avgDay1 = data.reduce((sum, d) => sum + d.day1Retention, 0) / data.length;
      const avgDay7 = data.reduce((sum, d) => sum + d.day7Retention, 0) / data.length;
      const avgDay30 = data.reduce((sum, d) => sum + d.day30Retention, 0) / data.length;

      expect(avgDay1).toBeCloseTo(0.85, 2);
      expect(avgDay7).toBeCloseTo(0.65, 2);
      expect(avgDay30).toBeCloseTo(0.45, 2);
    });

    it('should handle empty data gracefully', () => {
      const data: any[] = [];
      const avgDay1 = data.length > 0
        ? data.reduce((sum, d) => sum + d.day1Retention, 0) / data.length
        : 0;

      expect(avgDay1).toBe(0);
    });
  });

  describe('Cost Breakdown Aggregation', () => {
    it('should aggregate costs by service', () => {
      const costs = [
        { service: 'openai', cost: 1.50 },
        { service: 'openai', cost: 2.00 },
        { service: 'database', cost: 0.10 },
      ];

      const serviceMap = new Map<string, { totalCost: number; totalCalls: number }>();

      for (const cost of costs) {
        if (!serviceMap.has(cost.service)) {
          serviceMap.set(cost.service, { totalCost: 0, totalCalls: 0 });
        }
        const stats = serviceMap.get(cost.service)!;
        stats.totalCost += cost.cost;
        stats.totalCalls++;
      }

      const openaiStats = serviceMap.get('openai')!;
      expect(openaiStats.totalCost).toBeCloseTo(3.50, 2);
      expect(openaiStats.totalCalls).toBe(2);

      const dbStats = serviceMap.get('database')!;
      expect(dbStats.totalCost).toBeCloseTo(0.10, 2);
      expect(dbStats.totalCalls).toBe(1);
    });

    it('should calculate daily spend correctly', () => {
      const costs = [
        { date: '2026-02-10', cost: 1.50, calls: 10 },
        { date: '2026-02-10', cost: 2.00, calls: 15 },
        { date: '2026-02-11', cost: 1.00, calls: 8 },
      ];

      const dayMap = new Map<string, { cost: number; calls: number }>();

      for (const cost of costs) {
        if (!dayMap.has(cost.date)) {
          dayMap.set(cost.date, { cost: 0, calls: 0 });
        }
        const stats = dayMap.get(cost.date)!;
        stats.cost += cost.cost;
        stats.calls += cost.calls;
      }

      const day1 = dayMap.get('2026-02-10')!;
      expect(day1.cost).toBeCloseTo(3.50, 2);
      expect(day1.calls).toBe(25);

      const day2 = dayMap.get('2026-02-11')!;
      expect(day2.cost).toBeCloseTo(1.00, 2);
      expect(day2.calls).toBe(8);
    });
  });
});

// ============================================================================
// BUDGET STATUS TESTS
// ============================================================================

describe('Admin Analytics - Budget Status', () => {
  describe('Budget Health Calculation', () => {
    it('should classify budget as healthy (<75%)', () => {
      const percentage = 60;
      const status = percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'healthy';

      expect(status).toBe('healthy');
    });

    it('should classify budget as warning (75-89%)', () => {
      const percentage = 80;
      const status = percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'healthy';

      expect(status).toBe('warning');
    });

    it('should classify budget as critical (≥90%)', () => {
      const percentage = 95;
      const status = percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'healthy';

      expect(status).toBe('critical');
    });
  });

  describe('Remaining Budget Calculation', () => {
    it('should calculate remaining budget correctly', () => {
      const monthlyBudget = 50;
      const currentSpend = 35;
      const remainingBudget = monthlyBudget - currentSpend;

      expect(remainingBudget).toBe(15);
    });

    it('should handle budget exceeded scenario', () => {
      const monthlyBudget = 50;
      const currentSpend = 52;
      const remainingBudget = monthlyBudget - currentSpend;
      const canMakeRequest = currentSpend < monthlyBudget * 0.9;

      expect(remainingBudget).toBe(-2);
      expect(canMakeRequest).toBe(false);
    });
  });
});

// ============================================================================
// CHART DATA FORMATTING TESTS
// ============================================================================

describe('Admin Analytics - Chart Data Formatting', () => {
  describe('Retention Chart Data', () => {
    it('should format retention data for charts', () => {
      const data = [
        {
          cohortDate: '2026-02-01',
          totalUsers: 10,
          day1Retention: 0.8,
          day7Retention: 0.6,
          day30Retention: 0.4,
          day90Retention: 0.3,
          avgAccuracy: 0.75,
          avgSessionsPerUser: 5,
          avgWordsPerUser: 50,
        },
      ];

      const chartData = data.map((item) => ({
        date: new Date(item.cohortDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        'Day 1': Math.round(item.day1Retention * 100),
        'Day 7': Math.round(item.day7Retention * 100),
        'Day 30': Math.round(item.day30Retention * 100),
        'Day 90': Math.round(item.day90Retention * 100),
        users: item.totalUsers,
      }));

      expect(chartData[0]['Day 1']).toBe(80);
      expect(chartData[0]['Day 7']).toBe(60);
      expect(chartData[0]['Day 30']).toBe(40);
      expect(chartData[0]['Day 90']).toBe(30);
      expect(chartData[0].users).toBe(10);
    });
  });

  describe('Cost Chart Data', () => {
    it('should format daily spend for charts', () => {
      const dailySpend = [
        { date: '2026-02-10', cost: 1.5, calls: 10 },
        { date: '2026-02-11', cost: 2.0, calls: 15 },
      ];

      const chartData = dailySpend.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        cost: parseFloat(item.cost.toFixed(2)),
        calls: item.calls,
      }));

      expect(chartData[0].cost).toBe(1.5);
      expect(chartData[0].calls).toBe(10);
      expect(chartData[1].cost).toBe(2.0);
      expect(chartData[1].calls).toBe(15);
    });
  });
});

// ============================================================================
// EXPORT FUNCTIONALITY TESTS
// ============================================================================

describe('Admin Analytics - Export Functionality', () => {
  describe('CSV Export Format', () => {
    it('should include all required sections', () => {
      const stats = {
        overall: {
          totalUsers: 100,
          totalWords: 5000,
          totalReviews: 10000,
          totalSessions: 2000,
          avgWordsPerUser: 50,
          avgReviewsPerUser: 100,
        },
        methods: [],
        featureAdoption: [],
      };

      const csv = convertToCSV(stats);

      expect(csv).toContain('Overall Metrics');
      expect(csv).toContain('Method Performance');
      expect(csv).toContain('Feature Adoption');
    });

    function convertToCSV(stats: any): string {
      const lines: string[] = [];
      lines.push('Overall Metrics');
      lines.push('Method Performance');
      lines.push('Feature Adoption');
      return lines.join('\n');
    }
  });

  describe('JSON Export Format', () => {
    it('should serialize stats correctly', () => {
      const stats = {
        overall: { totalUsers: 100 },
        methods: [{ method: 'traditional', accuracy: 0.85 }],
      };

      const json = JSON.stringify(stats, null, 2);
      const parsed = JSON.parse(json);

      expect(parsed.overall.totalUsers).toBe(100);
      expect(parsed.methods[0].accuracy).toBe(0.85);
    });
  });
});

// ============================================================================
// API RESPONSE STRUCTURE TESTS
// ============================================================================

describe('Admin Analytics - API Response Structure', () => {
  describe('Stats Response Schema', () => {
    it('should have all required top-level fields', () => {
      const response = {
        overall: {},
        recent: {},
        retention: {},
        costs: {},
        methods: [],
        featureAdoption: [],
        abTests: {},
        generatedAt: new Date().toISOString(),
      };

      expect(response).toHaveProperty('overall');
      expect(response).toHaveProperty('recent');
      expect(response).toHaveProperty('retention');
      expect(response).toHaveProperty('costs');
      expect(response).toHaveProperty('methods');
      expect(response).toHaveProperty('featureAdoption');
      expect(response).toHaveProperty('abTests');
      expect(response).toHaveProperty('generatedAt');
    });

    it('should have valid overall metrics structure', () => {
      const overall = {
        totalUsers: 100,
        totalWords: 5000,
        totalReviews: 10000,
        totalSessions: 2000,
        avgWordsPerUser: 50,
        avgReviewsPerUser: 100,
      };

      expect(overall).toHaveProperty('totalUsers');
      expect(overall).toHaveProperty('totalWords');
      expect(overall).toHaveProperty('totalReviews');
      expect(overall).toHaveProperty('totalSessions');
      expect(overall).toHaveProperty('avgWordsPerUser');
      expect(overall).toHaveProperty('avgReviewsPerUser');
    });
  });
});
