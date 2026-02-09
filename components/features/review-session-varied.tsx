/**
 * Review Session with Varied Methods - Phase 18.1 Task 4
 * 
 * Orchestrates review sessions using 5 different retrieval practice methods:
 * 1. Traditional - Classic flip card
 * 2. Fill in the Blank - Context-based typing
 * 3. Multiple Choice - Recognition with options
 * 4. Audio Recognition - Listening comprehension
 * 5. Context Selection - Choose word for sentence
 * 
 * Features:
 * - Intelligent method selection based on performance
 * - Method history tracking (prevents repetition)
 * - Difficulty multipliers for SM-2 algorithm
 * - Smooth transitions between methods (300ms)
 * - Progress tracking with method indicators
 * 
 * @module components/features/review-session-varied
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, Settings } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { StudySessionConfig, ExtendedReviewResult, ReviewDirection } from '@/lib/types/review';
import type {
  ReviewMethodType,
  ReviewMethodResult,
  MethodHistory,
  MethodPerformance,
  MethodSelectionContext,
} from '@/lib/types/review-methods';
import {
  METHOD_DIFFICULTY_MULTIPLIERS,
  REVIEW_METHOD_METADATA,
  DEFAULT_METHOD_SELECTOR_CONFIG,
} from '@/lib/types/review-methods';
import { selectReviewMethod } from '@/lib/services/method-selector';
import {
  TraditionalReview,
  FillBlankReview,
  MultipleChoiceReview,
  AudioRecognitionReview,
  ContextSelectionReview,
} from '@/components/features/review-methods';

interface ReviewSessionVariedProps {
  /** Array of vocabulary words to review */
  words: VocabularyWord[];
  /** Session configuration */
  config: StudySessionConfig;
  /** Callback when session is completed */
  onComplete: (results: ExtendedReviewResult[]) => void;
  /** Callback when session is cancelled */
  onCancel: () => void;
  /** User's proficiency level (for method selection) */
  userLevel?: string;
  /** Callback when user wants to change settings mid-session */
  onConfigChange?: () => void;
}

