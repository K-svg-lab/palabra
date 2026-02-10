/**
 * Multiple Choice Review Method Component - Phase 18.1 Task 4
 * 
 * User selects the correct translation from 4 options
 * Easiest method - focuses on recognition rather than recall
 * 
 * Directionality Preserved (Translation Recognition):
 * - ES→EN: Spanish word → Choose English translation
 * - EN→ES: English word → Choose Spanish translation
 * - Tests direct translation knowledge, not contextual comprehension
 * 
 * Features:
 * - 4 answer options (1 correct + 3 distractors)
 * - Intelligent distractor generation (similar words from vocabulary)
 * - Keyboard shortcuts (1-4 keys)
 * - Immediate visual feedback
 * - Mobile-friendly large touch targets
 * - Auto-advances after rating
 * 
 * @module components/features/review-methods/multiple-choice
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { ReviewMethodResult, MultipleChoiceOption } from '@/lib/types/review-methods';

export interface MultipleChoiceReviewProps {
  /** The vocabulary word to review */
  word: VocabularyWord;
  
  /** All vocabulary words (for generating distractors) */
  allWords: VocabularyWord[];
  
  /** Review direction */
  direction: 'spanish-to-english' | 'english-to-spanish';
  
  /** Card number (e.g., "1 of 20") */
  cardNumber?: string;
  
  /** Callback when user completes the review */
  onComplete: (result: ReviewMethodResult) => void;
}

