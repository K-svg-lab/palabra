/**
 * Admin Analytics Dashboard (Phase 18.2.4)
 * 
 * Comprehensive admin dashboard showing:
 * - Retention cohort analysis
 * - A/B test results summary
 * - Feature usage analytics
 * - Cost breakdown and budget tracking
 * - Export functionality
 * 
 * @module app/admin
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { RetentionChart } from '@/components/admin/retention-chart';
import { CostDashboard } from '@/components/admin/cost-dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface AdminStats {
  overall: {
    totalUsers: number;
    totalWords: number;
    totalReviews: number;
    totalSessions: number;
    avgWordsPerUser: number;
    avgReviewsPerUser: number;
  };
  recent: {
    signups: number;
    reviews: number;
    wordsAdded: number;
  };
  retention: {
    trends: any[];
    atRiskUsers: number;
  };
  costs: {
    current: any;
    breakdown: any;
  };
  methods: any[];
  featureAdoption: any[];
  abTests: {
    activeTests: number;
    completedTests: number;
    totalExperimentUsers: number;
  };
  generatedAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [daysBack, setDaysBack] = useState(30);
  const router = useRouter();

  // Load stats
  async function loadStats() {
    try {
      const response = await fetch(`/api/admin/stats?daysBack=${daysBack}`);
      
      if (response.status === 401 || response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadStats();
  }, [daysBack]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, daysBack]);

  // Export to CSV
  function exportToCSV() {
    if (!stats) return;

    const csv = convertToCSV(stats);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export to JSON
  function exportToJSON() {
    if (!stats) return;

    const json = JSON.stringify(stats, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive analytics and insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Days Back Selector */}
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg border transition-colors ${
                autoRefresh
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
            </button>

            {/* Manual refresh */}
            <button
              onClick={loadStats}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Refresh now"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Export dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-lg"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Last updated */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          Last updated: {new Date(stats.generatedAt).toLocaleString()} •{' '}
          {autoRefresh && 'Auto-refreshing every 5 minutes'}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewCard
            label="Total Users"
            value={stats.overall.totalUsers.toLocaleString()}
            change={stats.recent.signups}
            changeLabel="today"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <OverviewCard
            label="Total Words"
            value={stats.overall.totalWords.toLocaleString()}
            change={stats.recent.wordsAdded}
            changeLabel="today"
            icon={<BookOpen className="w-5 h-5" />}
            color="purple"
          />
          <OverviewCard
            label="Total Reviews"
            value={stats.overall.totalReviews.toLocaleString()}
            change={stats.recent.reviews}
            changeLabel="today"
            icon={<GraduationCap className="w-5 h-5" />}
            color="green"
          />
          <OverviewCard
            label="At Risk Users"
            value={stats.retention.atRiskUsers.toLocaleString()}
            subtitle="Inactive 3-7 days"
            icon={<AlertCircle className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* Retention Chart */}
        <RetentionChart data={stats.retention.trends} />

        {/* Cost Dashboard */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Cost & Budget Tracking
          </h2>
          <CostDashboard
            costReport={stats.costs.current}
            costBreakdown={stats.costs.breakdown}
          />
        </div>

        {/* Method Performance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Review Method Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                    Method
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                    Attempts
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                    Accuracy
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                    Avg Time
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                    Difficulty
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.methods.map((method) => (
                  <tr key={method.method} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">
                      {method.method}
                    </td>
                    <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                      {method.totalAttempts.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className={`font-semibold ${
                        method.accuracy >= 0.8
                          ? 'text-green-600'
                          : method.accuracy >= 0.6
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {(method.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                      {(method.avgResponseTime / 1000).toFixed(1)}s
                    </td>
                    <td className="text-right py-3 px-2 text-gray-900 dark:text-white">
                      {method.difficultyMultiplier.toFixed(2)}×
                    </td>
                  </tr>
                ))}
                {stats.methods.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No method data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Adoption */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Feature Adoption
          </h2>
          <div className="space-y-3">
            {stats.featureAdoption.map((feature) => (
              <div key={feature.feature} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatFeatureName(feature.feature)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.usersEnabled} / {feature.totalUsers} users
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${feature.adoptionRate * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[4rem] text-right">
                    {(feature.adoptionRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            {stats.featureAdoption.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No feature adoption data available
              </div>
            )}
          </div>
        </div>

        {/* A/B Tests Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              A/B Testing Overview
            </h2>
            <Link
              href="/admin/ab-tests"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.abTests.activeTests}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Active Tests
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.abTests.completedTests}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Completed Tests
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.abTests.totalExperimentUsers}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Users in Experiments
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW CARD
// ============================================================================

function OverviewCard({
  label,
  value,
  change,
  changeLabel,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium opacity-70">{label}</div>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {change !== undefined && changeLabel ? (
        <div className="text-sm opacity-60">
          +{change} {changeLabel}
        </div>
      ) : subtitle ? (
        <div className="text-sm opacity-60">{subtitle}</div>
      ) : null}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format feature name for display
 */
function formatFeatureName(feature: string): string {
  return feature
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert stats to CSV format
 */
function convertToCSV(stats: AdminStats): string {
  const lines: string[] = [];

  // Overall metrics
  lines.push('Overall Metrics');
  lines.push('Metric,Value');
  lines.push(`Total Users,${stats.overall.totalUsers}`);
  lines.push(`Total Words,${stats.overall.totalWords}`);
  lines.push(`Total Reviews,${stats.overall.totalReviews}`);
  lines.push(`Total Sessions,${stats.overall.totalSessions}`);
  lines.push(`Avg Words Per User,${stats.overall.avgWordsPerUser.toFixed(2)}`);
  lines.push(`Avg Reviews Per User,${stats.overall.avgReviewsPerUser.toFixed(2)}`);
  lines.push('');

  // Method performance
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

  // Feature adoption
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