export function ReviewSessionVaried({
  words,
  config,
  onComplete,
  onCancel,
  userLevel,
  onConfigChange,
}: ReviewSessionVariedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExtendedReviewResult[]>([]);
  const [methodHistory, setMethodHistory] = useState<MethodHistory[]>([]);
  const [methodPerformance, setMethodPerformance] = useState<MethodPerformance[]>([]);
  const [currentDirection, setCurrentDirection] = useState<ReviewDirection>(
    config.direction === 'mixed' ? 'spanish-to-english' : config.direction
  );
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Process words based on configuration
  const processedWords = useMemo(() => {
    let filtered = [...words];
    filtered = filtered.slice(0, config.sessionSize);
    if (config.randomize) {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [words, config]);

  const currentWord = processedWords[currentIndex];
  const progress = Math.min(((results.length) / processedWords.length) * 100, 100);
  const isSessionComplete = results.length === processedWords.length;

  // Select method for current word
  const selectedMethod = useMemo(() => {
    if (!currentWord) return 'traditional' as ReviewMethodType;

    const context: MethodSelectionContext = {
      word: currentWord,
      recentHistory: methodHistory.slice(-5), // Last 5 methods
      performance: methodPerformance,
      userLevel,
    };

    const selection = selectReviewMethod(context, DEFAULT_METHOD_SELECTOR_CONFIG);
    
    console.log(`[Method Selector] Word: "${currentWord.spanishWord}" → Method: ${selection.method} (${(selection.confidence * 100).toFixed(0)}% confidence)`);
    
    return selection.method;
  }, [currentWord, methodHistory, methodPerformance, userLevel]);

  // Reset state when moving to next card
  useEffect(() => {
    // For mixed mode, randomly choose direction for each card
    if (config.direction === 'mixed') {
      setCurrentDirection(Math.random() > 0.5 ? 'spanish-to-english' : 'english-to-spanish');
    }
  }, [currentIndex, config.direction]);

  /**
   * Handle method completion
   */
  const handleMethodComplete = (methodResult: ReviewMethodResult) => {
    if (!currentWord) return;

    // Guard: Prevent duplicate results
    if (results.some(r => r.vocabularyId === currentWord.id)) {
      return;
    }

    // Update method history
    const newHistory: MethodHistory = {
      wordId: currentWord.id,
      method: methodResult.method,
      timestamp: Date.now(),
    };
    setMethodHistory(prev => [...prev, newHistory]);

    // Update method performance
    setMethodPerformance(prev => {
      const existing = prev.find(p => p.method === methodResult.method);
      if (existing) {
        return prev.map(p =>
          p.method === methodResult.method
            ? {
                ...p,
                attempts: p.attempts + 1,
                correct: p.correct + (methodResult.isCorrect ? 1 : 0),
                accuracy: (p.correct + (methodResult.isCorrect ? 1 : 0)) / (p.attempts + 1),
                lastAttempt: Date.now(),
              }
            : p
        );
      } else {
        return [
          ...prev,
          {
            method: methodResult.method,
            attempts: 1,
            correct: methodResult.isCorrect ? 1 : 0,
            accuracy: methodResult.isCorrect ? 1.0 : 0.0,
            lastAttempt: Date.now(),
          },
        ];
      }
    });

    // Create extended result for SM-2 with difficulty multiplier
    const difficultyMultiplier = METHOD_DIFFICULTY_MULTIPLIERS[methodResult.method];
    
    const result: ExtendedReviewResult = {
      vocabularyId: currentWord.id,
      rating: methodResult.rating,
      mode: config.mode,
      direction: currentDirection,
      reviewedAt: new Date(),
      timeSpent: methodResult.timeSpent,
      // Phase 18.1 Task 4: Add method type and difficulty multiplier
      reviewMethod: methodResult.method,
      difficultyMultiplier,
      ...(methodResult.userAnswer && {
        recallAttempt: {
          userAnswer: methodResult.userAnswer,
          correctAnswer: currentDirection === 'spanish-to-english'
            ? currentWord.englishTranslation
            : currentWord.spanishWord,
          isCorrect: methodResult.isCorrect,
          similarityScore: methodResult.similarity || 0,
          timeToAnswer: 0, // Would need to track this
        },
      }),
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Move to next card or complete session
    if (currentIndex < processedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompletionDialog(true);
    }
  };

  /**
   * Handle session completion confirmation
   */
  const handleConfirmComplete = () => {
    onComplete(results);
  };

  /**
   * Handle session cancellation
   */
  const handleCancel = () => {
    if (results.length > 0) {
      if (confirm(`You've reviewed ${results.length} card${results.length === 1 ? '' : 's'}. Save progress?`)) {
        onComplete(results);
      } else {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Loading state
  if (!currentWord && !isSessionComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  // Completion dialog
  if (showCompletionDialog) {
    const accuracy = results.length > 0
      ? results.filter(r => r.rating !== 'forgot').length / results.length
      : 0;
    const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Calculate method distribution
    const methodCounts: Record<string, number> = {};
    results.forEach(r => {
      const method = (r as any).reviewMethod || 'traditional';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold text-text">Session Complete!</h2>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-accent/10 rounded-xl">
                <div className="text-3xl font-bold text-accent">{results.length}</div>
                <div className="text-sm text-text-secondary">Cards Reviewed</div>
              </div>
              <div className={`p-4 rounded-xl ${
                accuracy >= 0.8 
                  ? 'bg-green-500/10' 
                  : accuracy >= 0.6 
                    ? 'bg-yellow-500/10' 
                    : 'bg-orange-500/10'
              }`}>
                <div className={`text-3xl font-bold ${
                  accuracy >= 0.8 
                    ? 'text-green-600 dark:text-green-400' 
                    : accuracy >= 0.6 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {Math.round(accuracy * 100)}%
                </div>
                <div className="text-sm text-text-secondary">Accuracy</div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-left space-y-2">
              <div className="text-sm font-semibold text-text-secondary mb-2">Methods Used:</div>
              {Object.entries(methodCounts).map(([method, count]) => {
                const metadata = REVIEW_METHOD_METADATA[method as ReviewMethodType];
                return (
                  <div key={method} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{metadata?.icon || '🎴'}</span>
                      <span className="text-text">{metadata?.name || method}</span>
                    </span>
                    <span className="text-text-secondary">{count}x</span>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-text-tertiary">
              Session time: {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
            </div>
          </div>

          <button
            onClick={handleConfirmComplete}
            className="w-full px-6 py-4 bg-accent text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Current method metadata for display
  const methodMetadata = REVIEW_METHOD_METADATA[selectedMethod];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Cancel session"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="hidden sm:inline">{methodMetadata.icon} {methodMetadata.name}</span>
              <span className="font-semibold text-accent">{results.length + 1} / {processedWords.length}</span>
            </div>

            {/* Settings gear icon - Phase 18 UX Enhancement */}
            <div className="relative">
              <button
                onClick={() => {
                  if (onConfigChange) {
                    onConfigChange();
                  } else {
                    setShowSettingsHint(true);
                    setTimeout(() => setShowSettingsHint(false), 3000);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                aria-label="Session settings"
                title="Configure session"
              >
                <Settings className="w-5 h-5 text-text-secondary group-hover:text-accent group-hover:rotate-90 transition-all duration-300" />
              </button>
              
              {/* Tooltip hint */}
              {showSettingsHint && !onConfigChange && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
                  Settings available after session
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Method component */}
      <div className="max-w-4xl mx-auto">
        {!currentWord ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <div className="text-4xl">⏳</div>
              <p className="text-text-secondary">Loading card...</p>
            </div>
          </div>
        ) : (
          <>
            {selectedMethod === 'traditional' && (
              <TraditionalReview
                word={currentWord}
                direction={currentDirection}
                cardNumber={`${results.length + 1} of ${processedWords.length}`}
                onComplete={handleMethodComplete}
              />
            )}

            {selectedMethod === 'fill-blank' && (
              <FillBlankReview
                word={currentWord}
                direction={currentDirection}
                cardNumber={`${results.length + 1} of ${processedWords.length}`}
                onComplete={handleMethodComplete}
              />
            )}

            {selectedMethod === 'multiple-choice' && (
              <MultipleChoiceReview
                word={currentWord}
                allWords={processedWords}
                direction={currentDirection}
                cardNumber={`${results.length + 1} of ${processedWords.length}`}
                onComplete={handleMethodComplete}
              />
            )}

            {selectedMethod === 'audio-recognition' && (
              <AudioRecognitionReview
                word={currentWord}
                cardNumber={`${results.length + 1} of ${processedWords.length}`}
                onComplete={handleMethodComplete}
              />
            )}

            {selectedMethod === 'context-selection' && (
              <ContextSelectionReview
                word={currentWord}
                allWords={processedWords}
                direction={currentDirection}
                cardNumber={`${results.length + 1} of ${processedWords.length}`}
                onComplete={handleMethodComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
