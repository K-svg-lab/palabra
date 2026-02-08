/**
 * Audio Recognition Review Method Component - Phase 18.1 Task 4
 * 
 * User hears the Spanish word and must identify/type the English translation
 * Hardest method - focuses on listening comprehension
 * 
 * Features:
 * - Auto-plays Spanish audio on load
 * - Option to replay audio
 * - Type answer or select from multiple choice (adaptive)
 * - Visual waveform indicator (optional)
 * - Fallback for TTS issues
 * 
 * @module components/features/review-methods/audio-recognition
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, Check, X, Eye, EyeOff } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { ReviewMethodResult } from '@/lib/types/review-methods';
import { playAudio, isTTSBroken } from '@/lib/services/audio';
import { checkAnswer } from '@/lib/utils/answer-checker';

export interface AudioRecognitionReviewProps {
  /** The vocabulary word to review */
  word: VocabularyWord;
  
  /** Card number (e.g., "1 of 20") */
  cardNumber?: string;
  
  /** Callback when user completes the review */
  onComplete: (result: ReviewMethodResult) => void;
}

export function AudioRecognitionReview({
  word,
  cardNumber,
  onComplete,
}: AudioRecognitionReviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [startTime] = useState(Date.now());
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showSpanish, setShowSpanish] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play audio on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlayAudio();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus input after audio plays
  useEffect(() => {
    if (hasPlayed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasPlayed]);

  /**
   * Play Spanish audio
   */
  const handlePlayAudio = async () => {
    setIsPlaying(true);
    setTtsError(false);
    
    try {
      await playAudio('', word.spanishWord);
      setHasPlayed(true);
    } catch (error) {
      console.error('Audio playback error:', error);
      setTtsError(true);
      setHasPlayed(true);
    } finally {
      setIsPlaying(false);
    }
  };

  /**
   * Handle answer submission
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted || !userAnswer.trim()) return;

    // Check answer
    const result = checkAnswer(userAnswer.trim(), word.englishTranslation);

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
      method: 'audio-recognition',
      rating,
      timeSpent,
      isCorrect,
      userAnswer: userAnswer.trim(),
      similarity,
    };

    onComplete(methodResult);
  };

  /**
   * Handle Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitted) {
      handleSubmit();
    }
  };

  /**
   * Toggle Spanish text visibility
   */
  const toggleShowSpanish = () => {
    setShowSpanish(!showSpanish);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-2xl mx-auto">
      {/* Question card - Compact for mobile-first */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
        {/* Audio player */}
        <div className="flex flex-col items-center space-y-3">
          {/* Play button */}
          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={`
              w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent text-white shadow-lg hover:shadow-xl transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
              ${isPlaying ? 'animate-pulse' : 'hover:scale-105'}
            `}
            aria-label="Play audio"
          >
            <Volume2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>

          {/* Status text */}
          <p className="text-xs sm:text-sm text-text-secondary">
            {isPlaying ? (
              <span className="animate-pulse">▶ Playing...</span>
            ) : hasPlayed ? (
              'Click to replay'
            ) : (
              'Click to play'
            )}
          </p>

          {/* TTS error fallback */}
          {ttsError && (
            <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 text-center">
              ⚠️ Audio unavailable - showing Spanish text
            </div>
          )}

          {/* Show Spanish text toggle */}
          {(ttsError || showSpanish) && (
            <div className="text-center p-3 sm:p-4 bg-accent/10 rounded-xl border-2 border-accent/30">
              <p className="text-xl sm:text-2xl font-bold text-accent">
                {word.spanishWord}
              </p>
            </div>
          )}

          {!ttsError && hasPlayed && !showSpanish && !isSubmitted && (
            <button
              onClick={toggleShowSpanish}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-text-tertiary hover:text-accent transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Show Spanish text</span>
            </button>
          )}

          {showSpanish && !ttsError && !isSubmitted && (
            <button
              onClick={toggleShowSpanish}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-text-tertiary hover:text-accent transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              <span>Hide Spanish text</span>
            </button>
          )}
        </div>

        {/* Answer input */}
        {!isSubmitted && hasPlayed && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type the English translation..."
              className="w-full px-4 py-2.5 sm:py-3 text-base sm:text-lg text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-900 text-text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

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

            {/* Show correct answer - Simplified for mobile */}
            {!isCorrect && (
              <div className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2">
                <div className="space-y-1">
                  <p className="text-xs text-text-tertiary">Spanish word:</p>
                  <p className="text-lg sm:text-xl font-bold text-accent">{word.spanishWord}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-tertiary">Correct answer:</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    {word.englishTranslation}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">Your answer: "{userAnswer}"</p>
              </div>
            )}

            {isCorrect && !showSpanish && (
              <div className="text-center p-3 sm:p-4 bg-accent/5 rounded-xl">
                <p className="text-xs text-text-tertiary mb-1">Spanish word:</p>
                <p className="text-lg sm:text-xl font-bold text-accent">{word.spanishWord}</p>
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
