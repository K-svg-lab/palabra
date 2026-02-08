/**
 * AI Cost Control Service (Phase 18.1.3)
 * 
 * Tracks and limits OpenAI API spending to prevent budget overruns.
 * Provides fallback mechanisms when budget limits are reached.
 * 
 * Features:
 * - Monthly budget tracking ($50 default)
 * - Cost estimation before API calls
 * - Automatic fallback to templates when budget exceeded
 * - Cost analytics and reporting
 * 
 * @see lib/services/ai-example-generator.ts
 */

import { prisma } from '@/lib/backend/db';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONTHLY_BUDGET_USD = 50; // $50 per month
const COST_PER_1K_TOKENS = 0.002; // GPT-3.5-turbo pricing
const AVG_TOKENS_PER_EXAMPLE = 150; // Estimated tokens per example generation
const BUFFER_PERCENTAGE = 0.9; // Stop at 90% of budget

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CostReport {
  monthlyBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  totalCalls: number;
  canMakeRequest: boolean;
  estimatedCallsRemaining: number;
}

export interface AICallRecord {
  service: string; // "openai"
  model: string; // "gpt-3.5-turbo"
  tokensUsed: number;
  costUSD: number;
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// COST TRACKING
// ============================================================================

/**
 * Check if we can make an AI API call within budget
 */
export async function canMakeAICall(): Promise<boolean> {
  const report = await getCurrentMonthCostReport();
  return report.canMakeRequest;
}

/**
 * Get current month's cost report
 */
export async function getCurrentMonthCostReport(): Promise<CostReport> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Get all AI costs for current month
  const costs = await prisma.aICostEvent.findMany({
    where: {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      cost: true,
    },
  });

  const currentSpend = costs.reduce((sum, c) => sum + c.cost, 0);
  const remainingBudget = MONTHLY_BUDGET_USD - currentSpend;
  const percentageUsed = (currentSpend / MONTHLY_BUDGET_USD) * 100;
  const canMakeRequest = currentSpend < MONTHLY_BUDGET_USD * BUFFER_PERCENTAGE;

  const estimatedCostPerCall = (AVG_TOKENS_PER_EXAMPLE / 1000) * COST_PER_1K_TOKENS;
  const estimatedCallsRemaining = Math.floor(remainingBudget / estimatedCostPerCall);

  return {
    monthlyBudget: MONTHLY_BUDGET_USD,
    currentSpend,
    remainingBudget,
    percentageUsed,
    totalCalls: costs.length,
    canMakeRequest,
    estimatedCallsRemaining: Math.max(0, estimatedCallsRemaining),
  };
}

/**
 * Record an AI API call cost
 */
export async function recordAICost(data: {
  service: string;
  model: string;
  endpoint?: string;
  tokensUsed: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}): Promise<void> {
  const costUSD = (data.tokensUsed / 1000) * COST_PER_1K_TOKENS;

  await prisma.aICostEvent.create({
    data: {
      service: data.service,
      model: data.model,
      endpoint: data.endpoint || 'chat/completions',
      tokensUsed: data.tokensUsed,
      cost: costUSD,
      success: data.success,
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || null,
    },
  });

  // Log warning if approaching budget
  const report = await getCurrentMonthCostReport();
  if (report.percentageUsed > 80) {
    console.warn(
      `[AI Cost Control] WARNING: ${report.percentageUsed.toFixed(1)}% of monthly budget used. ` +
      `$${report.currentSpend.toFixed(2)} / $${report.monthlyBudget.toFixed(2)}`
    );
  }

  if (!report.canMakeRequest) {
    console.error(
      `[AI Cost Control] BUDGET EXCEEDED: Monthly budget of $${report.monthlyBudget} reached. ` +
      `Fallback to templates activated.`
    );
  }
}

/**
 * Estimate cost for a given prompt
 */
export function estimateTokens(prompt: string): number {
  // Simple estimation: ~4 characters per token for English/Spanish
  // This is approximate - actual tokenization varies
  return Math.ceil(prompt.length / 4);
}

/**
 * Estimate cost in USD for a request
 */
export function estimateCostUSD(estimatedTokens: number): number {
  return (estimatedTokens / 1000) * COST_PER_1K_TOKENS;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get cost breakdown by service/model
 */
export async function getCostBreakdown(days: number = 30): Promise<{
  byService: { service: string; totalCost: number; totalCalls: number }[];
  byModel: { model: string; totalCost: number; totalCalls: number }[];
  dailySpend: { date: string; cost: number; calls: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const costs = await prisma.aICostEvent.findMany({
    where: {
      createdAt: { gte: since },
    },
    select: {
      service: true,
      model: true,
      cost: true,
      createdAt: true,
    },
  });

  // By service
  const serviceMap = new Map<string, { totalCost: number; totalCalls: number }>();
  for (const cost of costs) {
    if (!serviceMap.has(cost.service)) {
      serviceMap.set(cost.service, { totalCost: 0, totalCalls: 0 });
    }
    const stats = serviceMap.get(cost.service)!;
    stats.totalCost += cost.cost;
    stats.totalCalls++;
  }

  // By model
  const modelMap = new Map<string, { totalCost: number; totalCalls: number }>();
  for (const cost of costs) {
    if (!modelMap.has(cost.model)) {
      modelMap.set(cost.model, { totalCost: 0, totalCalls: 0 });
    }
    const stats = modelMap.get(cost.model)!;
    stats.totalCost += cost.cost;
    stats.totalCalls++;
  }

  // By day
  const dayMap = new Map<string, { cost: number; calls: number }>();
  for (const cost of costs) {
    const day = cost.createdAt.toISOString().split('T')[0];
    if (!dayMap.has(day)) {
      dayMap.set(day, { cost: 0, calls: 0 });
    }
    const stats = dayMap.get(day)!;
    stats.cost += cost.cost;
    stats.calls++;
  }

  return {
    byService: Array.from(serviceMap.entries()).map(([service, stats]) => ({
      service,
      ...stats,
    })),
    byModel: Array.from(modelMap.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    })),
    dailySpend: Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Get total spend for current month
 */
export async function getMonthlySpend(): Promise<number> {
  const report = await getCurrentMonthCostReport();
  return report.currentSpend;
}

/**
 * Check if budget warning threshold reached (80%)
 */
export async function isBudgetWarning(): Promise<boolean> {
  const report = await getCurrentMonthCostReport();
  return report.percentageUsed >= 80;
}

/**
 * Reset monthly costs (for testing/admin)
 * WARNING: Use with caution
 */
export async function resetMonthlyCosts(): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.aICostEvent.deleteMany({
    where: {
      createdAt: { gte: monthStart },
    },
  });

  console.log('[AI Cost Control] Monthly costs reset');
}
