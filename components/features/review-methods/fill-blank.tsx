/**
 * Fill in the Blank Review Method Component - Phase 18.1 Task 4
 * 
 * User must type the missing word in a sentence context
 * Tests both recall and spelling in a practical context
 * 
 * Features:
 * - Fuzzy matching for minor typos (using answer-checker utility)
 * - Real-time feedback (correct/incorrect)
 * - Shows correct answer if wrong
 * - Auto-advances after rating
 * - Mobile-friendly keyboard
 * - Supports Spanish special characters (á, é, í, ó, ú, ñ, ü)
 * 
 * @module components/features/review-methods/fill-blank
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { ReviewMethodResult } from '@/lib/types/review-methods';
import { checkAnswer, checkSpanishAnswer } from '@/lib/utils/answer-checker';

export interface FillBlankReviewProps {
  /** The vocabulary word to review */
  word: VocabularyWord;
  
  /** Review direction */
  direction: 'spanish-to-english' | 'english-to-spanish';
  
  /** Card number (e.g., "1 of 20") */
  cardNumber?: string;
  
  /** Callback when user completes the review */
  onComplete: (result: ReviewMethodResult) => void;
}

export function FillBlankReview({
  word,
  direction,
  cardNumber,
  onComplete,
}: FillBlankReviewProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [startTime] = useState(Date.now());
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Select a random example sentence
  const example = word.examples && word.examples.length > 0
    ? word.examples[Math.floor(Math.random() * word.examples.length)]
    : null;

  // Determine which word to fill in based on direction
  const targetWord = direction === 'spanish-to-english'
    ? word.englishTranslation
    : word.spanishWord;

  const sentenceToUse = example
    ? (direction === 'spanish-to-english' ? example.spanish : example.english)
    : (direction === 'spanish-to-english' ? word.spanishWord : word.englishTranslation);

  // Create the fill-in-the-blank sentence
  // Replace the target word with a blank
  const blankSentence = example
    ? sentenceToUse.replace(
        new RegExp(`\\b${targetWord}\\b`, 'gi'),
        '______'
      )
    : `______ means "${direction === 'spanish-to-english' ? word.englishTranslation : word.spanishWord}"`;

  // Auto-focus input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle answer submission
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted || !userAnswer.trim()) return;

    // Check answer using appropriate checker
    const result = direction === 'english-to-spanish'
      ? checkSpanishAnswer(userAnswer.trim(), targetWord)
      : checkAnswer(userAnswer.trim(), targetWord);

    setIsSubmitted(true);
    setIsCorrect(result.isCorrect);
    setSimilarity(result.similarity);
    setFeedback(result.feedback);
  };

  /**
   * Handle rating selection
   */
  const handleRating = (rating: DifficultyRating) => {
    if (ratingSubmitted) return;

    setRatingSubmitted(true);

    const timeSpent = Date.now() - startTime;

    const methodResult: ReviewMethodResult = {
      wordId: word.id,
      method: 'fill-blank',
      rating,
      timeSpent,
      isCorrect,
      userAnswer: userAnswer.trim(),
      similarity,
    };

    onComplete(methodResult);
  };

  /**
   * Get rating suggestion based on performance
   */
  const getSuggestedRating = (): DifficultyRating => {
    if (!isCorrect) return 'forgot';
    if (similarity >= 0.95) return 'easy';
    if (similarity >= 0.85) return 'good';
    return 'hard';
  };

  /**
   * Handle Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isSubmitted) {
        handleSubmit();
      }
    }
  };

  /**
   * Show hint (first letter)
   */
  const handleShowHint = () => {
    setShowHint(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-2xl mx-auto">
      {/* Question card - Compact for mobile-first */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
        {/* Sentence with blank */}
        <div className="text-center p-4 sm:p-5 bg-accent/5 rounded-xl border border-accent/20">
          <p className="text-lg sm:text-xl md:text-2xl text-text leading-snug">
            {blankSentence}
          </p>
        </div>

        {/* Translation hint */}
        {example && (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-text-secondary italic">
              "{direction === 'spanish-to-english' ? example.english : example.spanish}"
            </p>
          </div>
        )}

        {/* Hint button */}
        {!isSubmitted && !showHint && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleShowHint}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-text-tertiary hover:text-accent transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Show first letter</span>
            </button>
          </div>
        )}

        {/* Hint display */}
        {showHint && !isSubmitted && (
          <div className="text-center p-2 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              💡 Starts with: <span className="font-bold">{targetWord[0]}</span>
            </p>
          </div>
        )}

        {/* Answer input */}
        {!isSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="w-full px-4 py-2.5 sm:py-3 text-base sm:text-lg text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-900 text-text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            
            {/* Spanish character helpers */}
            {direction === 'english-to-spanish' && (
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setUserAnswer(prev => prev + char)}
                    className="px-2.5 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-text rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="w-full px-6 py-2.5 sm:py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Check Answer
            </button>
          </form>
        )}

        {/* Answer feedback */}
        {isSubmitted && (
          <div className="space-y-3">
            {/* Result indicator - Simplified */}
            <div className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl ${
              isCorrect
                ? 'bg-green-500/10 border-2 border-green-500/30'
                : 'bg-red-500/10 border-2 border-red-500/30'
            }`}>
              {isCorrect ? (
                <>
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  <span className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                    {similarity >= 0.95 ? 'Perfect!' : 'Correct!'}
                  </span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  <span className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            {/* Show correct answer if wrong - Compact */}
            {!isCorrect && (
              <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-1">
                <p className="text-xs text-text-tertiary">Correct answer:</p>
                <p className="text-lg sm:text-xl font-bold text-accent">{targetWord}</p>
                <p className="text-xs sm:text-sm text-text-secondary">Your answer: "{userAnswer}"</p>
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
