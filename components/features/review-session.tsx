"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Flashcard } from "./flashcard";
import type { VocabularyWord, DifficultyRating } from "@/lib/types/vocabulary";

/**
 * Review Session Component
 * 
 * Manages a flashcard review session with navigation, progress tracking,
 * and self-assessment functionality.
 * 
 * Features:
 * - Card navigation (next/previous)
 * - Session progress indicator
 * - Card flip state management
 * - Self-assessment buttons (Forgot, Hard, Good, Easy)
 * - Randomized card order
 * - Session completion handling
 */

interface ReviewSessionProps {
  /** Array of vocabulary words to review */
  words: VocabularyWord[];
  /** Callback when session is completed or exited */
  onComplete: (results: ReviewResult[]) => void;
  /** Callback when session is cancelled */
  onCancel: () => void;
}

export interface ReviewResult {
  vocabularyId: string;
  rating: DifficultyRating;
  reviewedAt: Date;
}

export function ReviewSession({ words, onComplete, onCancel }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  
  // Randomize card order once on mount
  const shuffledWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];
  const progress = ((results.length) / shuffledWords.length) * 100;
  const isSessionComplete = results.length === shuffledWords.length;

  // Reset flip state when moving to next card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  /**
   * Handle difficulty rating selection
   * Records the result and moves to next card
   */
  const handleRating = (rating: DifficultyRating) => {
    if (!currentWord) return;

    const result: ReviewResult = {
      vocabularyId: currentWord.id,
      rating,
      reviewedAt: new Date()
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Move to next card or complete session
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      onComplete(newResults);
    }
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
    if (hasRatedCurrent && currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /**
   * Toggle card flip state
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys for rating (only when card is flipped)
      if (isFlipped) {
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
      } else if (e.key === "ArrowRight" && isFlipped) {
        handleNext();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFlipped, results]);

  if (shuffledWords.length === 0) {
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

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-separator flex-shrink-0">
        <button
          onClick={handleCancel}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Exit review session"
        >
          <X className="w-6 h-6 text-text-secondary" />
        </button>

        <div className="flex-1 mx-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">
              {results.length} / {shuffledWords.length}
            </span>
            <span className="text-sm font-medium text-text-secondary">
              {Math.round(progress)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <Flashcard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          cardNumber={`Card ${currentIndex + 1} of ${shuffledWords.length}`}
        />
      </div>

      {/* Navigation and Rating Controls */}
      <div className="p-4 md:p-6 space-y-4 border-t border-separator flex-shrink-0 pb-safe">
        {/* Self-Assessment Buttons (space always reserved to prevent layout shift) */}
        <div className={`space-y-2 transition-opacity duration-200 ${!isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <p className="text-xs text-center text-text-secondary font-medium">
            How well did you know this word?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => handleRating("forgot")}
              disabled={!isFlipped}
              className="py-3 px-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-difficulty-forgot text-white disabled:pointer-events-none flex flex-col items-center gap-1"
            >
              <div className="text-sm font-bold">1</div>
              <div className="text-base">😞</div>
              <div className="text-xs">Forgot</div>
            </button>
            <button
              onClick={() => handleRating("hard")}
              disabled={!isFlipped}
              className="py-3 px-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-difficulty-hard text-white disabled:pointer-events-none flex flex-col items-center gap-1"
            >
              <div className="text-sm font-bold">2</div>
              <div className="text-base">🤔</div>
              <div className="text-xs">Hard</div>
            </button>
            <button
              onClick={() => handleRating("good")}
              disabled={!isFlipped}
              className="py-3 px-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-difficulty-good text-white disabled:pointer-events-none flex flex-col items-center gap-1"
            >
              <div className="text-sm font-bold">3</div>
              <div className="text-base">😊</div>
              <div className="text-xs">Good</div>
            </button>
            <button
              onClick={() => handleRating("easy")}
              disabled={!isFlipped}
              className="py-3 px-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-difficulty-easy text-white disabled:pointer-events-none flex flex-col items-center gap-1"
            >
              <div className="text-sm font-bold">4</div>
              <div className="text-base">🎉</div>
              <div className="text-xs">Easy</div>
            </button>
          </div>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>

          <button
            onClick={handleNext}
            disabled={
              currentIndex === shuffledWords.length - 1 ||
              !results.some(r => r.vocabularyId === currentWord.id)
            }
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-text-tertiary">
          <span>1-4 Rate</span>
          <span>Space/Enter Flip</span>
          <span>← → Navigate</span>
          <span>Esc Exit</span>
        </div>
      </div>
    </div>
  );
}

