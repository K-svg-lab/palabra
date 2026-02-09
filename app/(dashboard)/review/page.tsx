"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ReviewSessionEnhanced } from "@/components/features/review-session-enhanced";
import { ReviewSessionVaried } from "@/components/features/review-session-varied";
import { SessionConfig } from "@/components/features/session-config";
import { AppHeader } from "@/components/ui/app-header";
import { useVocabulary } from "@/lib/hooks/use-vocabulary";
import { useReviewPreferences } from "@/lib/hooks/use-review-preferences";
import { getReviewByVocabId, createReviewRecord, updateReviewRecord as updateReviewRecordDB, getDueReviews, getAllReviews } from "@/lib/db/reviews";
import { createSession, updateSession } from "@/lib/db/sessions";
import { updateStatsAfterSession } from "@/lib/db/stats";
import { getVocabularyWord, updateVocabularyWord } from "@/lib/db/vocabulary";
import { updateReviewRecord as updateReviewSM2, createInitialReviewRecord, determineVocabularyStatus } from "@/lib/utils/spaced-repetition";
import type { ReviewMethodType } from "@/lib/types/review-methods";
import { updateBadge } from "@/lib/services/notifications";
import { getSyncService } from "@/lib/services/sync";
import { getOfflineQueueService } from "@/lib/services/offline-queue";
import { generateUUID } from "@/lib/utils/uuid";
import { interleaveWords, DEFAULT_INTERLEAVING_CONFIG, analyzeInterleaving } from "@/lib/services/interleaving";
import type { VocabularyWord, ReviewRecord, ReviewSession as ReviewSessionType } from "@/lib/types/vocabulary";
import type { StudySessionConfig, ExtendedReviewResult } from "@/lib/types/review";
import { DEFAULT_SESSION_CONFIG } from "@/lib/types/review";

/**
 * Review Page - Phase 8 Enhanced
 * 
 * Flashcard review session page with advanced learning features:
 * - Bidirectional flashcards (ES→EN, EN→ES, Mixed)
 * - Multiple review modes (Recognition, Recall, Listening)
 * - Custom study session configuration
 * - Advanced spaced repetition with forgetting curves
 * 
 * Features:
 * - Session configuration UI
 * - Loads all vocabulary words (or due words if filtering by due date)
 * - Configurable card order (randomized or ordered)
 * - Enhanced self-assessment
 * - Extended progress tracking
 * - Review record updates with advanced SR
 * - Session completion handling
 */

