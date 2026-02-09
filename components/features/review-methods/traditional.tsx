/**
 * Traditional Review Method Component - Phase 18.1 Task 4
 * 
 * Classic flip card review: Spanish → English (or English → Spanish)
 * User sees front, flips to reveal back, then self-assesses difficulty
 * 
 * Features:
 * - Tap/click to flip
 * - Keyboard shortcuts (Space, Enter)
 * - Smooth 300ms flip animation
 * - Integrated rating buttons on back
 * - Audio pronunciation support
 * - Mobile-optimized (touch targets ≥44px)
 * 
 * @module components/features/review-methods/traditional
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { ReviewMethodResult } from '@/lib/types/review-methods';
import { playAudio, isTTSBroken } from '@/lib/services/audio';

export interface TraditionalReviewProps {
  /** The vocabulary word to review */
  word: VocabularyWord;
  
  /** Review direction */
  direction: 'spanish-to-english' | 'english-to-spanish';
  
  /** Card number (e.g., "1 of 20") */
  cardNumber?: string;
  
  /** Callback when user rates the card */
  onComplete: (result: ReviewMethodResult) => void;
  
  /** Callback to play audio */
  onAudioPlay?: () => void;
}

export function TraditionalReview({
  word,
  direction,
  cardNumber,
  onComplete,
  onAudioPlay,
}: TraditionalReviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime] = useState(Date.now());
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine front and back text based on direction
  const frontText = direction === 'spanish-to-english' 
    ? word.spanishWord 
    : word.englishTranslation;
  
  const backText = direction === 'spanish-to-english'
    ? word.englishTranslation
    : word.spanishWord;

  // Auto-focus card for keyboard events
  useEffect(() => {
    console.log('[TraditionalReview] 🎴 MOUNTED for word:', word.spanishWord);
    const timer = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.focus();
      }
    }, 100);
    return () => {
      console.log('[TraditionalReview] 🎴 UNMOUNTING word:', word.spanishWord);
      clearTimeout(timer);
    };
  }, [word.spanishWord]);

  // Enable keyboard shortcuts after delay to prevent accidental triggers during page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyboardEnabled(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle card flip
   */
  const handleFlip = () => {
    if (!isFlipped && !ratingSubmitted) {
      setIsFlipped(true);
    }
  };

  /**
   * Handle audio playback
   */
  const handleAudioPlay = async () => {
    setIsPlaying(true);
    try {
      // Play Spanish pronunciation
      await playAudio('', word.spanishWord);
      if (onAudioPlay) {
        onAudioPlay();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  /**
   * Handle rating button click
   */
  const handleRating = (rating: DifficultyRating) => {
    if (ratingSubmitted) return;
    
    console.log('[TraditionalReview] 📊 Rating submitted:', rating, 'for word:', word.spanishWord);
    setRatingSubmitted(true);
    
    const timeSpent = Date.now() - startTime;
    const isCorrect = rating !== 'forgot';
    
    const result: ReviewMethodResult = {
      wordId: word.id,
      method: 'traditional',
      rating,
      timeSpent,
      isCorrect,
    };
    
    console.log('[TraditionalReview] 🚀 Calling onComplete with result:', result);
    onComplete(result);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent accidental triggers during initial page load
    if (!keyboardEnabled) {
      return;
    }

    // Prevent default for all our shortcuts
    if (['Space', 'Enter', '1', '2', '3', '4'].includes(e.code)) {
      e.preventDefault();
    }

    // Flip card
    if ((e.code === 'Space' || e.code === 'Enter') && !isFlipped) {
      handleFlip();
      return;
    }

    // Rating shortcuts (only when flipped)
    if (isFlipped && !ratingSubmitted) {
      switch (e.code) {
        case 'Digit1':
          handleRating('forgot');
          break;
        case 'Digit2':
          handleRating('hard');
          break;
        case 'Digit3':
          handleRating('good');
          break;
        case 'Digit4':
          handleRating('easy');
          break;
      }
    }
  };

  /**
   * Reset card (for debugging - can be removed)
   */
  const handleReset = () => {
    setIsFlipped(false);
    setRatingSubmitted(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-2xl mx-auto">
      {/* Card number */}
      {cardNumber && (
        <div className="text-sm text-text-secondary mb-4 font-medium">
          {cardNumber}
        </div>
      )}

      {/* Method indicator */}
      <div className="flex items-center gap-2 mb-4 text-sm text-text-tertiary">
        <span className="text-lg">🎴</span>
        <span>Traditional Review</span>
      </div>

      {/* Flashcard container */}
      <div
        ref={cardRef}
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-md aspect-[3/2] cursor-pointer focus:outline-none focus:ring-4 focus:ring-accent/30 rounded-2xl transition-shadow"
        style={{ perspective: '1000px' }}
        aria-label={`Flashcard: ${isFlipped ? 'Showing answer' : 'Showing question'}`}
      >
        {/* Card inner - handles flip animation */}
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-out`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front of card */}
          <div
            className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="text-center space-y-6">
              <p className="text-4xl md:text-5xl font-bold text-text">
                {frontText}
              </p>
              
              {/* Audio button (if showing Spanish) */}
              {direction === 'spanish-to-english' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAudioPlay();
                  }}
                  disabled={isPlaying}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                  aria-label="Play pronunciation"
                >
                  <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium">Listen</span>
                </button>
              )}
              
              <p className="text-sm text-text-tertiary mt-8">
                {isFlipped ? 'Rating...' : 'Tap or press Space to reveal'}
              </p>
            </div>
          </div>

          {/* Back of card */}
          <div
            className="absolute inset-0 w-full h-full bg-accent/5 dark:bg-accent/10 rounded-2xl shadow-2xl border border-accent/30 flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center space-y-3">
              {/* Answer */}
              <div className="space-y-3">
                <p className="text-sm text-text-tertiary uppercase tracking-wide">Answer</p>
                <p className="text-4xl md:text-5xl font-bold text-accent">
                  {backText}
                </p>
              </div>

              {ratingSubmitted && (
                <p className="text-sm text-text-secondary animate-pulse mt-4">
                  Moving to next card...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons - OUTSIDE card, shown when flipped */}
      {isFlipped && !ratingSubmitted && (
        <div className="w-full max-w-md mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating('forgot');
              }}
              className="flex flex-col items-center gap-1 p-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 rounded-xl transition-colors min-h-[70px]"
              aria-label="Rate as Forgot"
            >
              <span className="text-2xl">😞</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Forgot</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating('hard');
              }}
              className="flex flex-col items-center gap-1 p-3 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-orange-500/30 rounded-xl transition-colors min-h-[70px]"
              aria-label="Rate as Hard"
            >
              <span className="text-2xl">😕</span>
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Hard</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating('good');
              }}
              className="flex flex-col items-center gap-1 p-3 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 rounded-xl transition-colors min-h-[70px]"
              aria-label="Rate as Good"
            >
              <span className="text-2xl">🙂</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Good</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating('easy');
              }}
              className="flex flex-col items-center gap-1 p-3 bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/30 rounded-xl transition-colors min-h-[70px]"
              aria-label="Rate as Easy"
            >
              <span className="text-2xl">😊</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Easy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
