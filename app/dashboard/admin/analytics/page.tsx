/**
 * Admin Analytics Dashboard
 * Phase 16.2 - Infrastructure & Developer Experience
 * 
 * Shows system-wide analytics:
 * - Word lookup performance
 * - Cache hit rates
 * - A/B test results
 * - API performance
 * - Popular words
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Zap, 
  Database, 
  Users, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface AnalyticsSummary {
  totalLookups: number;
  totalSaves: number;
  saveRate: number;
  cacheHitRate: number;
  avgResponseTime: number;
  totalApiCalls: number;
  apiCallsSaved: number;
}

interface PopularWord {
  word: string;
  count: number;
  saveRate: number;
}

interface ABTestStats {
  totalEvents: number;
  totalViews: number;
  totalInteractions: number;
  variants: Record<string, {
    views: number;
    interactions: number;
    clicks: number;
    hovers: number;
    clickRate: number;
    interactionRate: number;
    deviceBreakdown: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  }>;
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [popularWords, setPopularWords] = useState<PopularWord[]>([]);
  const [abTestStats, setABTestStats] = useState<ABTestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [daysBack]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load overall analytics
      const analyticsRes = await fetch(`/api/analytics?daysBack=${daysBack}`);
      if (!analyticsRes.ok) throw new Error('Failed to load analytics');
      const analyticsData = await analyticsRes.json();

      setSummary(analyticsData.overview);
      setPopularWords(analyticsData.popularWords || []);

      // Load A/B test stats
      const abTestRes = await fetch(`/api/analytics/ab-test?testName=cache-indicator-design-v1&daysBack=${daysBack}`);
      if (!abTestRes.ok) throw new Error('Failed to load A/B test stats');
      const abTestData = await abTestRes.json();

      const testStats = abTestData.statistics?.['cache-indicator-design-v1'];
      if (testStats) {
        setABTestStats(testStats);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to Load Analytics
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">System Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Word lookups, cache performance, and A/B tests
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysBack(days)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    daysBack === days
                      ? 'bg-accent text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        {/* Overview Stats */}
        {summary && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Total Lookups"
                value={summary.totalLookups}
                color="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                icon={<CheckCircle className="h-5 w-5" />}
                title="Total Saves"
                value={summary.totalSaves}
                subtitle={`${summary.saveRate}% save rate`}
                color="text-green-600 dark:text-green-400"
              />
              <StatCard
                icon={<Zap className="h-5 w-5" />}
                title="Cache Hit Rate"
                value={`${summary.cacheHitRate}%`}
                subtitle={`${summary.apiCallsSaved} API calls saved`}
                color="text-purple-600 dark:text-purple-400"
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                title="Avg Response"
                value={`${summary.avgResponseTime}ms`}
                subtitle="Average lookup time"
                color="text-orange-600 dark:text-orange-400"
              />
            </div>
          </section>
        )}

        {/* Cache Performance */}
        {summary && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Cache Performance</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Cache Hits</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((summary.cacheHitRate / 100) * summary.totalLookups)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {summary.cacheHitRate}% of lookups
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">Cache Misses</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {summary.totalLookups - Math.round((summary.cacheHitRate / 100) * summary.totalLookups)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {100 - summary.cacheHitRate}% of lookups
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">API Calls Saved</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.apiCallsSaved}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {summary.totalApiCalls} total API calls
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Popular Words */}
        {popularWords.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Most Looked Up Words</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Lookups
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Save Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {popularWords.slice(0, 10).map((word, index) => (
                    <tr key={word.word} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{word.word}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-semibold">{word.count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${word.saveRate * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12">
                            {Math.round(word.saveRate * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* A/B Test Results */}
        {abTestStats && (
          <section>
            <h2 className="text-xl font-semibold mb-4">A/B Test: Cache Indicators</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                title="Total Views"
                value={abTestStats.totalViews}
                color="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Total Interactions"
                value={abTestStats.totalInteractions}
                color="text-green-600 dark:text-green-400"
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Variants"
                value="4"
                subtitle="Control + 3 variants"
                color="text-purple-600 dark:text-purple-400"
              />
            </div>

            {/* Variant Comparison */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(abTestStats.variants).map(([variant, stats]) => (
                <VariantCard
                  key={variant}
                  variant={variant}
                  stats={stats}
                />
              ))}
            </div>

            {/* Insights */}
            {abTestStats.totalViews > 0 && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Analysis Status
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {abTestStats.totalViews < 100 && (
                    <>Need ~{100 - abTestStats.totalViews} more views per variant for initial insights</>
                  )}
                  {abTestStats.totalViews >= 100 && abTestStats.totalViews < 1000 && (
                    <>Need ~{1000 - abTestStats.totalViews} more views for statistical significance</>
                  )}
                  {abTestStats.totalViews >= 1000 && (
                    <>✅ Statistical significance achieved! Ready to select winning variant.</>
                  )}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Empty State */}
        {!summary && !abTestStats && (
          <div className="text-center py-12">
            <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analytics Data Yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Data will appear as users interact with the app
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className={color}>{icon}</div>}
        <h3 className="text-sm text-gray-600 dark:text-gray-400">{title}</h3>
      </div>
      <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Variant Card Component
function VariantCard({
  variant,
  stats,
}: {
  variant: string;
  stats: {
    views: number;
    clicks: number;
    clickRate: number;
    deviceBreakdown: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
}) {
  const getVariantInfo = (variant: string) => {
    switch (variant) {
      case 'control':
        return { name: 'Control', icon: '✓', color: 'green' };
      case 'variantA':
        return { name: 'Variant A', icon: '⭐', color: 'yellow' };
      case 'variantB':
        return { name: 'Variant B', icon: '👥', color: 'blue' };
      case 'variantC':
        return { name: 'Variant C', icon: '🛡️', color: 'purple' };
      default:
        return { name: variant, icon: '?', color: 'gray' };
    }
  };

  const info = getVariantInfo(variant);
  const totalDeviceViews = stats.deviceBreakdown.mobile + stats.deviceBreakdown.tablet + stats.deviceBreakdown.desktop;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-800 hover:border-accent transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{info.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold">{info.name}</h3>
          <p className="text-xs text-gray-500">Cache Indicator Design</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
            <span className="font-semibold">{stats.views}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Clicks</span>
            <span className="font-semibold">{stats.clicks}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Click Rate</span>
            <span className="font-bold text-lg">{stats.clickRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`bg-${info.color}-600 h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(stats.clickRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Device Breakdown */}
        {totalDeviceViews > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Device Breakdown</p>
            <div className="space-y-1.5">
              <DeviceBar
                label="📱 Mobile"
                count={stats.deviceBreakdown.mobile}
                total={totalDeviceViews}
                color="blue"
              />
              <DeviceBar
                label="💻 Desktop"
                count={stats.deviceBreakdown.desktop}
                total={totalDeviceViews}
                color="green"
              />
              <DeviceBar
                label="📟 Tablet"
                count={stats.deviceBreakdown.tablet}
                total={totalDeviceViews}
                color="purple"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Device Breakdown Bar
function DeviceBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{label}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`bg-${color}-600 h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{count}</span>
    </div>
  );
}
