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
  
  // #region agent log
  useEffect(() => {
    const logLayout = () => {
      const header = document.querySelector('.flex.items-center.justify-between.p-4') as HTMLElement;
      const footer = document.querySelector('.p-3.border-t') as HTMLElement;
      const container = document.querySelector('.flex.flex-col.h-screen') as HTMLElement;
      const flashcardArea = document.querySelector('.flex-1.flex.items-center') as HTMLElement;
      if (header && footer && container && flashcardArea) {
        const headerHeight = header.getBoundingClientRect().height;
        const footerHeight = footer.getBoundingClientRect().height;
        const flashcardHeight = flashcardArea.getBoundingClientRect().height;
        const totalHeight = headerHeight + footerHeight + flashcardHeight;
        const viewportHeight = window.innerHeight;
        const isOverflowing = totalHeight > viewportHeight;
        fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'review-session.tsx:42',message:'Layout measurements',data:{headerHeight,footerHeight,flashcardHeight,totalHeight,viewportHeight,isOverflowing,scrollHeight:document.body.scrollHeight},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6,H7,H8'})}).catch(()=>{});
      }
    };
    logLayout();
    window.addEventListener('resize', logLayout);
    return () => window.removeEventListener('resize', logLayout);
  }, []);
  // #endregion
  
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
    // #region agent log
    const activeEl = document.activeElement as HTMLElement;
    const focusedElementInfo = activeEl ? {tag: activeEl.tagName, className: activeEl.className, id: activeEl.id, rect: activeEl.getBoundingClientRect()} : null;
    const logData = {location:'review-session.tsx:105',message:'handleFlip called',data:{isFlipped,focusedElement:focusedElementInfo},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'};
    console.log('[DEBUG]', logData);
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch((err)=>{console.log('[DEBUG] Fetch failed', err);});
    // #endregion
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
        // #region agent log
        const logData = {location:'review-session.tsx:154',message:'Enter/Space key in session handler',data:{key:e.key,isFlipped,activeElement:document.activeElement?.tagName,activeElementClass:document.activeElement?.className,target:e.target},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'};
        console.log('[DEBUG]', logData);
        fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch((err)=>{console.log('[DEBUG] Fetch failed', err);});
        // #endregion
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
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-separator flex-shrink-0 bg-bg-primary">
        <button
          onClick={handleCancel}
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Exit review session"
        >
          <X className="w-6 h-6 text-text-secondary" />
        </button>

        <div className="flex-1 mx-4 sm:mx-8 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text">
              {results.length} / {shuffledWords.length}
            </span>
            <span className="text-sm font-semibold text-accent">
              {Math.round(progress)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
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
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Flashcard Area - Centered with proper spacing */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <Flashcard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          cardNumber={`Card ${currentIndex + 1} of ${shuffledWords.length}`}
          onRate={isFlipped ? handleRating : undefined}
        />
      </div>

      {/* Footer - Keyboard Hints */}
      <div className="p-3 border-t border-separator flex-shrink-0 bg-bg-primary">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-xs font-mono">1-4</kbd>
            Rate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-xs font-mono">Enter</kbd>
            Flip
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-xs font-mono">← →</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-xs font-mono">Esc</kbd>
            Exit
          </span>
        </div>
      </div>
    </div>
  );
}

