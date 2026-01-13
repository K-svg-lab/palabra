/**
 * Historical reports components
 * Phase 11: Weekly/Monthly/Yearly reports
 */

'use client';

import { formatStudyTime } from '@/lib/utils/progress';
import { TrendLineChart, BarChartEnhanced, StatCard } from './charts';
import type { WeeklyReport, MonthlyReport, YearInReview } from '@/lib/types';

/**
 * Weekly report component
 */
interface WeeklyReportCardProps {
  report: WeeklyReport;
  previousReport?: WeeklyReport;
}

export function WeeklyReportCard({ report, previousReport }: WeeklyReportCardProps) {
  const getComparison = (current: number, previous: number) => {
    if (!previousReport || previous === 0) return undefined;
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    return {
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'stable' as const,
      value: Math.abs(percent),
      label: 'vs last week',
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Week {report.weekNumber}, {report.year}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
        </p>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Words Added"
          value={report.newWordsAdded}
          trend={previousReport ? getComparison(report.newWordsAdded, previousReport.newWordsAdded) : undefined}
        />
        <StatCard
          title="Reviews"
          value={report.totalReviews}
          trend={previousReport ? getComparison(report.totalReviews, previousReport.totalReviews) : undefined}
        />
        <StatCard
          title="Avg Accuracy"
          value={`${report.averageAccuracy}%`}
          trend={previousReport ? getComparison(report.averageAccuracy, previousReport.averageAccuracy) : undefined}
        />
        <StatCard
          title="Study Time"
          value={formatStudyTime(report.totalStudyTime)}
          subtitle={`${report.activeDays} active days`}
        />
      </div>
      
      {/* Daily breakdown chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Daily Activity</h4>
        <TrendLineChart
          data={report.dailyBreakdown.map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            reviews: d.cardsReviewed,
            accuracy: d.accuracy,
          }))}
          lines={[
            { dataKey: 'reviews', name: 'Cards Reviewed', color: '#007aff' },
            { dataKey: 'accuracy', name: 'Accuracy %', color: '#34c759', strokeDasharray: '5 5' },
          ]}
          xDataKey="date"
          height={250}
          showLegend={true}
        />
      </div>
      
      {/* Most productive day */}
      {report.mostProductiveDay && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-medium">Most Productive Day</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(report.mostProductiveDay).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Monthly report component
 */
interface MonthlyReportCardProps {
  report: MonthlyReport;
  previousReport?: MonthlyReport;
}

export function MonthlyReportCard({ report, previousReport }: MonthlyReportCardProps) {
  const monthName = new Date(report.startDate).toLocaleDateString('en-US', { month: 'long' });
  
  const getComparison = (current: number, previous: number) => {
    if (!previousReport || previous === 0) return undefined;
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    return {
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'stable' as const,
      value: Math.abs(percent),
      label: 'vs last month',
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{monthName} {report.year}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monthly Summary
        </p>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Words Added"
          value={report.newWordsAdded}
          trend={previousReport ? getComparison(report.newWordsAdded, previousReport.newWordsAdded) : undefined}
        />
        <StatCard
          title="Total Reviews"
          value={report.totalReviews}
          trend={previousReport ? getComparison(report.totalReviews, previousReport.totalReviews) : undefined}
        />
        <StatCard
          title="Avg Accuracy"
          value={`${report.averageAccuracy}%`}
          trend={previousReport ? getComparison(report.averageAccuracy, previousReport.averageAccuracy) : undefined}
        />
        <StatCard
          title="Study Time"
          value={formatStudyTime(report.totalStudyTime)}
          subtitle={`${report.activeDays} active days`}
        />
      </div>
      
      {/* Weekly breakdown chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Weekly Progress</h4>
        <BarChartEnhanced
          data={report.weeklyBreakdown.map((w, idx) => ({
            week: `Week ${idx + 1}`,
            reviews: w.cardsReviewed,
            accuracy: w.accuracy,
          }))}
          bars={[
            { dataKey: 'reviews', name: 'Cards Reviewed', color: '#007aff' },
          ]}
          xDataKey="week"
          height={250}
        />
      </div>
    </div>
  );
}

/**
 * Year in review component
 */
interface YearInReviewCardProps {
  yearInReview: YearInReview;
}

export function YearInReviewCard({ yearInReview }: YearInReviewCardProps) {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">{yearInReview.year}</h2>
          <p className="text-xl opacity-90">Your Year in Review</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="text-center">
            <div className="text-3xl font-bold">{yearInReview.totalWords}</div>
            <div className="text-sm opacity-80">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{yearInReview.totalReviews.toLocaleString()}</div>
            <div className="text-sm opacity-80">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatStudyTime(yearInReview.totalStudyTime)}</div>
            <div className="text-sm opacity-80">Study Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{yearInReview.averageAccuracy}%</div>
            <div className="text-sm opacity-80">Accuracy</div>
          </div>
        </div>
      </div>
      
      {/* Top achievements */}
      {yearInReview.topAchievements.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-4">🏆 Top Achievements</h3>
          <div className="grid gap-3">
            {yearInReview.topAchievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg"
              >
                <span className="text-2xl">⭐</span>
                <span className="font-medium">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Monthly breakdown chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
        <TrendLineChart
          data={yearInReview.monthlyData.map(m => ({
            month: new Date(yearInReview.year, m.month - 1).toLocaleDateString('en-US', { month: 'short' }),
            words: m.wordsAdded,
            reviews: m.reviews,
          }))}
          lines={[
            { dataKey: 'words', name: 'Words Added', color: '#007aff' },
            { dataKey: 'reviews', name: 'Reviews', color: '#34c759' },
          ]}
          xDataKey="month"
          height={300}
          showLegend={true}
        />
      </div>
      
      {/* Most productive month */}
      {yearInReview.mostProductiveMonth && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚀</span>
            <div>
              <div className="text-lg font-semibold">Most Productive Month</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {yearInReview.mostProductiveMonth}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Streak highlight */}
      {yearInReview.longestStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <div>
              <div className="text-lg font-semibold">Longest Streak</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {yearInReview.longestStreak} consecutive days
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Report selector component
 */
interface ReportSelectorProps {
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export function ReportSelector({ selectedPeriod, onPeriodChange }: ReportSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <button
        onClick={() => onPeriodChange('week')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          selectedPeriod === 'week'
            ? 'bg-white dark:bg-gray-800 text-accent shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => onPeriodChange('month')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          selectedPeriod === 'month'
            ? 'bg-white dark:bg-gray-800 text-accent shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onPeriodChange('year')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          selectedPeriod === 'year'
            ? 'bg-white dark:bg-gray-800 text-accent shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        Year in Review
      </button>
    </div>
  );
}

