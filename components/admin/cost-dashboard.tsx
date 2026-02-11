/**
 * Cost Dashboard Component (Phase 18.2.4)
 * 
 * Visualizes AI API costs and budget tracking.
 * Shows daily spend, service breakdown, and budget warnings.
 * 
 * @module components/admin/cost-dashboard
 */

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CostReport {
  monthlyBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  totalCalls: number;
  canMakeRequest: boolean;
  estimatedCallsRemaining: number;
}

interface CostBreakdown {
  byService: { service: string; totalCost: number; totalCalls: number }[];
  byModel: { model: string; totalCost: number; totalCalls: number }[];
  dailySpend: { date: string; cost: number; calls: number }[];
}

interface CostDashboardProps {
  costReport: CostReport;
  costBreakdown: CostBreakdown;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CostDashboard({ costReport, costBreakdown }: CostDashboardProps) {
  // Format daily spend for chart
  const dailySpendData = useMemo(() => {
    return costBreakdown.dailySpend.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      cost: parseFloat(item.cost.toFixed(2)),
      calls: item.calls,
    }));
  }, [costBreakdown.dailySpend]);

  // Format service breakdown for pie chart
  const serviceData = useMemo(() => {
    return costBreakdown.byService.map((item) => ({
      name: item.service,
      value: parseFloat(item.totalCost.toFixed(2)),
      calls: item.totalCalls,
    }));
  }, [costBreakdown.byService]);

  // Get budget status
  const budgetStatus = useMemo(() => {
    const percentage = costReport.percentageUsed;
    if (percentage >= 90) return { status: 'critical', color: 'red' };
    if (percentage >= 75) return { status: 'warning', color: 'orange' };
    return { status: 'healthy', color: 'green' };
  }, [costReport.percentageUsed]);

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetCard
          label="Monthly Budget"
          value={`$${costReport.monthlyBudget.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <BudgetCard
          label="Current Spend"
          value={`$${costReport.currentSpend.toFixed(2)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color={budgetStatus.color as any}
          subtitle={`${costReport.percentageUsed.toFixed(1)}% used`}
        />
        <BudgetCard
          label="Remaining"
          value={`$${costReport.remainingBudget.toFixed(2)}`}
          icon={budgetStatus.status === 'healthy' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          color={budgetStatus.color as any}
        />
        <BudgetCard
          label="Total API Calls"
          value={costReport.totalCalls.toString()}
          subtitle={`~${costReport.estimatedCallsRemaining} remaining`}
          color="gray"
        />
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Usage
          </h3>
          <span className={`text-sm font-medium ${
            budgetStatus.status === 'critical'
              ? 'text-red-600'
              : budgetStatus.status === 'warning'
              ? 'text-orange-600'
              : 'text-green-600'
          }`}>
            {costReport.percentageUsed.toFixed(1)}%
          </span>
        </div>
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
              budgetStatus.status === 'critical'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : budgetStatus.status === 'warning'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}
            style={{ width: `${Math.min(costReport.percentageUsed, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>$0</span>
          <span>${costReport.monthlyBudget.toFixed(2)}</span>
        </div>

        {/* Warning banner */}
        {budgetStatus.status !== 'healthy' && (
          <div className={`mt-4 p-3 rounded-lg border ${
            budgetStatus.status === 'critical'
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 mt-0.5 ${
                budgetStatus.status === 'critical' ? 'text-red-600' : 'text-orange-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  budgetStatus.status === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'
                }`}>
                  {budgetStatus.status === 'critical'
                    ? 'Budget Almost Exceeded'
                    : 'Budget Warning'}
                </p>
                <p className={`text-xs ${
                  budgetStatus.status === 'critical' ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'
                } mt-1`}>
                  {budgetStatus.status === 'critical'
                    ? 'AI features may fall back to templates soon.'
                    : 'Consider monitoring usage more closely.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Spend Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Spend (Last {dailySpendData.length} Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailySpendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              className="text-xs text-gray-600 dark:text-gray-400"
            />
            <YAxis
              className="text-xs text-gray-600 dark:text-gray-400"
              label={{
                value: 'Cost ($)',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip content={<DailySpendTooltip />} />
            <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Service Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost by Service
          </h3>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No service data available
            </div>
          )}
        </div>

        {/* Service/Model Breakdown Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost Breakdown
          </h3>
          <div className="space-y-3">
            {costBreakdown.byService.map((item) => (
              <div
                key={item.service}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {item.totalCalls} calls
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    ${item.totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ${(item.totalCost / item.totalCalls).toFixed(4)}/call
                  </div>
                </div>
              </div>
            ))}
            {costBreakdown.byService.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No cost data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BUDGET CARD
// ============================================================================

function BudgetCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'gray';
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    gray: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium opacity-70">{label}</div>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-xs opacity-60 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

// ============================================================================
// CUSTOM TOOLTIPS
// ============================================================================

function DailySpendTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {data.date}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-300">Cost:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${data.cost.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-300">Calls:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {data.calls}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-300">Avg:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${(data.cost / data.calls).toFixed(4)}/call
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
