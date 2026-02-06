/**
 * Home page - Dashboard overview
 * Apple-inspired design with activity rings, insights, and delightful interactions
 * 
 * @module app/(dashboard)/page
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVocabularyStats, useTodayStats } from '@/lib/hooks/use-vocabulary';
import { OnboardingWelcome } from '@/components/features/onboarding-welcome';
import { hasCompletedOnboarding, completeOnboarding } from '@/lib/utils/onboarding';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { ActivityRing, StatPill } from '@/components/features/activity-ring';
import { StatCardEnhanced } from '@/components/ui/stat-card-enhanced';
import { ActionCard } from '@/components/ui/action-card';
import { InsightsGrid } from '@/components/features/insight-card';
import { StreakCardHero } from '@/components/features/streak-card-hero';
import { AppHeader } from '@/components/ui/app-header';
import { generateInsights, type LearningStats } from '@/lib/utils/insights';
import { calculateCurrentStreak, formatStudyTime } from '@/lib/utils/progress';
import { getRecentStats } from '@/lib/db/stats';
import type { DailyStats } from '@/lib/types';

/**
 * Home page component
 * Main dashboard with overview and quick actions
 * 
 * @returns Home page
 */
export default function HomePage() {
  const { data: stats, refetch: refetchStats } = useVocabularyStats();
  const { data: todayData, refetch: refetchTodayStats } = useTodayStats();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  const hasVocabulary = (stats?.total || 0) > 0;
  
  // Extract stats and dueCount from the query result
  const todayStats = todayData?.stats || null;
  const dueCount = todayData?.dueCount || 0;

  // Enable pull-to-refresh
  const { isRefreshing } = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      // Reload both stats and daily data after sync
      await Promise.all([
        refetchStats(),
        refetchTodayStats(),
      ]);
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

  // Check if user needs onboarding (only on mount)
  useEffect(() => {
    const needsOnboarding = !hasCompletedOnboarding() && !hasVocabulary;
    if (needsOnboarding !== showOnboarding) {
      setShowOnboarding(needsOnboarding);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVocabulary]);

  // Log stats updates for debugging
  useEffect(() => {
    if (todayStats) {
      console.log(`📊 Today's stats updated: reviewed=${todayStats.cardsReviewed}, added=${todayStats.newWordsAdded}, accuracy=${(todayStats.accuracyRate * 100).toFixed(1)}%`);
    }
  }, [todayStats, dueCount]);

  // Load insights and streak data
  useEffect(() => {
    async function loadInsightsAndStreak() {
      if (!stats || !todayStats) return;

      try {
        // Get recent stats for streak calculation
        const recentStats = await getRecentStats(30);
        const streak = calculateCurrentStreak(recentStats);
        setCurrentStreak(streak);

        // Calculate longest streak
        const longestStreak = Math.max(...recentStats.map((_, idx) => {
          let count = 0;
          for (let i = idx; i < recentStats.length; i++) {
            if (recentStats[i].cardsReviewed > 0) count++;
            else break;
          }
          return count;
        }));

        // Generate insights
        const learningStats: LearningStats = {
          cardsReviewedToday: todayStats.cardsReviewed,
          newWordsAddedToday: todayStats.newWordsAdded,
          todayAccuracy: Math.round(todayStats.accuracyRate * 100),
          todayStudyTime: todayStats.timeSpent,
          currentStreak: streak,
          longestStreak,
          totalWords: stats.total,
          totalReviews: 0, // Would need to calculate
          overallAccuracy: 0, // Would need to calculate
          totalStudyTime: 0, // Would need to calculate
          newWords: stats.new || 0,
          learningWords: stats.learning || 0,
          masteredWords: stats.mastered || 0,
          newWordsThisWeek: recentStats.slice(0, 7).reduce((sum, s) => sum + s.newWordsAdded, 0),
        };

        const generatedInsights = generateInsights(learningStats);
        setInsights(generatedInsights);
      } catch (error) {
        console.error('Failed to load insights:', error);
      }
    }

    loadInsightsAndStreak();
  }, [stats, todayStats]);

  // Keyboard shortcut: Shift+A to add new word (navigate to vocabulary page)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'A') {
        e.preventDefault();
        router.push('/vocabulary');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
    // Navigate to vocabulary page to add first word
    router.push('/vocabulary');
  };

  const handleOnboardingSkip = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Refreshing...</span>
        </div>
      )}

      {/* Onboarding Welcome Screen */}
      {showOnboarding && (
        <OnboardingWelcome
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      {/* Header */}
      <AppHeader
        icon="🏠"
        title="Palabra"
        subtitle="Learn Spanish vocabulary with confidence"
        transparent={false}
        showProfile={true}
      />

      {/* Main content */}
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        {/* Hero Activity Ring */}
        {hasVocabulary && dueCount > 0 && (
          <section className="animate-fadeIn">
            <ActivityRing
              current={todayStats?.cardsReviewed || 0}
              target={(todayStats?.cardsReviewed || 0) + dueCount}
              label="Cards Reviewed"
              gradient={{ start: '#007AFF', end: '#00C7FF' }}
              size="lg"
            />
            
            {/* Secondary stats in pills below */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <StatPill
                icon="➕"
                value={todayStats?.newWordsAdded || 0}
                label="Added"
              />
              <StatPill
                icon="✓"
                value={`${todayStats?.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0}%`}
                label="Accuracy"
              />
              <StatPill
                icon="⏱"
                value={formatStudyTime(todayStats?.timeSpent || 0)}
                label="Time"
              />
            </div>
          </section>
        )}

        {/* Quick Stats for users with vocabulary */}
        {hasVocabulary && (
          <section className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardEnhanced
                icon="🎴"
                value={todayStats?.cardsReviewed || 0}
                label="Cards Reviewed"
                progress={dueCount > 0 ? Math.min(((todayStats?.cardsReviewed || 0) / dueCount) * 100, 100) : 0}
                gradient={{ from: '#007AFF', to: '#00C7FF' }}
              />
              <StatCardEnhanced
                icon="📚"
                value={todayStats?.newWordsAdded || 0}
                label="Words Added"
                message="Building vocabulary"
              />
              <StatCardEnhanced
                icon="🎯"
                value={`${todayStats?.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0}%`}
                label="Accuracy"
                trend={todayStats?.accuracyRate && todayStats.accuracyRate >= 0.8 ? 'up' : todayStats?.accuracyRate && todayStats.accuracyRate < 0.6 ? 'down' : 'neutral'}
              />
              <StatCardEnhanced
                icon="⏱️"
                value={formatStudyTime(todayStats?.timeSpent || 0)}
                label="Study Time"
                subtitle="Focus time today"
              />
            </div>
          </section>
        )}

        {/* Streak Card */}
        {hasVocabulary && currentStreak >= 3 && (
          <section className="animate-scaleIn">
            <StreakCardHero currentStreak={currentStreak} nextMilestone={currentStreak >= 30 ? 60 : currentStreak >= 14 ? 30 : currentStreak >= 7 ? 14 : 7} />
          </section>
        )}

        {/* Insights */}
        {hasVocabulary && insights.length > 0 && (
          <section className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">💡 Insights</h2>
            <InsightsGrid insights={insights} columns={insights.length >= 3 ? 3 : insights.length === 2 ? 2 : 1} />
          </section>
        )}

        {/* Quick Actions */}
        <section className="animate-slideIn">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid gap-4">
            {/* Start Review - Only show if there are words */}
            {hasVocabulary && (
              <ActionCard
                icon="🎴"
                title={dueCount > 0 ? 'Start Review' : 'Practice Mode'}
                description={dueCount > 0 
                  ? `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} ready` 
                  : 'Review cards anytime'}
                badge={dueCount > 0 ? `${dueCount} cards` : undefined}
                href="/review"
                gradient={{ from: '#667EEA', to: '#764BA2' }}
              />
            )}

            {/* Add Vocabulary */}
            <ActionCard
              icon={<Plus className="w-12 h-12" />}
              title="Add New Word"
              description="Expand your vocabulary"
              href="/vocabulary?focus=search"
              solid="#007AFF"
            />
          </div>
        </section>

        {/* Empty State - More delightful and inviting */}
        {!hasVocabulary && (
          <section className="text-center py-8 animate-fadeIn">
            <div className="max-w-lg mx-auto px-4">
              <div className="text-7xl mb-6 animate-float">📚</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Welcome to Your Learning Journey
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Build your Spanish vocabulary with intelligent spaced repetition
                that adapts to how you learn.
              </p>
              
              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-4xl mb-1">🧠</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Smart Spaced Repetition</span>
                  <span className="text-gray-600 dark:text-gray-400">Review at the perfect time</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-4xl mb-1">📊</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Track Progress</span>
                  <span className="text-gray-600 dark:text-gray-400">See your improvement</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <span className="text-4xl mb-1">🔥</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Build Streaks</span>
                  <span className="text-gray-600 dark:text-gray-400">Stay motivated daily</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

