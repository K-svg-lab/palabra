/**
 * Home page - Dashboard overview
 * Displays vocabulary statistics, due cards, and quick actions
 * 
 * @module app/(dashboard)/page
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVocabularyStats } from '@/lib/hooks/use-vocabulary';
import { getDueForReviewCount } from '@/lib/db/reviews';
import { getTodayStats } from '@/lib/db/stats';
import { OnboardingWelcome } from '@/components/features/onboarding-welcome';
import { hasCompletedOnboarding, completeOnboarding } from '@/lib/utils/onboarding';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import type { DailyStats } from '@/lib/types';

/**
 * Home page component
 * Main dashboard with overview and quick actions
 * 
 * @returns Home page
 */
export default function HomePage() {
  const { data: stats, refetch: refetchStats } = useVocabularyStats();
  const router = useRouter();
  const [dueCount, setDueCount] = useState<number>(0);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const hasVocabulary = (stats?.total || 0) > 0;

  // Enable pull-to-refresh
  const { isRefreshing } = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      // Reload local stats after sync
      await refetchStats();
      if (hasVocabulary) {
        const { getActualNewWordsAddedToday } = await import('@/lib/db/stats');
        const [count, today, actualNewWords] = await Promise.all([
          getDueForReviewCount(),
          getTodayStats(),
          getActualNewWordsAddedToday(),
        ]);
        
        setDueCount(count);
        
        // CRITICAL FIX: Apply the same correction as in useEffect
        const correctedStats = {
          ...today,
          newWordsAdded: actualNewWords,
        };
        
        setTodayStats(correctedStats);
      }
    },
  });

  // Check if user needs onboarding (only on mount)
  useEffect(() => {
    const needsOnboarding = !hasCompletedOnboarding() && !hasVocabulary;
    if (needsOnboarding !== showOnboarding) {
      setShowOnboarding(needsOnboarding);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVocabulary]);

  // Load due review count and today's stats
  useEffect(() => {
    async function loadData() {
      try {
        const { getActualNewWordsAddedToday } = await import('@/lib/db/stats');
        const [count, today, actualNewWords] = await Promise.all([
          getDueForReviewCount(),
          getTodayStats(),
          getActualNewWordsAddedToday(),
        ]);
        setDueCount(count);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:78',message:'Homepage stats loaded',data:{storedStats:{cardsReviewed:today.cardsReviewed,newWordsAdded:today.newWordsAdded,accuracyRate:today.accuracyRate},actualNewWords,dueCount:count},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        
        // CRITICAL FIX: Use actual count from vocabulary createdAt timestamps
        // instead of incremented counter from stats store
        const correctedStats = {
          ...today,
          newWordsAdded: actualNewWords,
        };
        
        setTodayStats(correctedStats);
        
        console.log(`📊 Stats correction: stored=${today.newWordsAdded}, actual=${actualNewWords}`);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:92',message:'Homepage stats corrected and set',data:{finalStats:{cardsReviewed:correctedStats.cardsReviewed,newWordsAdded:correctedStats.newWordsAdded,accuracyRate:correctedStats.accuracyRate}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }

    if (hasVocabulary) {
      loadData();
    }
  }, [hasVocabulary, stats]);

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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Palabra</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Learn Spanish vocabulary with confidence
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-8">
        {/* Quick Stats */}
        {hasVocabulary && (
          <>
            {/* Today's Activity */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Today</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Cards Reviewed Today */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-3xl font-bold mb-1">{todayStats?.cardsReviewed || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cards reviewed</div>
                </div>

                {/* New Words Added Today */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-3xl font-bold mb-1">{todayStats?.newWordsAdded || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Words added</div>
                </div>

                {/* Cards Due Today */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-3xl font-bold mb-1">{dueCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cards due</div>
                </div>

                {/* Today's Accuracy */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-3xl font-bold mb-1">
                    {todayStats?.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            {/* Start Review - Only show if there are words */}
            {hasVocabulary && (
              <Link
                href="/review"
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-accent transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎴</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {dueCount > 0 ? 'Start Review' : 'Practice Mode'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {dueCount > 0 
                        ? `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} ready` 
                        : 'Review cards anytime'}
                    </div>
                  </div>
                </div>
                {dueCount > 0 && (
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-accent">{dueCount}</span>
                  </div>
                )}
              </Link>
            )}

            {/* Add Vocabulary */}
            <Link
              href="/vocabulary"
              onClick={(e) => {
                e.preventDefault();
                // Will be handled by vocabulary page modal
                window.location.href = '/vocabulary';
              }}
              className="flex items-center justify-between p-4 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-md hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Add New Word</div>
                  <div className="text-sm opacity-90">
                    Expand your vocabulary
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Empty State */}
        {!hasVocabulary && (
          <section className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">
                Start Building Your Vocabulary
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add your first Spanish word to begin your learning journey with
                intelligent spaced repetition.
              </p>
              <Link
                href="/vocabulary"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Your First Word
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

