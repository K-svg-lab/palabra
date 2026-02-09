/**
 * Context Selection Review Method Component - Phase 18.1 Task 4
 * 
 * User chooses the correct word to complete a sentence
 * Tests comprehension and contextual understanding
 * 
 * Features:
 * - Sentence with blank placeholder
 * - 4 word options (1 correct + 3 similar words)
 * - Translation hint
 * - Tests practical usage
 * - Mobile-friendly large touch targets
 * 
 * @module components/features/review-methods/context-selection
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import type { ReviewMethodResult } from '@/lib/types/review-methods';

export interface ContextSelectionReviewProps {
  /** The vocabulary word to review */
  word: VocabularyWord;
  
  /** All vocabulary words (for generating options) */
  allWords: VocabularyWord[];
  
  /** Review direction */
  direction: 'spanish-to-english' | 'english-to-spanish';
  
  /** Card number (e.g., "1 of 20") */
  cardNumber?: string;
  
  /** Callback when user completes the review */
  onComplete: (result: ReviewMethodResult) => void;
}

export function ContextSelectionReview({
  word,
  allWords,
  direction,
  cardNumber,
  onComplete,
}: ContextSelectionReviewProps) {
  console.log('[ContextSelectionReview] 🎭 RENDER START for word:', word.spanishWord, 'allWords:', allWords.length);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase 18 UX Fix: Full Spanish Immersion
  // ALWAYS use Spanish examples (immersion learning)
  const example = word.examples && word.examples.length > 0
    ? word.examples[Math.floor(Math.random() * word.examples.length)]
    : null;

  // Generate options and blank sentence
  const [question] = useState(() => {
    if (!example) {
      // Fallback: simple definition sentence
      // ES→EN: Spanish word translates to ______ (English options)
      // EN→ES: Spanish sentence with ______ (Spanish options)
      if (direction === 'spanish-to-english') {
        return {
          sentence: `"${word.spanishWord}" se traduce a ______`,
          englishPrompt: null,
          options: generateOptions(word, allWords, direction),
          correctIndex: 0,
          translation: word.englishTranslation,
        };
      } else {
        return {
          sentence: `"______" es la palabra en español para "${word.englishTranslation}"`,
          englishPrompt: `What is the Spanish word for "${word.englishTranslation}"?`,
          options: generateOptions(word, allWords, direction),
          correctIndex: 0,
          translation: word.englishTranslation,
        };
      }
    }

    // Full Immersion: ALWAYS use Spanish sentence (even for EN→ES)
    const spanishSentence = example.spanish;
    const englishTranslation = example.english;
    
    // Replace Spanish word with blank
    const blankSentence = spanishSentence.replace(
      new RegExp(`\\b${word.spanishWord}\\b`, 'gi'),
      '_______'
    );

    // For EN→ES, show English prompt to clarify what user is looking for
    const englishPrompt = direction === 'english-to-spanish'
      ? `What is the Spanish word for "${word.englishTranslation}"?`
      : null;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Context Selection] Full immersion:', {
        direction,
        spanishSentence,
        englishPrompt,
        optionsLanguage: direction === 'spanish-to-english' ? 'English' : 'Spanish',
      });
    }

    return {
      sentence: blankSentence,
      englishPrompt,
      options: generateOptions(word, allWords, direction),
      correctIndex: 0,
      translation: englishTranslation,
    };
  });

  // Shuffle options after generation
  const [shuffledOptions] = useState(() => {
    const opts = [...question.options];
    const correctWord = opts[0];
    
    // Shuffle array
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    
    // Find new position of correct word
    const newCorrectIndex = opts.findIndex(o => o === correctWord);
    
    return {
      options: opts,
      correctIndex: newCorrectIndex,
    };
  });

  console.log('[ContextSelectionReview] 🎭 State initialized, question:', question.sentence.substring(0, 50), 'options:', shuffledOptions.options.length);

  // Auto-focus container for keyboard events
  useEffect(() => {
    console.log('[ContextSelectionReview] 🎭 MOUNTED for word:', word.spanishWord);
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }, 100);
    return () => {
      console.log('[ContextSelectionReview] 🎭 UNMOUNTING word:', word.spanishWord);
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
   * Handle option selection
   */
  const handleSelectOption = (index: number) => {
    if (isSubmitted || ratingSubmitted) return;

    setSelectedOption(index);
    setIsSubmitted(true);
    setIsCorrect(index === shuffledOptions.correctIndex);
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
      method: 'context-selection',
      rating,
      timeSpent,
      isCorrect,
      selectedOptionId: selectedOption !== null ? selectedOption.toString() : undefined,
    };

    onComplete(methodResult);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent accidental triggers during initial page load
    if (!keyboardEnabled) {
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
        if (index >= 0 && index < shuffledOptions.options.length) {
          handleSelectOption(index);
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
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-3 sm:space-y-4">
        
        {/* Phase 18 UX Fix: English prompt for EN→ES mode (Full Immersion) */}
        {question.englishPrompt && !isSubmitted && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 text-center font-medium">
              {question.englishPrompt}
            </p>
          </div>
        )}
        
        {/* Spanish sentence with blank (ALWAYS Spanish for immersion) */}
        <div className="text-center p-4 sm:p-5 bg-accent/5 rounded-xl border border-accent/20">
          <p className="text-lg sm:text-xl md:text-2xl text-text leading-snug">
            {question.sentence}
          </p>
        </div>

        {/* English translation hint (subtle, for context) */}
        {question.translation && !isSubmitted && (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-text-tertiary italic">
              "{question.translation}"
            </p>
          </div>
        )}

        {/* Word options - Compact spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {shuffledOptions.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = isSubmitted && index === shuffledOptions.correctIndex;
            const showIncorrect = isSubmitted && isSelected && index !== shuffledOptions.correctIndex;

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
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
                aria-label={`Option ${index + 1}: ${option}`}
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
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
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
                  Correct: <span className="font-bold text-accent">
                    {shuffledOptions.options[shuffledOptions.correctIndex]}
                  </span>
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
 * Generate 4 word options (1 correct + 3 similar distractors)
 * Phase 18 UX Fix: Corrected logic for language learning
 * 
 * ES→EN: User sees Spanish sentence, selects English translation
 * EN→ES: User sees Spanish sentence, selects Spanish word (with English prompt)
 */
function generateOptions(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  direction: 'spanish-to-english' | 'english-to-spanish'
): string[] {
  // Phase 18 UX Fix: Options are in TARGET language (what user must produce/identify)
  // ES→EN: Spanish sentence → English options (translate)
  // EN→ES: Spanish sentence → Spanish options (identify/produce)
  const correctWord = direction === 'spanish-to-english'
    ? word.englishTranslation  // ES→EN: Show English options
    : word.spanishWord;        // EN→ES: Show Spanish options

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Context Selection] generateOptions:', {
      direction,
      correctWord,
      language: direction === 'spanish-to-english' ? 'English' : 'Spanish',
    });
  }

  // Filter words of same part of speech for better distractors
  const samePartOfSpeech = allWords.filter(
    w => w.id !== word.id && w.partOfSpeech === word.partOfSpeech
  );

  // Get distractor words
  const distractorPool = samePartOfSpeech.length >= 3 
    ? samePartOfSpeech 
    : allWords.filter(w => w.id !== word.id);

  // Get 3 random distractors in TARGET language
  const distractors: string[] = [];
  const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);

  for (const w of shuffled) {
    const distractor = direction === 'spanish-to-english'
      ? w.englishTranslation  // ES→EN: English distractors
      : w.spanishWord;        // EN→ES: Spanish distractors

    if (distractor !== correctWord && !distractors.includes(distractor)) {
      distractors.push(distractor);
    }

    if (distractors.length >= 3) break;
  }

  // Fill with placeholders if needed
  while (distractors.length < 3) {
    distractors.push(`Option ${distractors.length + 1}`);
  }

  // Return with correct word first (will be shuffled later)
  return [correctWord, ...distractors];
}
