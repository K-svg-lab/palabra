/**
 * Enhanced Trend Chart Component
 * Beautiful animated charts with Recharts, inspired by Apple Health
 * 
 * Features:
 * - Smooth animations
 * - Gradient fills
 * - Interactive tooltips
 * - Trend indicators
 * - Responsive design
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface TrendChartEnhancedProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  title: string;
  subtitle?: string;
  color?: string;
  gradient?: { from: string; to: string };
  chartType?: 'line' | 'area' | 'bar';
  height?: number;
  showGrid?: boolean;
  showTrend?: boolean;
}

export function TrendChartEnhanced({
  data,
  dataKey,
  xAxisKey = 'date',
  title,
  subtitle,
  color = '#007AFF',
  gradient,
  chartType = 'area',
  height = 250,
  showGrid = false,
  showTrend = true,
}: TrendChartEnhancedProps) {
  // Calculate trend
  const trend = calculateTrend(data, dataKey);

  const gradientId = `gradient-${dataKey}`;
  const gradientColors = gradient || {
    from: color,
    to: adjustColorOpacity(color, 0.1),
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColors.from} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientColors.to} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              itemStyle={{ color: color }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        ) : chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Trend indicator */}
      {showTrend && (
        <div className="flex items-center gap-2 mt-4 text-sm">
          <span
            className={`font-medium ${
              trend > 0
                ? 'text-green-600 dark:text-green-400'
                : trend < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {trend > 0 ? '↗ Trending up' : trend < 0 ? '↘ Trending down' : '→ Steady'}
          </span>
          {trend !== 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              · {Math.abs(trend)}% change
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Calculate trend percentage between recent data and older data
 */
function calculateTrend(data: any[], dataKey: string): number {
  if (!data || data.length < 2) return 0;

  // Compare last value to average of previous values
  const lastValue = data[data.length - 1]?.[dataKey] || 0;
  const previousValues = data.slice(0, -1).map((d) => d[dataKey] || 0);
  const average =
    previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length || 1;

  if (average === 0) return 0;

  const change = ((lastValue - average) / average) * 100;
  return Math.round(change);
}

/**
 * Adjust color opacity (simple hex color support)
 */
function adjustColorOpacity(color: string, opacity: number): string {
  // If it's a hex color, convert to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * Mini sparkline for inline stats
 */
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({
  data,
  color = '#007AFF',
  height = 40,
  width = 100,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
