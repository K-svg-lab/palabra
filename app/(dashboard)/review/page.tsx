"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReviewSessionEnhanced } from "@/components/features/review-session-enhanced";
import { SessionConfig } from "@/components/features/session-config";
import { useVocabulary } from "@/lib/hooks/use-vocabulary";
import { getReviewByVocabId, createReviewRecord, updateReviewRecord as updateReviewRecordDB, getDueReviews, getAllReviews } from "@/lib/db/reviews";
import { createSession, updateSession } from "@/lib/db/sessions";
import { updateStatsAfterSession } from "@/lib/db/stats";
import { getVocabularyWord, updateVocabularyWord } from "@/lib/db/vocabulary";
import { updateReviewRecord as updateReviewSM2, createInitialReviewRecord, determineVocabularyStatus } from "@/lib/utils/spaced-repetition";
import { updateBadge } from "@/lib/services/notifications";
import { getSyncService } from "@/lib/services/sync";
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
  const { data: allWords, isLoading } = useVocabulary();
  const [showConfig, setShowConfig] = useState(false);
  const [isInSession, setIsInSession] = useState(false);
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [sessionConfig, setSessionConfig] = useState<StudySessionConfig | null>(null);
  const [dueCount, setDueCount] = useState<number>(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSessionType | null>(null);

  /**
   * Load due words and available tags on component mount
   * Filters vocabulary to only show words that are due for review
   */
  useEffect(() => {
    async function loadDueWords() {
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
   */
  const startSession = async (config: StudySessionConfig) => {
    if (!allWords || !Array.isArray(allWords) || allWords.length === 0) return;

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
          const accuracy = review.correctCount / review.totalReviews;
          return accuracy < threshold;
        });
      }

      if (wordsToReview.length > 0) {
        // Create a new review session record
        const newSession: ReviewSessionType = {
          id: crypto.randomUUID(),
          startTime: Date.now(),
          endTime: null,
          cardsReviewed: 0,
          accuracyRate: 0,
          responses: [],
        };
        
        await createSession(newSession);
        setCurrentSession(newSession);
        setSessionWords(wordsToReview);
        setSessionConfig(config);
        setIsInSession(true);
        setShowConfig(false);
      }
    } catch (error) {
      console.error("Failed to start review session:", error);
      // Fallback: use all words
      const newSession: ReviewSessionType = {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        endTime: null,
        cardsReviewed: 0,
        accuracyRate: 0,
        responses: [],
      };
      setCurrentSession(newSession);
      setSessionWords(allWords);
      setSessionConfig(config);
      setIsInSession(true);
      setShowConfig(false);
    }
  };

  /**
   * Handle session completion (Phase 8 Enhanced)
   * Saves review results, updates review records using SM-2 algorithm,
   * and tracks session statistics
   * 
   * Now supports extended review results with mode-specific data
   */
  const handleSessionComplete = async (results: ExtendedReviewResult[]) => {
    const sessionEndTime = Date.now();
    
    try {
      // Update review records for each result and update vocabulary status
      for (const result of results) {
        const reviewDate = result.reviewedAt.getTime();
        
        // Get existing review record or create new one
        const existingReview = await getReviewByVocabId(result.vocabularyId);
        
        let updatedReview: ReviewRecord;
        if (existingReview) {
          // Update existing record using SM-2 algorithm
          updatedReview = updateReviewSM2(
            existingReview,
            result.rating,
            reviewDate
          );
          await updateReviewRecordDB(updatedReview);
        } else {
          // Create initial review record
          const newReview = createInitialReviewRecord(result.vocabularyId, reviewDate);
          
          // Apply first review rating
          updatedReview = updateReviewSM2(
            newReview,
            result.rating,
            reviewDate
          );
          
          await createReviewRecord(updatedReview);
        }

        // Update vocabulary word status based on review performance
        try {
          const vocabularyWord = await getVocabularyWord(result.vocabularyId);
          if (vocabularyWord) {
            const newStatus = determineVocabularyStatus(updatedReview);
            console.log(`🔄 Status check for "${vocabularyWord.spanishWord}": current=${vocabularyWord.status}, new=${newStatus}, reviews=${updatedReview.totalReviews}, repetitions=${updatedReview.repetition}, accuracy=${Math.round((updatedReview.correctCount/updatedReview.totalReviews)*100)}%`);
            if (vocabularyWord.status !== newStatus) {
              await updateVocabularyWord({
                ...vocabularyWord,
                status: newStatus,
                updatedAt: Date.now(),
              });
              console.log(`✅ Updated "${vocabularyWord.spanishWord}" status: ${vocabularyWord.status} → ${newStatus}`);
            } else {
              console.log(`⏭️  Skipped "${vocabularyWord.spanishWord}" - status unchanged`);
            }
          }
        } catch (error) {
          console.error('Failed to update vocabulary status:', error);
          // Don't fail the session if status update fails
        }
      }

      // Update session record with completion data
      if (currentSession) {
        const correctCount = results.filter(r => r.rating !== 'forgot').length;
        const accuracyRate = results.length > 0 ? correctCount / results.length : 0;
        
        const updatedSession: ReviewSessionType = {
          ...currentSession,
          endTime: sessionEndTime,
          cardsReviewed: results.length,
          accuracyRate,
          responses: results.map(r => ({
            vocabId: r.vocabularyId,
            rating: r.rating,
            timestamp: r.reviewedAt.getTime(),
            timeSpent: 0, // We don't track individual card time yet
          })),
        };
        
        await updateSession(updatedSession);
        
        // Update daily stats
        const timeSpent = sessionEndTime - currentSession.startTime;
        // #region agent log H3
        fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'review/page.tsx:267',message:'Session time calculated',data:{timeSpentMs:timeSpent,timeSpentMin:Math.round(timeSpent/60000),cardsReviewed:results.length,accuracy:accuracyRate},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3',runId:'metrics-verify'})}).catch(()=>{});
        // #endregion
        await updateStatsAfterSession(results.length, accuracyRate, timeSpent);
      }

      // Update badge count after session completion
      try {
        await updateBadge();
      } catch (error) {
        console.error("Failed to update badge:", error);
        // Don't fail the session if badge update fails
      }

      // Trigger sync to upload reviews and stats to cloud
      try {
        const syncService = getSyncService();
        await syncService.sync('incremental');
        console.log('✅ Session data synced to cloud');
      } catch (error) {
        console.error("Failed to sync session data:", error);
        // Don't fail the session if sync fails - it will retry later
      }

      // Navigate back to home with success message
      router.push("/?sessionComplete=true");
    } catch (error) {
      console.error("Failed to save review results:", error);
      // Still navigate back even if save fails
      router.push("/");
    }
  };

  /**
   * Handle session cancellation
   */
  const handleSessionCancel = () => {
    setIsInSession(false);
    setShowConfig(false);
    router.push("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-text-secondary">Loading your vocabulary...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!allWords || !Array.isArray(allWords) || allWords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-semibold text-text">No Words Yet</h2>
          <p className="text-text-secondary">
            Add some vocabulary words to start reviewing!
          </p>
          <button
            onClick={() => router.push("/vocabulary")}
            className="px-6 py-3 bg-accent text-white rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Add Vocabulary
          </button>
        </div>
      </div>
    );
  }

  // Session configuration screen (Phase 8)
  if (showConfig && !isInSession) {
    return (
      <SessionConfig
        defaultConfig={{
          ...DEFAULT_SESSION_CONFIG,
          sessionSize: Math.min(dueCount > 0 ? dueCount : allWords.length, 20),
          practiceMode: dueCount === 0, // Auto-enable practice mode if no cards due
        }}
        availableTags={availableTags}
        totalAvailable={dueCount > 0 ? dueCount : allWords.length}
        onStart={startSession}
        onCancel={() => setShowConfig(false)}
      />
    );
  }

  // Session start screen
  if (!isInSession) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-2xl font-semibold text-text">
            {dueCount > 0 ? 'Ready to Review' : 'Practice Mode'}
          </h2>
          <div className="space-y-2">
            {dueCount > 0 ? (
              <>
                <p className="text-text-secondary">
                  You have <span className="font-semibold text-accent">{dueCount}</span> {dueCount === 1 ? 'word' : 'words'} due for review
                </p>
                {dueCount < allWords.length && (
                  <p className="text-sm text-text-tertiary">
                    {allWords.length - dueCount} {allWords.length - dueCount === 1 ? 'word' : 'words'} not due yet
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-text-secondary">
                  No cards are due right now
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  You can practice all <span className="font-semibold">{allWords.length}</span> {allWords.length === 1 ? 'card' : 'cards'} anytime
                </p>
              </>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={showSessionConfig}
              className="w-full px-6 py-4 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              ⚙️ Configure & Start {dueCount > 0 ? 'Review' : 'Practice Session'}
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 text-text rounded-xl font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active review session (Phase 8 Enhanced)
  return (
    <ReviewSessionEnhanced
      words={sessionWords}
      config={sessionConfig || DEFAULT_SESSION_CONFIG}
      onComplete={handleSessionComplete}
      onCancel={handleSessionCancel}
    />
  );
}

