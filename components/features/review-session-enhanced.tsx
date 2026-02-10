"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, RotateCcw } from "lucide-react";
import { FlashcardEnhanced } from "./flashcard-enhanced";
import type { VocabularyWord, DifficultyRating } from "@/lib/types/vocabulary";
import type { StudySessionConfig, ExtendedReviewResult, ReviewDirection } from "@/lib/types/review";

/**
 * Enhanced Review Session Component - Phase 8
 * 
 * Supports:
 * - Bidirectional review
 * - Multiple review modes (Recognition, Recall, Listening)
 * - Custom session configuration
 * - Extended review results with mode-specific data
 */

interface ReviewSessionEnhancedProps {
  /** Array of vocabulary words to review */
  words: VocabularyWord[];
  /** Session configuration */
  config: StudySessionConfig;
  /** Callback when session is completed or exited */
  onComplete: (results: ExtendedReviewResult[]) => void;
  /** Callback when session is cancelled */
  onCancel: () => void;
}

export function ReviewSessionEnhanced({
  words,
  config,
  onComplete,
  onCancel,
}: ReviewSessionEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<ExtendedReviewResult[]>([]);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<ReviewDirection>(
    config.direction === 'mixed' ? 'spanish-to-english' : config.direction
  );
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Scroll to top when component mounts (fixes inherited scroll position from config page)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  // Process words based on configuration
  const processedWords = useMemo(() => {
    let filtered = [...words];
    
    // Apply session size limit
    filtered = filtered.slice(0, config.sessionSize);
    
    // Randomize if configured
    if (config.randomize !== false) {  // Phase 18.2: Default to true for backward compatibility
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    
    return filtered;
  }, [words, config]);

  const currentWord = processedWords[currentIndex];
  // Clamp progress to max 100% to prevent display issues
  const progress = Math.min(((results.length) / processedWords.length) * 100, 100);
  const isSessionComplete = results.length === processedWords.length;

  // Reset card state when moving to next card
  useEffect(() => {
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setAudioPlayCount(0);
    
    // For mixed mode, randomly choose direction for each card
    if (config.direction === 'mixed') {
      setCurrentDirection(Math.random() > 0.5 ? 'spanish-to-english' : 'english-to-spanish');
    }
  }, [currentIndex, config.direction]);

  /**
   * Handle difficulty rating selection
   * Records the extended result and moves to next card
   */
  const handleRating = (rating: DifficultyRating) => {
    if (!currentWord) return;

    // Guard: Prevent duplicate ratings for the same word
    if (results.some(r => r.vocabularyId === currentWord.id)) {
      return;
    }

    const timeSpent = Date.now() - cardStartTime;

    const result: ExtendedReviewResult = {
      vocabularyId: currentWord.id,
      rating,
      mode: config.mode || 'recognition',  // Phase 18.2: Default to recognition if algorithm hasn't set mode
      direction: currentDirection,
      reviewedAt: new Date(),
      timeSpent,
      ...(config.mode === 'listening' && { audioPlayCount }),
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Move to next card or complete session
    if (currentIndex < processedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete - show completion dialog
      setShowCompletionDialog(true);
    }
  };

  /**
   * Handle answer submission from recall/listening modes
   */
  const handleAnswerSubmit = (userAnswer: string, isCorrect: boolean, similarity: number) => {
    // Guard: Prevent duplicate results for the same word
    if (results.some(r => r.vocabularyId === currentWord.id)) {
      return;
    }
    
    const timeSpent = Date.now() - cardStartTime;

    const rating: DifficultyRating = isCorrect
      ? similarity >= 0.95
        ? 'easy'
        : 'good'
      : similarity >= 0.70
      ? 'hard'
      : 'forgot';

    const correctAnswer = currentDirection === 'spanish-to-english'
      ? currentWord.englishTranslation
      : currentWord.spanishWord;

    const result: ExtendedReviewResult = {
      vocabularyId: currentWord.id,
      rating,
      mode: config.mode || 'recognition',  // Phase 18.2: Default to recognition if algorithm hasn't set mode
      direction: currentDirection,
      reviewedAt: new Date(),
      timeSpent,
      recallAttempt: {
        userAnswer,
        correctAnswer,
        isCorrect,
        similarityScore: similarity,
        timeToAnswer: timeSpent,
      },
      ...(config.mode === 'listening' && { audioPlayCount }),
    };
    
    const newResults = [...results, result];
    setResults(newResults);

    // No automatic advancement - user controls when to proceed
    // This gives learners time to reflect on their answer
  };

  /**
   * Handle audio play event
   */
  const handleAudioPlay = () => {
    setAudioPlayCount(prev => prev + 1);
  };

  /**
   * Handle continue to next card after user reviews feedback
   */
  const handleContinue = () => {
    if (currentIndex < processedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete - show completion dialog
      setShowCompletionDialog(true);
    }
  };

  /**
   * Handle final completion after viewing summary
   */
  const handleFinalComplete = () => {
    onComplete(results);
  };

  /**
   * Navigate to previous card
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  /**
   * Navigate to next card (only if already rated)
   */
  const handleNext = () => {
    const hasRatedCurrent = results.some(r => r.vocabularyId === currentWord.id);
    if (hasRatedCurrent && currentIndex < processedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /**
   * Toggle card flip state (recognition mode only)
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Handle session cancellation
   */
  const handleCancel = () => {
    if (results.length > 0) {
      const confirmExit = window.confirm(
        "Are you sure you want to exit? Your progress will be saved."
      );
      if (confirmExit) {
        onComplete(results); // Save partial results
      }
    } else {
      onCancel();
    }
  };

  /**
   * Restart session
   */
  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setIsFlipped(false);
    setCardStartTime(Date.now());
    setAudioPlayCount(0);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Recognition mode: number keys for rating (only when card is flipped)
      if (config.mode === 'recognition' && isFlipped) {
        if (e.key === "1") {
          e.preventDefault();
          handleRating("forgot");
          return;
        } else if (e.key === "2") {
          e.preventDefault();
          handleRating("hard");
          return;
        } else if (e.key === "3") {
          e.preventDefault();
          handleRating("good");
          return;
        } else if (e.key === "4") {
          e.preventDefault();
          handleRating("easy");
          return;
        }
      }

      // Navigation keys
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight" && (isFlipped || config.mode !== 'recognition')) {
        handleNext();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFlipped, results, config.mode]);

  if (processedWords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-4">
          <p className="text-lg text-text-secondary">No cards to review</p>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-accent text-white rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show completion dialog
  if (showCompletionDialog) {
    const sessionDuration = Date.now() - sessionStartTime;
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);
    const correctCount = results.filter(r => r.rating !== 'forgot').length;
    const accuracyRate = Math.round((correctCount / results.length) * 100);
    
    const easyCount = results.filter(r => r.rating === 'easy').length;
    const goodCount = results.filter(r => r.rating === 'good').length;
    const hardCount = results.filter(r => r.rating === 'hard').length;
    const forgotCount = results.filter(r => r.rating === 'forgot').length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-bg-primary rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-300">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-text">Review Complete!</h2>
            <p className="text-text-secondary">Great job on completing your session</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-accent">{results.length}</div>
              <div className="text-xs text-text-secondary mt-1">Cards Reviewed</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-accent">{accuracyRate}%</div>
              <div className="text-xs text-text-secondary mt-1">Accuracy</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-text">
                {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
              </div>
              <div className="text-xs text-text-secondary mt-1">Time Spent</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-text">{correctCount}/{results.length}</div>
              <div className="text-xs text-text-secondary mt-1">Correct</div>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary">Performance Breakdown:</p>
            <div className="space-y-1.5">
              {easyCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>🎉</span>
                    <span className="text-text">Easy</span>
                  </span>
                  <span className="font-medium text-text">{easyCount}</span>
                </div>
              )}
              {goodCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>😊</span>
                    <span className="text-text">Good</span>
                  </span>
                  <span className="font-medium text-text">{goodCount}</span>
                </div>
              )}
              {hardCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>🤔</span>
                    <span className="text-text">Hard</span>
                  </span>
                  <span className="font-medium text-text">{hardCount}</span>
                </div>
              )}
              {forgotCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>😞</span>
                    <span className="text-text">Forgot</span>
                  </span>
                  <span className="font-medium text-text">{forgotCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleFinalComplete}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Continue to Home
            </button>
            <p className="text-xs text-center text-text-tertiary">
              Your progress is being saved...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden" style={{maxHeight: '100vh', height: '100vh'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 md:px-4 border-b border-separator flex-shrink-0">
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Exit review session"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="flex-1 mx-2 md:mx-3">
          <div className="flex items-center justify-between mb-1.5">
            {/* Card counter - left */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">
                Card {currentIndex + 1}
              </span>
              <span className="text-xs text-text-tertiary">
                of {processedWords.length}
              </span>
            </div>
            
            {/* Mode and direction - center (smaller and less prominent) */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-tertiary">
              <span>{config.mode === 'recognition' ? '👁️' : config.mode === 'recall' ? '⌨️' : '🎧'}</span>
              <span>{currentDirection === 'spanish-to-english' ? 'ES→EN' : 'EN→ES'}</span>
            </div>
            
            {/* Progress percentage - right */}
            <span className="text-sm font-semibold text-accent">
              {Math.round(progress)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Restart session"
        >
          <RotateCcw className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Flashcard Area */}
      <div 
        className="flex-1 flex items-center justify-center px-3 py-2 md:px-4 md:py-3 overflow-hidden min-h-0"
        onClick={() => {
          // On mobile, clicking anywhere flips the card
          if (window.innerWidth < 768 && config.mode === 'recognition') {
            handleFlip();
          }
        }}
      >
        <FlashcardEnhanced
          word={currentWord}
          direction={currentDirection}
          mode={config.mode}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          onAnswerSubmit={handleAnswerSubmit}
          onAudioPlay={handleAudioPlay}
          onContinue={handleContinue}
          cardNumber={`Card ${currentIndex + 1} of ${processedWords.length}`}
          onRate={config.mode === 'recognition' && isFlipped ? handleRating : undefined}
        />
      </div>

      {/* Keyboard Hints - Below divider */}
      <div className="px-3 pt-2 pb-16 md:px-4 md:pt-3 md:pb-20 border-t border-separator flex-shrink-0">
        <div className="flex flex-wrap justify-center gap-3 text-[11px] text-text-tertiary">
          {config.mode === 'recognition' && !isFlipped && <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">Space/Enter Flip</span>}
          {config.mode === 'recognition' && isFlipped && <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">Tap or press Enter to reveal</span>}
          {!(config.mode === 'recognition' && isFlipped) && (
            <>
              <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">← → Navigate</span>
              <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">Esc Exit</span>
            </>
        )}
          </div>
      </div>

    </div>
  );
}

