/**
 * Enhanced chart components using Recharts
 * Phase 11: Data visualization improvements
 */

'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Line chart for trends
 */
interface TrendLineChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
    strokeDasharray?: string;
  }[];
  xDataKey: string;
  height?: number;
  showLegend?: boolean;
}

export function TrendLineChart({
  data,
  lines,
  xDataKey,
  height = 300,
  showLegend = false,
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
        <XAxis 
          dataKey={xDataKey} 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.strokeDasharray}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Area chart for cumulative data
 */
interface AreaChartEnhancedProps {
  data: any[];
  areas: {
    dataKey: string;
    name: string;
    color: string;
    fillOpacity?: number;
  }[];
  xDataKey: string;
  height?: number;
  showLegend?: boolean;
}

export function AreaChartEnhanced({
  data,
  areas,
  xDataKey,
  height = 300,
  showLegend = false,
}: AreaChartEnhancedProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
        <XAxis 
          dataKey={xDataKey} 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {areas.map((area, index) => (
          <Area
            key={index}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stroke={area.color}
            fill={area.color}
            fillOpacity={area.fillOpacity || 0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Bar chart for comparisons
 */
interface BarChartEnhancedProps {
  data: any[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xDataKey: string;
  height?: number;
  showLegend?: boolean;
}

export function BarChartEnhanced({
  data,
  bars,
  xDataKey,
  height = 300,
  showLegend = false,
}: BarChartEnhancedProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
        <XAxis 
          dataKey={xDataKey} 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs fill-gray-600 dark:fill-gray-400"
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Activity heatmap component
 */
interface HeatmapProps {
  data: {
    date: string;
    value: number;
    cardsReviewed: number;
  }[];
  weeks?: number;
}

export function ActivityHeatmap({ data, weeks = 26 }: HeatmapProps) {
  // Group data by week
  const weekData: { [key: string]: typeof data } = {};
  
  data.forEach((day) => {
    const date = new Date(day.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    
    if (!weekData[weekKey]) {
      weekData[weekKey] = [];
    }
    weekData[weekKey].push(day);
  });
  
  // Get last N weeks
  const weekKeys = Object.keys(weekData).slice(-weeks);
  
  // Color scale for activity levels
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-900';
    if (value === 1) return 'bg-green-200 dark:bg-green-900/30';
    if (value === 2) return 'bg-green-400 dark:bg-green-700/50';
    if (value === 3) return 'bg-green-600 dark:bg-green-600/70';
    return 'bg-green-700 dark:bg-green-500';
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1 min-w-max">
        {weekKeys.map((weekKey) => (
          <div key={weekKey} className="flex flex-col gap-1">
            {weekData[weekKey].slice(0, 7).map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${getColor(day.value)} transition-all hover:ring-2 hover:ring-accent hover:scale-125 cursor-pointer`}
                title={`${day.date}: ${day.cardsReviewed} cards reviewed`}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-900" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/30" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/50" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-600/70" />
          <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

/**
 * Stat card with trend indicator
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, color = 'text-accent' }: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return '↑';
    if (trend.direction === 'down') return '↓';
    return '→';
  };
  
  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'text-green-600 dark:text-green-400';
    if (trend.direction === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
        {icon && <div className={color}>{icon}</div>}
      </div>
      
      <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</div>
      )}
      
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
          <span className="font-medium">{getTrendIcon()} {Math.abs(trend.value)}%</span>
          <span className="text-xs text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Progress ring component
 */
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#007aff',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <div className="text-2xl font-bold">{label}</div>}
        {sublabel && <div className="text-xs text-gray-600 dark:text-gray-400">{sublabel}</div>}
      </div>
    </div>
  );
}

/**
 * Milestone progress component
 */
interface MilestoneProgressProps {
  milestones: {
    days: number;
    label: string;
    emoji: string;
    achieved: boolean;
  }[];
  currentStreak: number;
}

export function MilestoneProgress({ milestones, currentStreak }: MilestoneProgressProps) {
  return (
    <div className="space-y-3">
      {milestones.map((milestone, index) => {
        const progress = Math.min((currentStreak / milestone.days) * 100, 100);
        
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">{milestone.emoji}</span>
                <span className={milestone.achieved ? 'font-medium' : 'text-gray-600 dark:text-gray-400'}>
                  {milestone.label}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {milestone.achieved ? '✓ Achieved' : `${milestone.days - currentStreak} days to go`}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  milestone.achieved 
                    ? 'bg-green-600 dark:bg-green-500' 
                    : 'bg-accent'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