export default function ReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: allWords, isLoading } = useVocabulary();
  const { preferences, isLoaded: prefsLoaded, toSessionConfig, updateFromConfig } = useReviewPreferences();
  const [showConfig, setShowConfig] = useState(false);
  const [isInSession, setIsInSession] = useState(false);
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [sessionConfig, setSessionConfig] = useState<StudySessionConfig | null>(null);
  const [dueCount, setDueCount] = useState<number>(-1); // -1 = not calculated yet, 0 = calculated and none due
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSessionType | null>(null);
  const [userLevel, setUserLevel] = useState<string | undefined>();
  const [autoStartTriggered, setAutoStartTriggered] = useState(false);
  const [showMidSessionConfig, setShowMidSessionConfig] = useState(false);
  
  // Track isInSession changes
  useEffect(() => {
    console.log('[isInSession CHANGED]', isInSession, 'Stack:', new Error().stack?.split('\n')[2]);
  }, [isInSession]);

  /**
   * Load user's proficiency level for method selection
   */
  useEffect(() => {
    async function loadUserLevel() {
      try {
        const response = await fetch('/api/user/proficiency');
        if (response.ok) {
          const data = await response.json();
          setUserLevel(data.languageLevel || 'B1');
        }
      } catch (error) {
        console.error('Failed to load user level:', error);
        // Fallback to B1 if fetch fails
        setUserLevel('B1');
      }
    }
    loadUserLevel();
  }, []);

  /**
   * Load due words and available tags on component mount
   * Filters vocabulary to only show words that are due for review
   */
  useEffect(() => {
    async function loadDueWords() {
      console.log('[loadDueWords] Starting, allWords:', allWords?.length);
      if (!allWords || !Array.isArray(allWords) || allWords.length === 0) return;

      try {
        // Get all review records
        const allReviews = await getAllReviews();
        const reviewMap = new Map(allReviews.map(r => [r.vocabId, r]));

        // Get due review records
        const dueReviews = await getDueReviews();
        const dueVocabIds = new Set(dueReviews.map(r => r.vocabId));

        // Filter words to only include:
        // 1. Words that are due for review
        // 2. Words that have never been reviewed (no review record)
        const wordsToReview = allWords.filter(word => {
          const hasReview = reviewMap.has(word.id);
          const isDue = dueVocabIds.has(word.id);
          
          // Include if never reviewed OR if review is due
          return !hasReview || isDue;
        });

        console.log('[loadDueWords] ✅ Setting dueCount to:', wordsToReview.length);
        setDueCount(wordsToReview.length);
        
        // Extract unique tags from all words
        const tagsSet = new Set<string>();
        allWords.forEach(word => {
          word.tags?.forEach((tag: string) => tagsSet.add(tag));
        });
        setAvailableTags(Array.from(tagsSet).sort());
      } catch (error) {
        console.error("Failed to load due words:", error);
        // Fallback: show all words
        setDueCount(allWords.length);
      }
    }

    loadDueWords();
  }, [allWords]);

  /**
   * Show session configuration
   */
  const showSessionConfig = () => {
    setShowConfig(true);
  };

  /**
   * Start a review session with custom configuration
   * Phase 18 UX Enhancement: Saves preferences for next session
   */
  const startSession = async (config: StudySessionConfig) => {
    console.log('[startSession] Called with config:', config, 'Current isInSession:', isInSession);
    
    if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
      console.log('[startSession] Aborted - no words available');
      return;
    }

    // Save preferences for next time (smart defaults)
    updateFromConfig(config);

    try {
      // Get all review records for filtering
      const allReviews = await getAllReviews();
      const reviewMap = new Map(allReviews.map(r => [r.vocabId, r]));

      // Get due review records
      const dueReviews = await getDueReviews();
      const dueVocabIds = new Set(dueReviews.map(r => r.vocabId));

      // Start with due words or all words based on config
      let wordsToReview = config.practiceMode 
        ? [...allWords] // Practice mode: include all cards
        : allWords.filter(word => {
            const hasReview = reviewMap.has(word.id);
            const isDue = dueVocabIds.has(word.id);
            return !hasReview || isDue;
          });

      // Apply status filter if configured
      if (config.statusFilter && config.statusFilter.length > 0) {
        wordsToReview = wordsToReview.filter(word => 
          config.statusFilter!.includes(word.status)
        );
      }

      // Apply tag filter if configured
      if (config.tagFilter && config.tagFilter.length > 0) {
        wordsToReview = wordsToReview.filter(word =>
          word.tags?.some((tag: string) => config.tagFilter!.includes(tag))
        );
      }

      // Apply weak words filter if configured
      if (config.weakWordsOnly) {
        const threshold = (config.weakWordsThreshold || 70) / 100;
        wordsToReview = wordsToReview.filter(word => {
          const review = reviewMap.get(word.id);
          if (!review || review.totalReviews === 0) return true; // Include new words
          
          // Phase 8 Enhancement: Use directional accuracy based on current direction
          let accuracy: number;
          if (config.direction === 'english-to-spanish') {
            // EN→ES direction: use productive accuracy (typically harder)
            if (review.enToEsTotal > 0) {
              accuracy = review.enToEsCorrect / review.enToEsTotal;
            } else {
              // Never tested in this direction = needs practice (treat as 0% accuracy)
              accuracy = 0;
            }
          } else if (config.direction === 'spanish-to-english') {
            // ES→EN direction: use receptive accuracy
            if (review.esToEnTotal > 0) {
              accuracy = review.esToEnCorrect / review.esToEnTotal;
            } else {
              // Never tested in this direction = needs practice (treat as 0% accuracy)
              accuracy = 0;
            }
          } else {
            // Mixed direction: use overall accuracy
            accuracy = review.correctCount / review.totalReviews;
          }
          
          return accuracy < threshold;
        });
      }

      if (wordsToReview.length > 0) {
        // Apply interleaving for optimal learning (Phase 18.1.5)
        // Intelligently mixes words by part of speech, age, and difficulty
        // to enhance retention through cognitive variation
        const interleavingConfig = {
          ...DEFAULT_INTERLEAVING_CONFIG,
          enabled: preferences.interleavingEnabled,
        };
        const interleavedWords = interleaveWords(wordsToReview, interleavingConfig);
        
        // Create a new review session record
        const newSession: ReviewSessionType = {
          id: generateUUID(),
          startTime: Date.now(),
          endTime: null,
          cardsReviewed: 0,
          accuracyRate: 0,
          responses: [],
        };
        
        await createSession(newSession);
        setCurrentSession(newSession);
        setSessionWords(interleavedWords);
        setSessionConfig(config);
        setIsInSession(true);
        setShowConfig(false);
        
        console.log('[startSession] ✅ Session started successfully:', {
          wordsCount: interleavedWords.length,
          sessionId: newSession.id,
          firstWord: interleavedWords[0]?.spanishWord
        });
      }
    } catch (error) {
      console.error("Failed to start review session:", error);
      // Fallback: use all words with interleaving
      const interleavingConfig = {
        ...DEFAULT_INTERLEAVING_CONFIG,
        enabled: preferences.interleavingEnabled,
      };
      const interleavedWords = interleaveWords(allWords, interleavingConfig);
      const newSession: ReviewSessionType = {
        id: generateUUID(),
        startTime: Date.now(),
        endTime: null,
        cardsReviewed: 0,
        accuracyRate: 0,
        responses: [],
      };
      setCurrentSession(newSession);
      setSessionWords(interleavedWords);
      setSessionConfig(config);
      setIsInSession(true);
      setShowConfig(false);
    }
  };

  /**
   * Auto-start session with smart defaults (Phase 18 UX Enhancement)
   * Immediately starts review session using saved preferences
   * No intermediate screens for instant engagement
   */
  useEffect(() => {
    console.log('[AUTO-START EFFECT] Triggered with:', {
      autoStartTriggered,
      isInSession,
      showConfig,
      hasWords: !!allWords && allWords.length > 0,
      prefsLoaded,
      dueCount
    });

    if (
      !autoStartTriggered &&
      !isInSession &&
      !showConfig &&
      allWords &&
      allWords.length > 0 &&
      prefsLoaded &&
      dueCount > 0
    ) {
      console.log('[AUTO-START] Starting session with', dueCount, 'due cards');
      setAutoStartTriggered(true);
      
      // Use smart defaults from saved preferences
      const config = toSessionConfig({
        sessionSize: Math.min(dueCount, preferences.sessionSize),
        practiceMode: false, // Not practice mode if we have due cards
      });
      
      // Start session immediately
      startSession(config);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords, prefsLoaded, dueCount, autoStartTriggered, isInSession, showConfig]);

  /**
   * Process session results in background (non-blocking)
   * Phase 18 UX Fix: Session completion performance optimization
   * 
   * Processes all review results in parallel, updates database,
   * and syncs to cloud without blocking user navigation
   * 
   * @param results - Review results to process
   * @param sessionEndTime - Session end timestamp
   * @param currentSessionData - Current session record
   */
  const processSessionInBackground = async (
    results: ExtendedReviewResult[],
    sessionEndTime: number,
    currentSessionData: ReviewSessionType | null
  ): Promise<void> => {
    try {
      console.log('[Background] Processing', results.length, 'results in parallel');
      
      // Process all results in PARALLEL (not sequential!)
      // This reduces processing time from ~4s to ~250ms for 20 cards
      const updatePromises = results.map(async (result) => {
        const reviewDate = result.reviewedAt.getTime();
        
        // Get or create review record
        const existingReview = await getReviewByVocabId(result.vocabularyId);
        
        // Phase 18.1.6: Extract quality adjustment parameters
        const difficultyMultiplier = result.difficultyMultiplier || 1.0;
        const responseTime = result.timeSpent;
        const reviewMethod = result.reviewMethod as ReviewMethodType | undefined;
        
        let updatedReview: ReviewRecord;
        if (existingReview) {
          updatedReview = updateReviewSM2(
            existingReview,
            result.rating,
            reviewDate,
            result.direction,
            difficultyMultiplier,
            responseTime,
            reviewMethod
          );
          await updateReviewRecordDB(updatedReview);
        } else {
          const newReview = createInitialReviewRecord(result.vocabularyId, reviewDate);
          updatedReview = updateReviewSM2(
            newReview,
            result.rating,
            reviewDate,
            result.direction,
            difficultyMultiplier,
            responseTime,
            reviewMethod
          );
          await createReviewRecord(updatedReview);
        }
        
        // Update vocabulary status
        try {
          const vocabularyWord = await getVocabularyWord(result.vocabularyId);
          if (vocabularyWord) {
            const newStatus = determineVocabularyStatus(updatedReview);
            if (vocabularyWord.status !== newStatus) {
              await updateVocabularyWord({
                ...vocabularyWord,
                status: newStatus,
                updatedAt: Date.now(),
              });
              console.log(`✅ Updated "${vocabularyWord.spanishWord}" status: ${vocabularyWord.status} → ${newStatus}`);
            }
          }
        } catch (error) {
          console.error('Failed to update vocabulary status:', error);
        }
      });
      
      // Wait for all parallel updates to complete
      await Promise.all(updatePromises);
      console.log('[Background] ✅ All', results.length, 'results processed');
      
      // Invalidate caches (triggers UI refresh)
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'today'] });
      
      // Update session record
      if (currentSessionData) {
        const correctCount = results.filter(r => r.rating !== 'forgot').length;
        const accuracyRate = results.length > 0 ? correctCount / results.length : 0;
        
        await updateSession({
          ...currentSessionData,
          endTime: sessionEndTime,
          cardsReviewed: results.length,
          accuracyRate,
          responses: results.map(r => ({
            vocabId: r.vocabularyId,
            rating: r.rating,
            timestamp: r.reviewedAt.getTime(),
            timeSpent: 0,
          })),
        });
        
        // Track interleaving (fire and forget)
        try {
          const interleavingMetrics = analyzeInterleaving(sessionWords);
          const completionRate = results.length / sessionWords.length;
          
          fetch('/api/analytics/interleaving', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSessionData.id,
              interleavingEnabled: preferences.interleavingEnabled,
              switchRate: interleavingMetrics.switchRate,
              maxConsecutive: interleavingMetrics.maxConsecutive,
              avgConsecutive: interleavingMetrics.avgConsecutive,
              totalWords: sessionWords.length,
              accuracy: accuracyRate,
              completionRate,
            }),
          }).catch(console.error);
        } catch (error) {
          console.error('Interleaving analytics failed:', error);
        }
        
        // Update stats
        const timeSpent = sessionEndTime - currentSessionData.startTime;
        await updateStatsAfterSession(results.length, accuracyRate, timeSpent);
      }
      
      // Update badge (non-critical)
      updateBadge().catch(console.error);
      
      // Sync to cloud (non-blocking)
      if (navigator.onLine) {
        getSyncService()
          .sync('incremental')
          .then(() => console.log('[Background] ✅ Synced to cloud'))
          .catch(error => {
            console.error('[Background] Sync failed, queueing:', error);
            getOfflineQueueService()
              .enqueue('submit_review', results)
              .catch(console.error);
          });
      } else {
        console.log('[Background] Offline - queueing reviews');
        getOfflineQueueService()
          .enqueue('submit_review', results)
          .catch(console.error);
      }
      
      console.log('[Background] ✅ All background tasks complete');
    } catch (error) {
      console.error('[Background] Processing failed:', error);
    }
  };

  /**
   * Handle session completion - INSTANT navigation
   * Phase 18 UX Fix: Performance optimization (6s → <50ms)
   * 
   * User sees home screen immediately, all processing happens in background.
   * This transforms the UX from "Is it frozen?" to "Wow, that's fast!"
   * 
   * @param results - Review results from completed session
   */
  const handleSessionComplete = async (results: ExtendedReviewResult[]) => {
    const sessionEndTime = Date.now();
    console.log('[Session] Complete! Navigating immediately, processing in background');
    
    try {
      // ✅ INSTANT: Navigate user to home screen (<50ms)
      // This is the ONLY operation that blocks the user
      router.push("/?sessionComplete=true");
      
      // 🔄 BACKGROUND: Process everything asynchronously
      // setTimeout ensures navigation completes first
      setTimeout(() => {
        processSessionInBackground(results, sessionEndTime, currentSession)
          .catch(error => {
            console.error('[Session] Background processing failed:', error);
          });
      }, 0);
      
    } catch (error) {
      console.error('[Session] Navigation failed:', error);
      // Fallback: still try to navigate
      router.push("/");
    }
  };

  /**
   * Handle session cancellation
   */
  const handleSessionCancel = () => {
    console.log('[handleSessionCancel] ⚠️ Session cancelled! Stack:', new Error().stack);
    setIsInSession(false);
    setShowConfig(false);
    router.push("/");
  };

  // Loading state
  // Also show loading if dueCount hasn't been calculated yet (-1)
  if (isLoading || dueCount === -1) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-7xl animate-float">📚</div>
          <h2 className="text-3xl font-bold text-text">No vocabulary yet</h2>
          <p className="text-lg text-text-secondary">
            Add your first Spanish word to start learning!
          </p>
          <Link
            href="/vocabulary?focus=search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  // No due words - show "All caught up!" screen
  // Only show when:
  // - Not currently in a session
  // - dueCount is exactly 0 (not -1)
  // - No session words selected
  // - Auto-start not triggered
  // - AND preferences are loaded (to avoid showing during initial load)
  if (!isInSession && dueCount === 0 && sessionWords.length === 0 && !autoStartTriggered && prefsLoaded) {
    console.log('[ReviewPage RENDER] ✨ Showing "All Caught Up!" screen - isInSession:', isInSession, 'dueCount:', dueCount, 'sessionWords:', sessionWords.length, 'autoStart:', autoStartTriggered, 'prefsLoaded:', prefsLoaded);
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-7xl animate-bounce-slow">✅</div>
          <h2 className="text-3xl font-bold text-text">All Caught Up!</h2>
          <p className="text-lg text-text-secondary">
            Great job! You've reviewed all your due words for today.
          </p>
          <Link
            href="/vocabulary?focus=search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add More Words
          </Link>
        </div>
      </div>
    );
  }

  // Show configuration modal
  if (!isInSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <SessionConfig
          wordCount={allWords.length}
          dueCount={dueCount}
          onStart={handleStartSession}
          onCancel={() => router.push("/")}
          defaultConfig={sessionConfig || DEFAULT_SESSION_CONFIG}
        />
      </div>
    );
  }

  // Show review session
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {showMidSessionConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SessionConfig
              wordCount={allWords.length}
              dueCount={dueCount}
              onStart={(config) => {
                // Update config mid-session
                setSessionConfig(config);
                setShowMidSessionConfig(false);
              }}
              onCancel={() => setShowMidSessionConfig(false)}
              defaultConfig={sessionConfig || DEFAULT_SESSION_CONFIG}
              inSession={true}
            />
          </div>
        </div>
      )}

      <ReviewSessionVaried
        words={sessionWords}
        config={sessionConfig || DEFAULT_SESSION_CONFIG}
        onComplete={handleSessionComplete}
        onCancel={handleSessionCancel}
        userLevel={userLevel}
        onConfigChange={() => setShowMidSessionConfig(true)}
      />
    </div>
  );
}
