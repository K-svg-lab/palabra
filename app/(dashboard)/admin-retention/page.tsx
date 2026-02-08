/**
 * Simple Admin Retention Dashboard (Phase 18.1.2)
 * View retention analytics and test API endpoints
 * 
 * Access at: http://localhost:3000/admin-retention
 */

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Users, Target, AlertCircle } from 'lucide-react';

export default function AdminRetentionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'methods' | 'at-risk'>('trends');
  
  const [trends, setTrends] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [atRiskUsers, setAtRiskUsers] = useState<any[]>([]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/retention?type=trends&days=7');
      if (!response.ok) throw new Error('Failed to fetch trends');
      const data = await response.json();
      setTrends(data.trends || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/retention?type=methods&days=30');
      if (!response.ok) throw new Error('Failed to fetch methods');
      const data = await response.json();
      setMethods(data.performance || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAtRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/retention?type=at-risk');
      if (!response.ok) throw new Error('Failed to fetch at-risk users');
      const data = await response.json();
      setAtRiskUsers(data.atRiskUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') fetchTrends();
    if (activeTab === 'methods') fetchMethods();
    if (activeTab === 'at-risk') fetchAtRisk();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Retention Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phase 18.1.2 - Admin Dashboard
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'trends') fetchTrends();
              if (activeTab === 'methods') fetchMethods();
              if (activeTab === 'at-risk') fetchAtRisk();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'trends'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Retention Trends
            </div>
          </button>
          <button
            onClick={() => setActiveTab('methods')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'methods'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Method Performance
            </div>
          </button>
          <button
            onClick={() => setActiveTab('at-risk')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'at-risk'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              At-Risk Users
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Retention Trends */}
              {activeTab === 'trends' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Last 7 Days</h2>
                  {trends.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No retention data available yet. Users need to sign up and be active for data to appear.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Users</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Day 1</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Day 7</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Day 30</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {trends.map((trend, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{trend.cohortDate}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{trend.totalUsers}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                {(trend.day1Retention * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                {(trend.day7Retention * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                {(trend.day30Retention * 100).toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                {(trend.avgAccuracy * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Method Performance */}
              {activeTab === 'methods' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Last 30 Days</h2>
                  {methods.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No review method data available yet. Users need to complete reviews for data to appear.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {methods.map((method, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {method.method.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {method.totalAttempts} attempts • {method.avgResponseTime}ms avg
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {(method.accuracy * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Difficulty: {method.difficultyMultiplier.toFixed(1)}x
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* At-Risk Users */}
              {activeTab === 'at-risk' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">
                    At-Risk Users ({atRiskUsers.length})
                  </h2>
                  {atRiskUsers.length === 0 ? (
                    <p className="text-green-600 dark:text-green-400 text-center py-8">
                      ✨ No users at risk! All users are active.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {atRiskUsers.map((user, idx) => (
                        <div
                          key={idx}
                          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                {user.userId.substring(0, 8)}...
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Last active: {new Date(user.lastActiveAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user.totalSessions} sessions • {user.totalReviews} reviews
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.daysSinceSignup} days since signup
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* API Endpoints Reference */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📡 Available API Endpoints
          </h3>
          <div className="space-y-1 text-sm font-mono text-blue-700 dark:text-blue-300">
            <div>GET /api/analytics/retention?type=trends&days=30</div>
            <div>GET /api/analytics/retention?type=cohort&cohortDate=2026-02-08</div>
            <div>GET /api/analytics/retention?type=weekly&week=2026-W06</div>
            <div>GET /api/analytics/retention?type=methods&days=30</div>
            <div>GET /api/analytics/retention?type=at-risk</div>
            <div>POST /api/analytics/activity (body: userId, action, timestamp)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
