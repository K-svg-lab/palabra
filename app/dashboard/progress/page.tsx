/**
 * Progress page
 * Apple-inspired learning progress visualization with achievements and insights
 */

'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { getAllReviews, countDueReviews } from '@/lib/db/reviews';
import { getTodayStats, getRecentStats, getTotalCardsReviewed, getTotalStudyTime, getOverallAccuracy } from '@/lib/db/stats';
import { 
  calculateVocabularyStatusCounts, 
  calculateCurrentStreak,
  calculateLongestStreak,
  formatStudyTime,
  prepareReviewsChartData,
  prepareAccuracyChartData,
  getDateRangeLabel,
  calculateMilestones,
  type ProgressStats,
} from '@/lib/utils/progress';
import { LearningJourneyCard } from '@/components/features/learning-journey-card';
import { ActivityTimeline } from '@/components/features/activity-timeline';
import { MasteryRing } from '@/components/features/mastery-ring';
import { AchievementGrid, getUserAchievements, AchievementSummary } from '@/components/features/achievement-badge';
import { TrendChartEnhanced } from '@/components/features/trend-chart-enhanced';
import { StatCardEnhanced } from '@/components/ui/stat-card-enhanced';
import { StreakCardHero } from '@/components/features/streak-card-hero';
import { AppHeader } from '@/components/ui/app-header';
import type { DailyStats } from '@/lib/types';

/**
 * Simple bar chart component
 */
