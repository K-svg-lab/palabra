/**
 * Home page - Dashboard overview
 * Displays vocabulary statistics, due cards, and quick actions
 * 
 * @module app/(dashboard)/page
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVocabularyStats } from '@/lib/hooks/use-vocabulary';
import { getDueForReviewCount } from '@/lib/db/reviews';
import { getTodayStats } from '@/lib/db/stats';
import { OnboardingWelcome } from '@/components/features/onboarding-welcome';
import { hasCompletedOnboarding, completeOnboarding } from '@/lib/utils/onboarding';
import type { DailyStats } from '@/lib/types';

/**
 * Home page component
 * Main dashboard with overview and quick actions
 * 
 * @returns Home page
 */
export default function HomePage() {
  const { data: stats } = useVocabularyStats();
  const router = useRouter();
  const [dueCount, setDueCount] = useState<number>(0);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const hasVocabulary = (stats?.total || 0) > 0;

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
        const [count, today] = await Promise.all([
          getDueForReviewCount(),
          getTodayStats(),
        ]);
        setDueCount(count);
        setTodayStats(today);
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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
                <div className="bg-gradient-to-br from-accent to-accent/80 rounded-xl p-4 shadow-lg text-white">
                  <div className="text-3xl font-bold mb-1">{todayStats?.cardsReviewed || 0}</div>
                  <div className="text-sm opacity-90">Cards reviewed</div>
                </div>

                {/* New Words Added Today */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg text-white">
                  <div className="text-3xl font-bold mb-1">{todayStats?.newWordsAdded || 0}</div>
                  <div className="text-sm opacity-90">Words added</div>
                </div>

                {/* Cards Due Today */}
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 shadow-lg text-white">
                  <div className="text-3xl font-bold mb-1">{dueCount}</div>
                  <div className="text-sm opacity-90">Cards due</div>
                </div>

                {/* Today's Accuracy */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 shadow-lg text-white">
                  <div className="text-3xl font-bold mb-1">
                    {todayStats?.accuracyRate ? Math.round(todayStats.accuracyRate * 100) : 0}%
                  </div>
                  <div className="text-sm opacity-90">Accuracy</div>
                </div>
              </div>
            </section>

            {/* Overall Progress */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Total Words */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-4xl font-bold mb-1">{stats?.total || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total words</div>
                </div>

                {/* New Words */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {stats?.new || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
                </div>

                {/* Learning */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {stats?.learning || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Learning</div>
                </div>

                {/* Mastered */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {stats?.mastered || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mastered</div>
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
                className={`flex items-center justify-between p-4 text-white rounded-xl transition-colors shadow-lg ${
                  dueCount > 0 
                    ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600' 
                    : 'bg-gray-400 dark:bg-gray-600 cursor-default'
                }`}
                onClick={(e) => {
                  if (dueCount === 0) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎴</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {dueCount > 0 ? 'Start Review' : 'No Cards Due'}
                    </div>
                    <div className="text-sm opacity-90">
                      {dueCount > 0 
                        ? `${dueCount} ${dueCount === 1 ? 'card' : 'cards'} ready` 
                        : 'Check back later'}
                    </div>
                  </div>
                </div>
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
              className="flex items-center justify-between p-4 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors shadow-lg"
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

            {/* View All Vocabulary */}
            <Link
              href="/vocabulary"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-accent transition-colors shadow-sm"
            >
              <div>
                <div className="font-semibold">View Vocabulary</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Browse all words
                </div>
              </div>
              <div className="text-2xl font-bold text-accent">{stats?.total || 0}</div>
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

