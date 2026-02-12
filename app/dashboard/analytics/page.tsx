/**
 * Advanced Analytics Page
 * Phase 11: Enhanced Progress & Statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { getAllReviews } from '@/lib/db/reviews';
import { getAllStats, getRecentStats } from '@/lib/db/stats';
import type { VocabularyWord } from '@/lib/types/vocabulary';
import {
  calculateLearningVelocity,
  calculateRetentionMetrics,
  calculateStreakData,
  calculateAccuracyTrend,
  calculateVelocityTrend,
  generateHeatmapData,
  calculatePersonalRecords,
  generateWeeklyReport,
  generateMonthlyReport,
  generateYearInReview,
} from '@/lib/utils/analytics';
import { StatCard, TrendLineChart, AreaChartEnhanced } from '@/components/features/charts';
import { StreakTracker, StreakWidget } from '@/components/features/streak-tracker';
import { 
  WeeklyReportCard, 
  MonthlyReportCard, 
  YearInReviewCard,
  ReportSelector 
} from '@/components/features/historical-reports';
import type { 
  LearningVelocity,
  RetentionMetrics,
  StreakData,
  PersonalRecord,
  WeeklyReport,
  MonthlyReport,
  YearInReview,
} from '@/lib/types';

export default function AnalyticsPage() {
  const { data: allWords } = useVocabulary();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'streak' | 'reports'>('overview');
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  // Analytics data
  const [learningVelocity, setLearningVelocity] = useState<LearningVelocity | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [accuracyTrend, setAccuracyTrend] = useState<any[]>([]);
  const [velocityTrend, setVelocityTrend] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  
  // Report data
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearInReview, setYearInReview] = useState<YearInReview | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      
      try {
        if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
          setIsLoading(false);
          return;
        }

        const [reviews, allStats] = await Promise.all([
          getAllReviews(),
          getAllStats(),
        ]);

        // Calculate advanced metrics
        const velocity = calculateLearningVelocity(allStats, allWords);
        const retention = calculateRetentionMetrics(allWords, reviews);
        const streak = calculateStreakData(allStats);
        const accuracyData = calculateAccuracyTrend(allStats, 30);
        const velocityData = calculateVelocityTrend(allStats, allWords);
        const heatmap = generateHeatmapData(allStats, 180);
        const records = calculatePersonalRecords(allStats, allWords);
        
        setLearningVelocity(velocity);
        setRetentionMetrics(retention);
        setStreakData(streak);
        setAccuracyTrend(accuracyData);
        setVelocityTrend(velocityData);
        setHeatmapData(heatmap);
        setPersonalRecords(records);
        
        // Generate reports
        const last7Days = await getRecentStats(7);
        const last14Days = await getRecentStats(14);
        const last30Days = await getRecentStats(30);
        const last365Days = await getRecentStats(365);
        
        const weekly = generateWeeklyReport(last7Days, allWords);
        const monthly = generateMonthlyReport(last30Days, allWords);
        const yearly = generateYearInReview(last365Days, allWords, reviews);
        
        setWeeklyReport(weekly);
        setMonthlyReport(monthly);
        setYearInReview(yearly);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [allWords]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced statistics & insights</p>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced statistics & insights</p>
          </div>
        </header>
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No data yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start learning to see advanced analytics and insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced statistics & insights</p>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'overview'
                  ? 'bg-accent text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('streak')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'streak'
                  ? 'bg-accent text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Streaks
            </button>
            <button
              onClick={() => setSelectedTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'reports'
                  ? 'bg-accent text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Reports
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Learning Velocity */}
            {learningVelocity && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Learning Velocity</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Words / Week"
                    value={learningVelocity.wordsPerWeek}
                    trend={{
                      direction: learningVelocity.velocityTrend,
                      value: 0,
                      label: 'trend',
                    }}
                  />
                  <StatCard
                    title="Reviews / Week"
                    value={learningVelocity.reviewsPerWeek}
                  />
                  <StatCard
                    title="Accuracy Trend"
                    value={learningVelocity.accuracyTrend === 'up' ? '↑' : learningVelocity.accuracyTrend === 'down' ? '↓' : '→'}
                    subtitle={learningVelocity.accuracyTrend}
                    color={
                      learningVelocity.accuracyTrend === 'up' 
                        ? 'text-green-600 dark:text-green-400' 
                        : learningVelocity.accuracyTrend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  />
                  <StatCard
                    title="Velocity Trend"
                    value={learningVelocity.velocityTrend === 'up' ? '↑' : learningVelocity.velocityTrend === 'down' ? '↓' : '→'}
                    subtitle={learningVelocity.velocityTrend}
                    color={
                      learningVelocity.velocityTrend === 'up' 
                        ? 'text-green-600 dark:text-green-400' 
                        : learningVelocity.velocityTrend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  />
                </div>
              </section>
            )}

            {/* Retention Metrics */}
            {retentionMetrics && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Retention & Progress</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Overall Retention"
                    value={`${retentionMetrics.overallRetentionRate}%`}
                    color="text-green-600 dark:text-green-400"
                  />
                  <StatCard
                    title="Learning Rate"
                    value={`${retentionMetrics.newToLearningRate}%`}
                    subtitle="New → Learning"
                  />
                  <StatCard
                    title="Mastery Rate"
                    value={`${retentionMetrics.learningToMasteredRate}%`}
                    subtitle="Learning → Mastered"
                  />
                  <StatCard
                    title="Avg Days to Mastery"
                    value={retentionMetrics.averageDaysToMastery}
                    subtitle={retentionMetrics.averageDaysToMastery === 1 ? 'day' : 'days'}
                  />
                </div>
              </section>
            )}

            {/* Accuracy Trend Chart */}
            {accuracyTrend.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Accuracy Trend (30 Days)</h2>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <TrendLineChart
                    data={accuracyTrend.map(t => ({
                      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      accuracy: t.accuracy,
                      movingAvg: t.movingAverage || 0,
                    }))}
                    lines={[
                      { dataKey: 'accuracy', name: 'Daily Accuracy', color: '#007aff' },
                      { dataKey: 'movingAvg', name: '7-Day Average', color: '#34c759', strokeDasharray: '5 5' },
                    ]}
                    xDataKey="date"
                    height={300}
                    showLegend={true}
                  />
                </div>
              </section>
            )}

            {/* Learning Velocity Chart */}
            {velocityTrend.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Learning Velocity</h2>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <AreaChartEnhanced
                    data={velocityTrend.slice(-30).map(v => ({
                      date: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      words: v.cumulativeWords,
                      reviews: v.reviewsCompleted,
                    }))}
                    areas={[
                      { dataKey: 'words', name: 'Total Words', color: '#007aff', fillOpacity: 0.6 },
                    ]}
                    xDataKey="date"
                    height={300}
                    showLegend={true}
                  />
                </div>
              </section>
            )}

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Personal Records</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {personalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{record.category}</div>
                          <div className="text-3xl font-bold mt-1">
                            {record.value} <span className="text-lg">{record.unit}</span>
                          </div>
                        </div>
                        <div className="text-3xl">🏆</div>
                      </div>
                      <div className="text-sm">{record.description}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(record.achievedDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Streak Tab */}
        {selectedTab === 'streak' && streakData && (
          <StreakTracker streakData={streakData} heatmapData={heatmapData} />
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="space-y-6">
            <ReportSelector 
              selectedPeriod={reportPeriod}
              onPeriodChange={setReportPeriod}
            />
            
            {reportPeriod === 'week' && weeklyReport && (
              <WeeklyReportCard report={weeklyReport} />
            )}
            
            {reportPeriod === 'month' && monthlyReport && (
              <MonthlyReportCard report={monthlyReport} />
            )}
            
            {reportPeriod === 'year' && yearInReview && (
              <YearInReviewCard yearInReview={yearInReview} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