export function MultipleChoiceReview({
  word,
  allWords,
  direction,
  cardNumber,
  onComplete,
}: MultipleChoiceReviewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate options
  const [options] = useState<MultipleChoiceOption[]>(() => 
    generateOptions(word, allWords, direction)
  );

  // Get question and correct answer based on direction
  const question = direction === 'spanish-to-english'
    ? word.spanishWord
    : word.englishTranslation;

  const correctAnswerText = direction === 'spanish-to-english'
    ? word.englishTranslation
    : word.spanishWord;

  // Auto-focus container for keyboard events
  useEffect(() => {
    console.log('[MultipleChoiceReview] 🎯 MOUNTED for word:', word.spanishWord, 'options:', options.length);
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }, 100);
    return () => {
      console.log('[MultipleChoiceReview] 🎯 UNMOUNTING word:', word.spanishWord);
      clearTimeout(timer);
    };
  }, [word.spanishWord, options.length]);

  // Enable keyboard shortcuts after delay to prevent accidental triggers during page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyboardEnabled(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle option selection
   */
  const handleSelectOption = (optionId: string) => {
    console.log('[MultipleChoiceReview] 🎯 handleSelectOption called, optionId:', optionId, 'isSubmitted:', isSubmitted, 'Stack:', new Error().stack);
    if (isSubmitted || ratingSubmitted) return;

    setSelectedOption(optionId);
    setIsSubmitted(true);

    const selectedOpt = options.find(o => o.id === optionId);
    if (selectedOpt) {
      setIsCorrect(selectedOpt.isCorrect);
    }
  };

  /**
   * Handle rating selection
   */
  const handleRating = (rating: DifficultyRating) => {
    console.log('[MultipleChoiceReview] 📊 Rating submitted:', rating, 'for word:', word.spanishWord);
    if (ratingSubmitted) return;

    setRatingSubmitted(true);

    const timeSpent = Date.now() - startTime;

    const methodResult: ReviewMethodResult = {
      wordId: word.id,
      method: 'multiple-choice',
      rating,
      timeSpent,
      isCorrect,
      selectedOptionId: selectedOption || undefined,
    };

    console.log('[MultipleChoiceReview] 🚀 Calling onComplete with result:', methodResult);
    onComplete(methodResult);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('[MultipleChoiceReview] ⌨️ Key pressed:', e.code, 'keyboardEnabled:', keyboardEnabled, 'isSubmitted:', isSubmitted);
    // Prevent accidental triggers during initial page load
    if (!keyboardEnabled) {
      console.log('[MultipleChoiceReview] ⌨️ KEY BLOCKED - keyboard not enabled yet');
      return;
    }

    if (isSubmitted && !ratingSubmitted) {
      // Rating shortcuts
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        const ratings: DifficultyRating[] = ['forgot', 'hard', 'good', 'easy'];
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        if (index >= 0 && index < 4) {
          handleRating(ratings[index]);
        }
      }
    } else if (!isSubmitted) {
      // Option selection shortcuts
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        if (index >= 0 && index < options.length) {
          handleSelectOption(options[index].id);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col items-center justify-center p-4 max-w-2xl mx-auto focus:outline-none"
    >
      {/* Question card - Compact for mobile-first */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
        {/* Question */}
        <div className="text-center p-4 sm:p-5 bg-accent/5 rounded-xl border border-accent/20">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-text">
            {question}
          </p>
        </div>

        {/* Options - Compact spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4">
          {options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = isSubmitted && option.isCorrect;
            const showIncorrect = isSubmitted && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isSubmitted}
                className={`
                  relative p-4 sm:p-5 rounded-xl border-2 transition-all min-h-[60px] sm:min-h-[70px] flex items-center justify-center
                  ${isSubmitted
                    ? showCorrect
                      ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400'
                      : showIncorrect
                        ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-text-tertiary opacity-50'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-text hover:border-accent hover:bg-accent/5 cursor-pointer'
                  }
                  disabled:cursor-not-allowed
                `}
                aria-label={`Option ${index + 1}: ${option.text}`}
              >
                {/* Option number badge */}
                <div className={`
                  absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${isSubmitted
                    ? showCorrect || showIncorrect
                      ? 'bg-transparent'
                      : 'bg-gray-200 dark:bg-gray-700 text-text-tertiary'
                    : 'bg-accent/20 text-accent'
                  }
                `}>
                  {isSubmitted ? (
                    showCorrect ? (
                      <Check className="w-4 h-4" />
                    ) : showIncorrect ? (
                      <X className="w-4 h-4" />
                    ) : (
                      index + 1
                    )
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Option text */}
                <span className="text-base sm:text-lg font-medium text-center px-4 sm:px-6">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback - Simplified */}
        {isSubmitted && (
          <div className="mt-3 sm:mt-4 space-y-3">
            {isCorrect ? (
              <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-xl border-2 border-green-500/30">
                <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                  ✓ Correct!
                </p>
              </div>
            ) : (
              <div className="text-center p-3 sm:p-4 bg-red-500/10 rounded-xl border-2 border-red-500/30">
                <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
                  ✗ Incorrect
                </p>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Correct: <span className="font-bold text-accent">{correctAnswerText}</span>
                </p>
              </div>
            )}

            {/* Rating buttons - Progressive disclosure */}
            {!ratingSubmitted && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button
                  onClick={() => handleRating('forgot')}
                  className="flex flex-col items-center gap-1 p-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 rounded-xl transition-colors min-h-[70px]"
                  aria-label="Rate as Forgot"
                >
                  <span className="text-2xl">😞</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">Forgot</span>
                </button>

                <button
                  onClick={() => handleRating('hard')}
                  className="flex flex-col items-center gap-1 p-3 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-orange-500/30 rounded-xl transition-colors min-h-[70px]"
                  aria-label="Rate as Hard"
                >
                  <span className="text-2xl">😕</span>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Hard</span>
                </button>

                <button
                  onClick={() => handleRating('good')}
                  className="flex flex-col items-center gap-1 p-3 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 rounded-xl transition-colors min-h-[70px]"
                  aria-label="Rate as Good"
                >
                  <span className="text-2xl">🙂</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Good</span>
                </button>

                <button
                  onClick={() => handleRating('easy')}
                  className="flex flex-col items-center gap-1 p-3 bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/30 rounded-xl transition-colors min-h-[70px]"
                  aria-label="Rate as Easy"
                >
                  <span className="text-2xl">😊</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Easy</span>
                </button>
              </div>
            )}

            {ratingSubmitted && (
              <p className="text-center text-sm text-text-secondary animate-pulse">
                Moving to next card...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate 4 multiple choice options (1 correct + 3 distractors)
 */
function generateOptions(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  direction: 'spanish-to-english' | 'english-to-spanish'
): MultipleChoiceOption[] {
  // Phase 18 UX Fix: Debug direction flow (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Multiple Choice] generateOptions called:', {
      direction,
      wordSpanish: word.spanishWord,
      wordEnglish: word.englishTranslation,
    });
  }
  
  // Preserve directionality for translation recognition
  // ES→EN: Spanish word → English options (receptive)
  // EN→ES: English word → Spanish options (productive)
  const correctAnswer = direction === 'spanish-to-english'
    ? word.englishTranslation
    : word.spanishWord;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Multiple Choice] Translation recognition:', {
      direction,
      correctAnswer,
      language: direction === 'spanish-to-english' ? 'English' : 'Spanish',
    });
  }

  // Filter out current word and get potential distractors
  const otherWords = allWords.filter(w => w.id !== word.id);

  // Get 3 random distractors in target language
  const distractors: string[] = [];
  const shuffled = [...otherWords].sort(() => Math.random() - 0.5);

  for (const w of shuffled) {
    const distractor = direction === 'spanish-to-english'
      ? w.englishTranslation
      : w.spanishWord;

    // Avoid duplicate distractors or ones matching correct answer
    if (distractor !== correctAnswer && !distractors.includes(distractor)) {
      distractors.push(distractor);
    }

    if (distractors.length >= 3) break;
  }

  // If we don't have enough words, generate placeholder distractors
  while (distractors.length < 3) {
    distractors.push(`Option ${distractors.length + 1}`);
  }

  // Create options array
  const options: MultipleChoiceOption[] = [
    {
      id: 'correct',
      text: correctAnswer,
      isCorrect: true,
    },
    ...distractors.map((text, i) => ({
      id: `distractor-${i}`,
      text,
      isCorrect: false,
    })),
  ];

  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}