function BarChart({ data, color = 'bg-accent' }: { data: { label: string; value: number }[]; color?: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              className={`${color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Progress page component
 * Shows learning progress and statistics
 * 
 * @returns Progress page
 */
export default function ProgressPage() {
  const { data: allWords, refetch: refetchVocabulary } = useVocabulary();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [recentStats, setRecentStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enable pull-to-refresh
  const { isRefreshing } = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      // Refetch vocabulary data after sync
      await refetchVocabulary();
    },
  });

  useEffect(() => {
    async function loadProgressData() {
      setIsLoading(true);
      
      try {
        if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
          setIsLoading(false);
          return;
        }

        // Load all necessary data
        console.log('📊 Loading progress data...');
        const { getActualNewWordsAddedToday } = await import('@/lib/db/stats');
        const [
          reviews,
          todayStats,
          recentStatsForStreak, // Phase 18: Issue #5 Fix - Renamed from last7DaysStats (now 90 days)
          dueCount,
          totalCardsReviewed,
          totalStudyTime,
          actualNewWordsToday,
          overallAccuracyRate,
        ] = await Promise.all([
          getAllReviews(),
          getTodayStats(),
          getRecentStats(90), // Phase 18: Issue #5 Fix - Query 90 days for accurate streak calculation (was 7)
          countDueReviews(),
          getTotalCardsReviewed(),
          getTotalStudyTime(),
          getActualNewWordsAddedToday(),
          getOverallAccuracy(), // Weighted average from DailyStats — avoids ReviewRecord data integrity issues
        ]);
        
        // CRITICAL FIX: Correct the newWordsAdded count
        const storedCount = todayStats.newWordsAdded;
        todayStats.newWordsAdded = actualNewWordsToday;
        
        console.log('📊 Today\'s stats loaded (corrected):', todayStats);
        console.log('📊 Actual new words today:', actualNewWordsToday);
        console.log('📊 Total cards reviewed:', totalCardsReviewed);
        console.log('📊 Recent stats for streak:', recentStatsForStreak.length, 'days');

        // Calculate vocabulary status counts
        const statusCounts = calculateVocabularyStatusCounts(allWords, reviews);

        // Calculate accuracy — use DailyStats weighted average (getOverallAccuracy) rather than
        // ReviewRecord.correctCount/totalReviews, which has a known data integrity issue returning 100%.
        const overallAccuracy = Math.round(overallAccuracyRate * 100);
        const todayAccuracy = todayStats.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0;

        // Calculate streaks
        // Phase 18: Issue #5 Fix - Now using 90 days of data for accurate streak calculation
        const currentStreak = calculateCurrentStreak(recentStatsForStreak);
        const longestStreak = calculateLongestStreak(recentStatsForStreak);

        // Build progress stats
        const progressStats: ProgressStats = {
          totalWords: allWords.length,
          newWords: statusCounts.new,
          learningWords: statusCounts.learning,
          masteredWords: statusCounts.mastered,
          totalReviews: totalCardsReviewed,
          cardsReviewedToday: todayStats.cardsReviewed,
          newWordsAddedToday: todayStats.newWordsAdded,
          cardsDueToday: dueCount,
          overallAccuracy,
          todayAccuracy,
          totalStudyTime,
          todayStudyTime: todayStats.timeSpent,
          currentStreak,
          longestStreak,
        };

        setStats(progressStats);
        // Pass the full 90 days to recentStats so chart functions can look up the correct dates.
        // prepareReviewsChartData / prepareAccuracyChartData build their own date ranges internally.
        setRecentStats(recentStatsForStreak);
      } catch (error) {
        console.error('Failed to load progress data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgressData();
  }, [allWords]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <AppHeader
          icon="📊"
          title="Progress"
          subtitle="Track your learning journey"
          showProfile={true}
        />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!stats || stats.totalWords === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <AppHeader
          icon="📊"
          title="Progress"
          subtitle="Track your learning journey"
          showProfile={true}
        />
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">No data yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start adding vocabulary and reviewing to see your progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  const reviewsChartData = prepareReviewsChartData(recentStats, 7);
  const accuracyChartData = prepareAccuracyChartData(recentStats, 7);
  const milestones = calculateMilestones(stats);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Refreshing...</span>
        </div>
      )}

      {/* Header */}
      <AppHeader
        icon="📊"
        title="Progress"
        subtitle="Track your learning journey"
        showProfile={true}
      />

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        {/* Streak Hero Card */}
        {stats.currentStreak >= 3 && (
          <section className="animate-scaleIn">
            <StreakCardHero 
              currentStreak={stats.currentStreak} 
              nextMilestone={stats.currentStreak >= 30 ? 60 : stats.currentStreak >= 14 ? 30 : stats.currentStreak >= 7 ? 14 : 7}
            />
          </section>
        )}

        {/* Today's Stats */}
        <section className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCardEnhanced
              icon="🎴"
              value={stats.cardsReviewedToday}
              label="Cards Reviewed"
              subtitle="Keep it up!"
              progress={stats.cardsDueToday > 0 ? Math.min((stats.cardsReviewedToday / stats.cardsDueToday) * 100, 100) : 0}
              gradient={{ from: '#007AFF', to: '#00C7FF' }}
            />
            <StatCardEnhanced
              icon="➕"
              value={stats.newWordsAddedToday}
              label="Words Added"
              subtitle="Building vocabulary"
            />
            <StatCardEnhanced
              icon="🎯"
              value={`${stats.todayAccuracy}%`}
              label="Accuracy"
              trend={stats.todayAccuracy >= 80 ? 'up' : stats.todayAccuracy < 60 ? 'down' : 'neutral'}
            />
            <StatCardEnhanced
              icon="⏱️"
              value={formatStudyTime(stats.todayStudyTime)}
              label="Study Time"
              subtitle="Focus time today"
            />
          </div>
        </section>

        {/* Learning Journey Card */}
        <section className="animate-fadeIn">
          <LearningJourneyCard
            newWords={stats.newWords}
            learningWords={stats.learningWords}
            masteredWords={stats.masteredWords}
            totalWords={stats.totalWords}
            accuracy={stats.overallAccuracy}
          />
        </section>

        {/* Mastery Ring */}
        <section className="animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-center">Vocabulary Mastery</h2>
            <MasteryRing
              newWords={stats.newWords}
              learningWords={stats.learningWords}
              masteredWords={stats.masteredWords}
              totalWords={stats.totalWords}
              size="lg"
            />
          </div>
        </section>

        {/* Overall Stats */}
        <section className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCardEnhanced
              icon="📚"
              value={stats.totalWords}
              label="Total Words"
              message="Your vocabulary size"
            />
            <StatCardEnhanced
              icon="🔄"
              value={stats.totalReviews}
              label="Total Reviews"
              message="Practice makes perfect"
            />
            <StatCardEnhanced
              icon="🎯"
              value={`${stats.overallAccuracy}%`}
              label="Overall Accuracy"
              trend={stats.overallAccuracy >= 85 ? 'up' : stats.overallAccuracy < 65 ? 'down' : 'neutral'}
            />
            <StatCardEnhanced
              icon="⏱️"
              value={formatStudyTime(stats.totalStudyTime)}
              label="Total Study Time"
              message="Time invested"
            />
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="animate-slideIn">
          <ActivityTimeline days={7} />
        </section>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Reviews Chart */}
          <TrendChartEnhanced
            data={reviewsChartData}
            dataKey="value"
            xAxisKey="label"
            title="Cards Reviewed"
            subtitle={getDateRangeLabel(7)}
            color="#007AFF"
            chartType="area"
            showTrend={true}
          />

          {/* Accuracy Chart */}
          <TrendChartEnhanced
            data={accuracyChartData}
            dataKey="value"
            xAxisKey="label"
            title="Accuracy Rate"
            subtitle={getDateRangeLabel(7)}
            color="#10B981"
            gradient={{ from: '#10B981', to: '#34D399' }}
            chartType="line"
            showTrend={true}
          />
        </div>

        {/* Achievements */}
        <section className="animate-scaleIn">
          <h2 className="text-xl font-semibold mb-4">🏆 Achievements</h2>
          <div className="space-y-6">
            <AchievementSummary achievements={getUserAchievements(stats)} />
            <AchievementGrid 
              achievements={getUserAchievements(stats)} 
              columns={3}
            />
          </div>
        </section>

        {/* Milestones */}
        {milestones.length > 0 && (
          <section className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">🎉 Milestones Reached</h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium shadow-sm"
                  >
                    {milestone}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

