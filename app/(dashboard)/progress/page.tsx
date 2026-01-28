/**
 * Progress page
 * Displays learning statistics, charts, and achievements
 */

'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { getAllReviews, countDueReviews } from '@/lib/db/reviews';
import { getTodayStats, getRecentStats, getTotalCardsReviewed, getTotalStudyTime } from '@/lib/db/stats';
import { 
  calculateVocabularyStatusCounts, 
  calculateOverallAccuracy,
  calculateCurrentStreak,
  calculateLongestStreak,
  formatStudyTime,
  prepareReviewsChartData,
  prepareAccuracyChartData,
  getDateRangeLabel,
  calculateMilestones,
  type ProgressStats,
} from '@/lib/utils/progress';
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
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Enable pull-to-refresh
  const { isRefreshing } = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      // Refetch vocabulary data after sync
      await refetchVocabulary();
    },
  });

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setUserLoading(false);
      }
    }
    checkAuth();
  }, []);

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
          last7DaysStats,
          dueCount,
          totalCardsReviewed,
          totalStudyTime,
          actualNewWordsToday,
        ] = await Promise.all([
          getAllReviews(),
          getTodayStats(),
          getRecentStats(7),
          countDueReviews(),
          getTotalCardsReviewed(),
          getTotalStudyTime(),
          getActualNewWordsAddedToday(),
        ]);
        
        // CRITICAL FIX: Correct the newWordsAdded count
        const storedCount = todayStats.newWordsAdded;
        todayStats.newWordsAdded = actualNewWordsToday;
        
        console.log('📊 Today\'s stats loaded (corrected):', todayStats);
        console.log('📊 Actual new words today:', actualNewWordsToday);
        console.log('📊 Total cards reviewed:', totalCardsReviewed);
        console.log('📊 Recent stats:', last7DaysStats);

        // Calculate vocabulary status counts
        const statusCounts = calculateVocabularyStatusCounts(allWords, reviews);

        // Calculate accuracy
        const overallAccuracy = calculateOverallAccuracy(reviews);
        const todayAccuracy = todayStats.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0;

        // Calculate streaks
        const currentStreak = calculateCurrentStreak(last7DaysStats);
        const longestStreak = calculateLongestStreak(last7DaysStats);

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
        setRecentStats(last7DaysStats);
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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-6 max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Progress</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning journey</p>
            </div>
            
            {/* User Icon */}
            {!userLoading && (
              <Link
                href={user ? "/settings" : "/signin"}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync across devices'}
              >
                {user ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {user.name || user.email.split('@')[0]}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Sign In</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </header>
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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-6 max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Progress</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning journey</p>
            </div>
            
            {/* User Icon */}
            {!userLoading && (
              <Link
                href={user ? "/settings" : "/signin"}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync across devices'}
              >
                {user ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {user.name || user.email.split('@')[0]}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Sign In</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </header>
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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-6 max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Progress</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning journey</p>
          </div>
          
          {/* User Icon */}
          {!userLoading && (
            <Link
              href={user ? "/settings" : "/signin"}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
              title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync across devices'}
            >
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {user.name || user.email.split('@')[0]}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Sign In</span>
                </>
              )}
            </Link>
          )}
        </div>
      </header>

      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        {/* Today's Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.cardsReviewedToday}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cards reviewed</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.newWordsAddedToday}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Words added</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.todayAccuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">
                {formatStudyTime(stats.todayStudyTime)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Study time</div>
            </div>
          </div>
        </section>

        {/* Overall Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.totalWords}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total words</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total reviews</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">{stats.overallAccuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall accuracy</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-3xl font-bold mb-1">
                {formatStudyTime(stats.totalStudyTime)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total study time</div>
            </div>
          </div>
        </section>

        {/* Vocabulary Status */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Vocabulary Status</h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <BarChart
              data={[
                { label: 'New', value: stats.newWords },
                { label: 'Learning', value: stats.learningWords },
                { label: 'Mastered', value: stats.masteredWords },
              ]}
              color="bg-gray-900 dark:bg-gray-300"
            />
          </div>
        </section>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reviews Chart */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{getDateRangeLabel(7)}</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Cards Reviewed</h3>
              <BarChart
                data={reviewsChartData.map(d => ({ label: d.label || '', value: d.value }))}
                color="bg-accent"
              />
            </div>
          </section>

          {/* Accuracy Chart */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{getDateRangeLabel(7)}</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Accuracy Rate</h3>
              <BarChart
                data={accuracyChartData.map(d => ({ label: d.label || '', value: d.value }))}
                color="bg-gray-900 dark:bg-gray-300"
              />
            </div>
          </section>
        </div>

        {/* Streaks */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Study Streaks</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-5xl font-bold mb-2">{stats.currentStreak}</div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">Current Streak</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.currentStreak === 0 ? 'Start reviewing to begin your streak' : 'Keep it up! 🔥'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-5xl font-bold mb-2">{stats.longestStreak}</div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">Longest Streak</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.longestStreak === 0 ? 'No streak yet' : 'Personal best! 🏆'}
              </div>
            </div>
          </div>
        </section>

        {/* Milestones */}
        {milestones.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Milestones</h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium"
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

