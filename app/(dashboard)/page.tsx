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
import { OnboardingProficiency } from '@/components/features/onboarding-proficiency';
import { hasCompletedOnboarding, completeOnboarding, hasCompletedProficiencyOnboarding, completeProficiencyOnboarding } from '@/lib/utils/onboarding';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { ActivityRing, ActivityRingWithCTA, StatPill } from '@/components/features/activity-ring';
import { StatCardEnhanced } from '@/components/ui/stat-card-enhanced';
import { ActionCard } from '@/components/ui/action-card';
import { InsightsGrid } from '@/components/features/insight-card';
import { StreakCardHero } from '@/components/features/streak-card-hero';
import { AppHeader } from '@/components/ui/app-header';
import { GuestModeBanner } from '@/components/ui/guest-mode-banner';
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
  const [showProficiencyOnboarding, setShowProficiencyOnboarding] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Phase 18 UX Fix: Background processing indicator
  const [showProcessing, setShowProcessing] = useState(false);

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

  // Phase 18 UX Fix: Show background processing indicator after session completion
  useEffect(() => {
    // Check if we just completed a session (redirect from review page)
    const params = new URLSearchParams(window.location.search);
    if (params.get('sessionComplete') === 'true') {
      setShowProcessing(true);
      
      // Hide after 3 seconds (background processing should be done by then)
      const timer = setTimeout(() => {
        setShowProcessing(false);
        
        // Clean up URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('sessionComplete');
        window.history.replaceState({}, '', url.toString());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Check authentication status and proficiency onboarding
  // Guest Mode (Feb 8, 2026): Allow unauthenticated users to use app with local data
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Phase 18.1: Check if user needs proficiency onboarding
          if (data.user && !data.user.languageLevel && !hasCompletedProficiencyOnboarding()) {
            setShowProficiencyOnboarding(true);
          }
        } else {
          // Not authenticated - GUEST MODE (works with local IndexedDB)
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // Network error or not authenticated - GUEST MODE
        console.log('Not authenticated - using guest mode');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    }
    checkAuth();
  }, [router]);

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

        // Phase 18.1: Fetch proficiency assessment from API if user is authenticated
        let proficiencyInsight = undefined;
        if (user?.id && stats.total >= 20) {
          try {
            const profResponse = await fetch('/api/user/proficiency');
            if (profResponse.ok) {
              const profData = await profResponse.json();
              if (profData.assessment?.shouldNotify) {
                proficiencyInsight = {
                  suggestedLevel: profData.assessment.suggestedLevel,
                  currentLevel: profData.assessment.currentLevel,
                  reason: profData.assessment.reason,
                  confidence: profData.assessment.confidence,
                };
              }
            }
          } catch (error) {
            console.log('Proficiency assessment not available:', error);
          }
        }

        // Generate insights with user proficiency data
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
          // Phase 18.1: Add user proficiency data
          userId: user?.id,
          languageLevel: user?.languageLevel,
          levelAssessedAt: user?.levelAssessedAt,
          proficiencyInsight,
        };

        const generatedInsights = generateInsights(learningStats);
        setInsights(generatedInsights);
      } catch (error) {
        console.error('Failed to load insights:', error);
      }
    }

    loadInsightsAndStreak();
  }, [stats, todayStats, user]);

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

  // Phase 18.1: Handle proficiency onboarding
  const handleProficiencyOnboardingComplete = async (data: {
    nativeLanguage: string;
    targetLanguage: string;
    languageLevel: string;
    dailyGoal: number;
  }) => {
    try {
      // Update user profile via API
      const response = await fetch('/api/user/proficiency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        completeProficiencyOnboarding();
        setShowProficiencyOnboarding(false);
        // Refresh user data
        const meResponse = await fetch('/api/auth/me');
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setUser(userData.user);
        }
      } else {
        console.error('Failed to update proficiency');
      }
    } catch (error) {
      console.error('Error updating proficiency:', error);
    }
  };

  const handleProficiencyOnboardingSkip = () => {
    completeProficiencyOnboarding();
    setShowProficiencyOnboarding(false);
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Guest Mode: Render dashboard even if not authenticated (uses local IndexedDB)

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

      {/* Phase 18.1: Proficiency Onboarding */}
      {showProficiencyOnboarding && user && (
        <OnboardingProficiency
          onComplete={handleProficiencyOnboardingComplete}
          onSkip={handleProficiencyOnboardingSkip}
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
        
        {/* Guest Mode Banner - Show if not authenticated and has words */}
        {!isAuthenticated && (
          <GuestModeBanner wordCount={stats?.total || 0} threshold={5} />
        )}
        {/* Hero Activity Ring with Integrated CTA - Phase 18 UX Enhancement */}
        {hasVocabulary && (
          <section className="animate-fadeIn">
            <ActivityRingWithCTA
              current={todayStats?.cardsReviewed || 0}
              target={(todayStats?.cardsReviewed || 0) + dueCount}
              dueCount={dueCount}
              gradient={{ start: '#667EEA', end: '#764BA2' }}
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

        {/* Quick Actions - Simplified (Phase 18 UX Enhancement) */}
        <section className="animate-slideIn">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid gap-4">
            {/* Add Vocabulary - Primary secondary action */}
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
      
      {/* Phase 18 UX Fix: Background processing indicator */}
      {showProcessing && (
        <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Saving progress...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

