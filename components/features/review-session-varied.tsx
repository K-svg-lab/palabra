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
import { X, TrendingUp, Settings, ArrowRight } from 'lucide-react';
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
import { useReviewPreferences } from '@/lib/hooks/use-review-preferences';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { DeepLearningCard } from '@/components/features/deep-learning-card';
import { generateTemplatePrompt } from '@/lib/utils/deep-learning-client';
import type { ElaborativePrompt } from '@/lib/utils/deep-learning-client';

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
  /**
   * Full vocabulary list for method components that need it (e.g. multiple-choice, context-selection).
   * When provided, same as test interface: better distractor generation. Falls back to session words.
   */
  allWords?: VocabularyWord[];
}

export function ReviewSessionVaried({
  words,
  config,
  onComplete,
  onCancel,
  userLevel,
  onConfigChange,
  allWords: allWordsProp,
}: ReviewSessionVariedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExtendedReviewResult[]>([]);
  const [methodHistory, setMethodHistory] = useState<MethodHistory[]>([]);
  const [methodPerformance, setMethodPerformance] = useState<MethodPerformance[]>([]);
  const [currentDirection, setCurrentDirection] = useState<'spanish-to-english' | 'english-to-spanish'>(
    config.direction === 'mixed' ? 'spanish-to-english' : config.direction
  );
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  // Phase 18: Issue #4 - Prevent double-save on completion
  const [isSaving, setIsSaving] = useState(false);
  // Phase 18.2.2: Deep Learning Mode - show elaborative prompt every N cards
  const [showDeepLearningCard, setShowDeepLearningCard] = useState(false);
  const [deepLearningWord, setDeepLearningWord] = useState<VocabularyWord | null>(null);
  const [deepLearningPrompt, setDeepLearningPrompt] = useState<ElaborativePrompt | null>(null);
  // User state for database recording
  const { preferences } = useReviewPreferences();
  const { isPremium } = useSubscription();
  // Phase 18.3.6: Gate deep learning behind premium
  const deepLearningEnabled = isPremium && preferences.deepLearningEnabled === true;
  const deepLearningFrequency = preferences.deepLearningFrequency ?? 12;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Process words based on configuration
  // NOTE: Parent component (page.tsx) already handles:
  // - Filtering (due cards, weak cards, tags, etc.)
  // - Interleaving for optimal method distribution
  // - Randomization (if config.randomize is true)
  // So we just take the words as-is and slice to sessionSize
  const processedWords = useMemo(() => {
    console.log('[processedWords] Using', words.length, 'words from parent (already filtered/interleaved), sessionSize:', config.sessionSize);
    
    // Just slice to sessionSize - parent already handled everything else
    const result = words.slice(0, config.sessionSize);
    
    console.log('[processedWords] Result:', result.length, 'words, first:', result[0]?.spanishWord);
    return result;
  }, [words, config.sessionSize]);

  const currentWord = processedWords[currentIndex];
  const progress = Math.min(((results.length) / processedWords.length) * 100, 100);
  const isSessionComplete = results.length === processedWords.length;
  
  console.log('[Session State] processedWords:', processedWords.length, 'currentIndex:', currentIndex, 'results:', results.length, 'isComplete:', isSessionComplete, 'showCompletionDialog:', showCompletionDialog);

  // Debug: Log when currentWord changes
  useEffect(() => {
    if (currentWord) {
      console.log('[currentWord Changed] Index:', currentIndex, 'Word:', currentWord.spanishWord, 'Word ID:', currentWord.id);
    } else {
      console.log('[currentWord Changed] ⚠️ currentWord is UNDEFINED! processedWords.length:', processedWords.length, 'currentIndex:', currentIndex);
    }
  }, [currentWord, currentIndex]);

  // Select method for current word - STABLE across renders
  const [selectedMethodsMap] = useState<Map<string, ReviewMethodType>>(new Map());
  
  const selectedMethod = useMemo(() => {
    if (!currentWord) return 'traditional' as ReviewMethodType;

    // Check if we already selected a method for this word in this session
    if (selectedMethodsMap.has(currentWord.id)) {
      const cachedMethod = selectedMethodsMap.get(currentWord.id)!;
      console.log(`[Method Selector] Word ${currentIndex + 1}/${processedWords.length}: "${currentWord.spanishWord}" → Method: ${cachedMethod} (CACHED)`);
      return cachedMethod;
    }

    const context: MethodSelectionContext = {
      word: currentWord,
      recentHistory: methodHistory.slice(-5), // Last 5 methods
      performance: methodPerformance,
      userLevel,
    };

    const selection = selectReviewMethod(context, DEFAULT_METHOD_SELECTOR_CONFIG);
    
    // Cache the selected method to prevent it from changing across re-renders
    selectedMethodsMap.set(currentWord.id, selection.method);
    
    console.log(`[Method Selector] Word ${currentIndex + 1}/${processedWords.length}: "${currentWord.spanishWord}" → Method: ${selection.method} (${(selection.confidence * 100).toFixed(0)}% confidence) [FIRST SELECTION]`);
    
    return selection.method;
  }, [currentWord, methodHistory, methodPerformance, userLevel, currentIndex, processedWords.length, selectedMethodsMap]);

  // Reset state when moving to next card
  // Align with test interface: mixed = alternating ES→EN, EN→ES per card (same as /review/test)
  useEffect(() => {
    console.log('[Direction Effect] Triggered for currentIndex:', currentIndex, 'currentWord:', currentWord?.spanishWord);
    if (config.direction === 'mixed') {
      setCurrentDirection(currentIndex % 2 === 0 ? 'spanish-to-english' : 'english-to-spanish');
    }
  }, [currentIndex, config.direction, currentWord]);

  // Phase 18 UX Fix: Debug direction flow (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Direction Debug]', {
        configDirection: config.direction,
        currentDirection,
        currentIndex,
        wordId: currentWord?.id,
        wordSpanish: currentWord?.spanishWord,
        wordEnglish: currentWord?.englishTranslation,
      });
    }
  }, [config.direction, currentDirection, currentIndex, currentWord]);

  // Phase 18.2.2: Generate elaborative prompt when deep learning card is shown
  // Uses client-safe template generation (no server dependencies)
  useEffect(() => {
    if (!showDeepLearningCard || !deepLearningWord || deepLearningPrompt !== null) return;

    console.log('[Deep Learning] Generating template prompt for:', deepLearningWord.spanishWord);
    
    // Generate template-based prompt (instant, no async needed)
    const wordForPrompt = {
      id: deepLearningWord.id,
      spanish: deepLearningWord.spanishWord,
      english: deepLearningWord.englishTranslation,
      partOfSpeech: deepLearningWord.partOfSpeech ?? undefined,
    };

    const prompt = generateTemplatePrompt(wordForPrompt);
    setDeepLearningPrompt(prompt);
  }, [showDeepLearningCard, deepLearningWord, deepLearningPrompt]);

  /**
   * Handle method completion
   */
  const handleMethodComplete = (methodResult: ReviewMethodResult) => {
    if (!currentWord) {
      console.warn('[handleMethodComplete] Called with no currentWord');
      return;
    }

    // Guard: Prevent duplicate results
    const isDuplicate = results.some(r => r.vocabularyId === currentWord.id);
    if (isDuplicate) {
      console.warn('[handleMethodComplete] DUPLICATE BLOCKED:', currentWord.spanishWord);
      return;
    }

    console.log('[handleMethodComplete] Processing:', {
      word: currentWord.spanishWord,
      method: methodResult.method,
      rating: methodResult.rating,
      currentIndex,
      totalWords: processedWords.length
    });

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
      mode: config.mode || 'recognition',  // Phase 18.2: Default for backward compatibility, actual method in reviewMethod
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

    // Phase 18.2.2: Check if should show deep learning card (every N cards)
    // Defensive: wrap in try-catch so errors don't block advancement
    let shouldShowDeepLearning = false;
    try {
      shouldShowDeepLearning = 
        deepLearningEnabled === true && 
        typeof deepLearningFrequency === 'number' &&
        deepLearningFrequency > 0 &&
        newResults.length % deepLearningFrequency === 0 && 
        newResults.length > 0 &&
        currentIndex < processedWords.length - 1;
      
      if (shouldShowDeepLearning) {
        console.log(`[Deep Learning] ✨ Showing card after ${newResults.length} cards (frequency: ${deepLearningFrequency})`);
      }
    } catch (error) {
      console.error('[Deep Learning] Error checking trigger condition:', error);
      shouldShowDeepLearning = false; // Fail gracefully - don't block advancement
    }

    if (shouldShowDeepLearning) {
      // Show deep learning card for the word we just reviewed
      setDeepLearningWord(currentWord);
      setShowDeepLearningCard(true);
      // Don't advance index yet - will advance after deep learning card completes
    } else {
      // Normal flow: advance to next card or complete session
      if (currentIndex < processedWords.length - 1) {
        console.log(`[handleMethodComplete] ➡️ Advancing from card ${currentIndex + 1} to ${currentIndex + 2}`);
        setCurrentIndex(currentIndex + 1);
      } else {
        console.log('[handleMethodComplete] 🎉 Session complete, showing dialog');
        setShowCompletionDialog(true);
      }
    }
  };

  /**
   * Handle session completion confirmation
   * Phase 18: Issue #4 Fix - Prevent double-save with loading state
   */
  const handleConfirmComplete = () => {
    // Guard: Prevent re-entry if already saving
    if (isSaving) {
      console.warn('[handleConfirmComplete] Already saving, ignoring duplicate click');
      return;
    }
    
    console.log('[handleConfirmComplete] Saving session, disabling button...');
    setIsSaving(true);
    
    // Call parent completion handler
    // Note: Parent will handle navigation, we just need to prevent multiple calls
    onComplete(results);
  };

  /**
   * Handle session cancellation
   */
  const handleCancel = () => {
    console.log('[handleCancel] ⚠️ CANCEL TRIGGERED! Results:', results.length, 'Stack trace:', new Error().stack);
    
    if (results.length > 0) {
      if (confirm(`You've reviewed ${results.length} card${results.length === 1 ? '' : 's'}. Save progress?`)) {
        onComplete(results);
      } else {
        onCancel();
      }
    } else {
      console.log('[handleCancel] No results yet - calling onCancel()');
      onCancel();
    }
  };

  /**
   * Handle deep learning card completion (Phase 18.2.2)
   * User has dismissed the deep learning prompt - continue to next card
   */
  const handleDeepLearningComplete = async (response: {
    skipped: boolean;
    userResponse?: string;
    responseTime: number;
  }) => {
    console.log('[Deep Learning] Card completed:', { 
      skipped: response.skipped, 
      responseTime: response.responseTime,
      hasResponse: !!response.userResponse,
      responseLength: response.userResponse?.length || 0
    });
    
    // Record response to database (Phase 18.2.2 completion)
    // Always attempt to save - API will handle auth check
    if (deepLearningWord && deepLearningPrompt) {
      try {
        console.log('[Deep Learning] 💾 Attempting to save response...');
        const saveResponse = await fetch('/api/deep-learning/record-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordId: deepLearningWord.id,
            promptType: deepLearningPrompt.type,
            question: deepLearningPrompt.question,
            userResponse: response.userResponse || null,
            skipped: response.skipped,
            responseTime: response.responseTime,
          }),
        });
        
        if (saveResponse.ok) {
          console.log('[Deep Learning] ✅ Response saved to database');
        } else {
          const errorText = await saveResponse.text();
          console.error('[Deep Learning] ❌ Failed to save response:', errorText);
          // If user not authenticated, they might be guest
          if (saveResponse.status === 401) {
            console.log('[Deep Learning] ℹ️ User not authenticated - response not saved');
          }
        }
      } catch (error) {
        console.error('[Deep Learning] ❌ Error saving response:', error);
        // Don't block user flow if save fails
      }
    } else {
      console.warn('[Deep Learning] ⚠️ Missing data:', {
        hasWord: !!deepLearningWord,
        hasPrompt: !!deepLearningPrompt,
      });
    }
    
    // Clear deep learning state
    setShowDeepLearningCard(false);
    setDeepLearningWord(null);
    setDeepLearningPrompt(null);
    
    // Now advance to next card or complete session
    if (currentIndex < processedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompletionDialog(true);
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
            disabled={isSaving}
            className={`
              w-full px-6 py-4 rounded-xl font-semibold transition-all
              ${isSaving 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70' 
                : 'bg-accent text-white hover:opacity-90 active:scale-[0.98]'
              }
            `}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Current method metadata for display
  const methodMetadata = REVIEW_METHOD_METADATA[selectedMethod];

  // Use full vocabulary for methods that need allWords (same as test interface)
  const wordsForMethods = allWordsProp && allWordsProp.length > 0 ? allWordsProp : processedWords;

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

            <div className="flex items-center gap-3 text-sm text-text-secondary">
              {/* Phase 18 UX Fix: Direction indicator */}
              {/* Audio Recognition is ALWAYS ES→EN (Spanish audio only) */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                (selectedMethod === 'audio-recognition' || currentDirection === 'spanish-to-english')
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-purple-50 dark:bg-purple-900/20'
              }`}>
                {(selectedMethod === 'audio-recognition' || currentDirection === 'spanish-to-english') ? (
                  <>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">ES</span>
                    <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">EN</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">EN</span>
                    <ArrowRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">ES</span>
                  </>
                )}
              </div>
              
              {/* Method indicator */}
              <span className="hidden sm:inline">{methodMetadata.icon} {methodMetadata.name}</span>
              
              {/* Card counter */}
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

      {/* Phase 18.2.2: Deep Learning Card or Method component */}
      <div className="max-w-4xl mx-auto">
        {(() => {
          // Deep Learning Card takes precedence when active
          if (showDeepLearningCard && deepLearningWord) {
            console.log('[Render Decision] Showing Deep Learning Card for:', deepLearningWord.spanishWord);
            
            // Wait for prompt to generate (should be instant with templates)
            if (!deepLearningPrompt) {
              return (
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center space-y-4">
                    <div className="text-6xl animate-pulse">🧠</div>
                    <p className="text-lg text-text">Preparing deep learning moment...</p>
                  </div>
                </div>
              );
            }
            
            // Render Deep Learning Card
            return (
              <DeepLearningCard
                word={{
                  spanish: deepLearningWord.spanishWord,
                  english: deepLearningWord.englishTranslation,
                }}
                prompt={deepLearningPrompt}
                onComplete={handleDeepLearningComplete}
              />
            );
          }
          
          // Normal flow: render method component
          console.log('[Render Decision] currentWord:', currentWord?.spanishWord, 'selectedMethod:', selectedMethod);
          
          if (!currentWord) {
            return (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                  <div className="text-4xl">⏳</div>
                  <p className="text-text-secondary">Loading card...</p>
                </div>
              </div>
            );
          }
          
          return (
            <>
              {selectedMethod === 'traditional' && (
                <>
                  {console.log('[Rendering] Traditional component for:', currentWord.spanishWord)}
                  <TraditionalReview
                    word={currentWord}
                    direction={currentDirection}
                    cardNumber={`${results.length + 1} of ${processedWords.length}`}
                    onComplete={handleMethodComplete}
                  />
                </>
              )}

              {selectedMethod === 'fill-blank' && (
                <>
                  {console.log('[Rendering] Fill-Blank component for:', currentWord.spanishWord)}
                  <FillBlankReview
                    word={currentWord}
                    direction={currentDirection}
                    cardNumber={`${results.length + 1} of ${processedWords.length}`}
                    onComplete={handleMethodComplete}
                  />
                </>
              )}

              {selectedMethod === 'multiple-choice' && (
                <>
                  {console.log('[Rendering] Multiple-Choice component for:', currentWord.spanishWord)}
                  <MultipleChoiceReview
                    word={currentWord}
                    allWords={wordsForMethods}
                    direction={currentDirection}
                    cardNumber={`${results.length + 1} of ${processedWords.length}`}
                    onComplete={handleMethodComplete}
                  />
                </>
              )}

              {selectedMethod === 'audio-recognition' && (
                <>
                  {console.log('[Rendering] Audio-Recognition component for:', currentWord.spanishWord)}
                  <AudioRecognitionReview
                    word={currentWord}
                    cardNumber={`${results.length + 1} of ${processedWords.length}`}
                    onComplete={handleMethodComplete}
                  />
                </>
              )}

              {selectedMethod === 'context-selection' && (
                <>
                  {console.log('[Rendering] Context-Selection component for:', currentWord.spanishWord)}
                  <ContextSelectionReview
                    word={currentWord}
                    allWords={wordsForMethods}
                    direction={currentDirection}
                    cardNumber={`${results.length + 1} of ${processedWords.length}`}
                    onComplete={handleMethodComplete}
                  />
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
