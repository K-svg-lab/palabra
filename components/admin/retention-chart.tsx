/**
 * Retention Chart Component (Phase 18.2.4)
 * 
 * Visualizes user retention cohorts over time.
 * Shows Day 1, 7, 30, and 90 retention rates with trend lines.
 * 
 * @module components/admin/retention-chart
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface RetentionMetrics {
  cohortDate: string;
  totalUsers: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  day90Retention: number;
  avgAccuracy: number;
  avgSessionsPerUser: number;
  avgWordsPerUser: number;
}

interface RetentionChartProps {
  data: RetentionMetrics[];
  variant?: 'line' | 'area';
  height?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RetentionChart({ 
  data, 
  variant = 'area',
  height = 400,
}: RetentionChartProps) {
  // Format data for chart
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: new Date(item.cohortDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: item.cohortDate,
      'Day 1': Math.round(item.day1Retention * 100),
      'Day 7': Math.round(item.day7Retention * 100),
      'Day 30': Math.round(item.day30Retention * 100),
      'Day 90': Math.round(item.day90Retention * 100),
      users: item.totalUsers,
    }));
  }, [data]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (data.length === 0) return null;

    const avgDay1 =
      data.reduce((sum, d) => sum + d.day1Retention, 0) / data.length;
    const avgDay7 =
      data.reduce((sum, d) => sum + d.day7Retention, 0) / data.length;
    const avgDay30 =
      data.reduce((sum, d) => sum + d.day30Retention, 0) / data.length;
    const avgDay90 =
      data.reduce((sum, d) => sum + d.day90Retention, 0) / data.length;

    return {
      day1: Math.round(avgDay1 * 100),
      day7: Math.round(avgDay7 * 100),
      day30: Math.round(avgDay30 * 100),
      day90: Math.round(avgDay90 * 100),
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No retention data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Day 1"
            value={`${summary.day1}%`}
            color="blue"
          />
          <SummaryCard
            label="Day 7"
            value={`${summary.day7}%`}
            color="purple"
          />
          <SummaryCard
            label="Day 30"
            value={`${summary.day30}%`}
            color="green"
          />
          <SummaryCard
            label="Day 90"
            value={`${summary.day90}%`}
            color="orange"
          />
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Retention Trends
        </h3>

        <ResponsiveContainer width="100%" height={height}>
          {variant === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDay1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDay7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDay30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDay90" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                label={{
                  value: 'Retention %',
                  angle: -90,
                  position: 'insideLeft',
                  className: 'text-gray-600 dark:text-gray-400',
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Day 1"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorDay1)"
              />
              <Area
                type="monotone"
                dataKey="Day 7"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorDay7)"
              />
              <Area
                type="monotone"
                dataKey="Day 30"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#colorDay30)"
              />
              <Area
                type="monotone"
                dataKey="Day 90"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#colorDay90)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                label={{
                  value: 'Retention %',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Day 1"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Day 7"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Day 30"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Day 90"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      <div className="space-y-1 text-xs">
        <p className="text-gray-500 dark:text-gray-400">
          Users: {data.users}
        </p>
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              {item.dataKey}:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY CARD
// ============================================================================

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
  };

  return (
    <div
      className={`rounded-xl p-4 border ${colorClasses[color]}`}
    >
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-60 mt-1">Avg Retention</div>
    </div>
  );
}
