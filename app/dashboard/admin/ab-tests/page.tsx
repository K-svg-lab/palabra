/**
 * A/B Test Results Dashboard (Phase 18.2.3)
 * 
 * Admin-only dashboard for monitoring A/B test results.
 * Shows retention comparison, statistical significance, and lift.
 * 
 * @module app/admin/ab-tests
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ACTIVE_AB_TESTS, getMetricDisplayName } from '@/lib/config/ab-tests';

// ============================================================================
// TYPES
// ============================================================================

interface GroupResults {
  groupId: string;
  groupName: string;
  userCount: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  day90Retention: number;
  avgAccuracy: number;
  avgWordsAdded: number;
  avgStudyTime: number;
  lift: number;
}

interface TestResults {
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
// MAIN COMPONENT
// ============================================================================

export default function ABTestDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        // Check admin access via API (which has access to server-side env vars)
        const response = await fetch('/api/admin/check');
        if (!response.ok) {
          router.push('/dashboard');
          return;
        }

        const data = await response.json();
        if (!data.isAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                A/B Test Results
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Feature validation and retention analysis
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>

        {/* Active Tests */}
        <div className="space-y-6">
          {ACTIVE_AB_TESTS.filter(t => t.active).length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Active Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure and activate tests in the config file
              </p>
            </div>
          ) : (
            ACTIVE_AB_TESTS.filter(t => t.active).map(test => (
              <ABTestCard key={test.id} testId={test.id} />
            ))
          )}

          {/* Planned Tests */}
          {ACTIVE_AB_TESTS.filter(t => !t.active).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Planned Tests
              </h2>
              {ACTIVE_AB_TESTS.filter(t => !t.active).map(test => (
                <PlannedTestCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AB TEST CARD
// ============================================================================

function ABTestCard({ testId }: { testId: string }) {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch(`/api/analytics/ab-test-results?testId=${testId}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadResults, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [testId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {results.test.name}
          </h2>
          {results.readyForAnalysis ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Collecting Data
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {results.test.description}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Running for {results.daysRunning} days
        </p>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Group
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Users
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Day 7
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Day 30
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Day 90
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Accuracy
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                Lift
              </th>
            </tr>
          </thead>
          <tbody>
            {results.groups.map(group => (
              <tr key={group.groupId} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {group.groupName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.groupId}
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                  {group.userCount}
                </td>
                <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                  {group.day7Retention.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                  {group.day30Retention.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                  {group.day90Retention.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                  {group.avgAccuracy.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-2">
                  {group.lift !== 0 && (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        group.lift > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {group.lift > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {group.lift > 0 ? '+' : ''}
                      {group.lift.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistical Significance */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Statistical Significance
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Chi-square test, α = 0.05, two-tailed
            </p>
          </div>
          <div className="text-right">
            {results.significant ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-600">
                    Significant
                  </p>
                  <p className="text-xs text-gray-500">
                    p = {results.pValue.toFixed(4)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Not Significant
                  </p>
                  <p className="text-xs text-gray-500">
                    p = {results.pValue.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!results.readyForAnalysis && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Not enough data yet.</strong> Need 200+ users per group and 30+ days for reliable results.
              Currently running for {results.daysRunning} days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PLANNED TEST CARD
// ============================================================================

function PlannedTestCard({ test }: { test: any }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 opacity-60">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {test.name}
        </h3>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          Planned
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {test.description}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        <strong>Hypothesis:</strong> {test.hypothesis}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {test.groups.map((group: any) => (
          <div
            key={group.id}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
          >
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {group.name}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {(group.allocation * 100).toFixed(0)}% allocation
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
