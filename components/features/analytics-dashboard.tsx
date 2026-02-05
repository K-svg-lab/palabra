/**
 * Analytics Dashboard Component
 * 
 * Displays analytics data for word lookups, cache performance, and API usage.
 * Phase 16.2 - Infrastructure & Developer Experience
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Database, Check, X } from 'lucide-react';

interface AnalyticsData {
  period: {
    daysBack: number;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalLookups: number;
    totalSaves: number;
    saveRate: number;
    cacheHitRate: number;
    avgResponseTime: number;
    totalApiCalls: number;
    apiCallsSaved: number;
  };
  popularWords: Array<{
    word: string;
    count: number;
    saveRate: number;
  }>;
  apiPerformance: Array<{
    apiName: string;
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    rateLimitedCount: number;
  }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [daysBack]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics?daysBack=${daysBack}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, popularWords, apiPerformance } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500">
            Last {daysBack} days • Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDaysBack(days)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                daysBack === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Lookups */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Lookups</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">{overview.totalLookups.toLocaleString()}</div>
            <div className="mt-1 text-sm text-gray-500">{overview.totalSaves} saved ({overview.saveRate}%)</div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Cache Hit Rate</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">{overview.cacheHitRate}%</div>
            <div className="mt-1 text-sm text-gray-500">
              {overview.apiCallsSaved} API calls saved
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Avg Response</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">{overview.avgResponseTime}ms</div>
            <div className="mt-1 text-sm text-gray-500">
              {overview.totalApiCalls} API calls total
            </div>
          </div>
        </div>

        {/* Save Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-600">Save Rate</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900">{overview.saveRate}%</div>
            <div className="mt-1 text-sm text-gray-500">
              Users save {overview.totalSaves}/{overview.totalLookups} lookups
            </div>
          </div>
        </div>
      </div>

      {/* Popular Words */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Most Popular Words</h3>
        <div className="space-y-2">
          {popularWords.slice(0, 10).map((word, index) => (
            <div
              key={word.word}
              className="flex items-center justify-between border-b border-gray-100 pb-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{word.word}</div>
                  <div className="text-xs text-gray-500">{word.count} lookups</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">{Math.round(word.saveRate * 100)}% saved</div>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${word.saveRate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Performance */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">API Performance</h3>
        <div className="space-y-3">
          {apiPerformance.map((api) => (
            <div key={api.apiName} className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900">{api.apiName}</div>
                  {api.successRate >= 0.95 ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-gray-500">
                  <span>{api.totalCalls} calls</span>
                  <span>{Math.round(api.successRate * 100)}% success</span>
                  <span>{Math.round(api.avgResponseTime)}ms avg</span>
                  {api.rateLimitedCount > 0 && (
                    <span className="text-orange-600">{api.rateLimitedCount} rate limited</span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full ${
                      api.successRate >= 0.95 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${api.successRate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">💡 Performance Insights</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          {overview.cacheHitRate > 20 && (
            <li>
              • Cache is working well! {overview.cacheHitRate}% of lookups are served from cache,
              saving {overview.apiCallsSaved} API calls.
            </li>
          )}
          {overview.cacheHitRate < 10 && overview.totalLookups > 50 && (
            <li>
              • Low cache hit rate ({overview.cacheHitRate}%). Consider adding more words to the
              verified vocabulary cache.
            </li>
          )}
          {overview.saveRate > 50 && (
            <li>• High save rate ({overview.saveRate}%)! Users find the translations valuable.</li>
          )}
          {overview.avgResponseTime < 500 && (
            <li>
              • Excellent response time ({overview.avgResponseTime}ms). The app feels fast!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
