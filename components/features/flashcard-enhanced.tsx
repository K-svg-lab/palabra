"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, Check, X } from "lucide-react";
import type { VocabularyWord, DifficultyRating } from "@/lib/types/vocabulary";
import type { ReviewMode, ReviewDirection } from "@/lib/types/review";
import { playAudio } from "@/lib/services/audio";
import { checkAnswer, checkSpanishAnswer } from "@/lib/utils/answer-checker";

/**
 * Enhanced Flashcard Component - Phase 8 Updated
 * 
 * Supports:
 * - Bidirectional review (Spanish → English or English → Spanish)
 * - Multiple review modes (Recognition, Recall, Listening)
 * - Typed answer checking with fuzzy matching
 * - Integrated rating buttons on card back
 * 
 * Features:
 * - Recognition mode: Flip card with integrated rating buttons
 * - Recall mode: Type the answer
 * - Listening mode: Audio-first learning
 * - Optimized for mobile and desktop viewing
 */

interface FlashcardEnhancedProps {
  /** The vocabulary word to display */
  word: VocabularyWord;
  /** Review direction */
  direction: ReviewDirection;
  /** Review mode */
  mode: ReviewMode;
  /** Whether the card is currently flipped (recognition mode) */
  isFlipped?: boolean;
  /** Callback when card is clicked/tapped to flip */
  onFlip?: () => void;
  /** Callback when answer is submitted (recall mode) */
  onAnswerSubmit?: (userAnswer: string, isCorrect: boolean, similarity: number) => void;
  /** Callback when audio play is requested (listening mode) */
  onAudioPlay?: () => void;
  /** Current card number (e.g., "1 of 3") */
  cardNumber?: string;
  /** Callback when user rates the card (recognition mode) */
  onRate?: (rating: DifficultyRating) => void;
}

export function FlashcardEnhanced({
  word,
  direction,
  mode,
  isFlipped = false,
  onFlip,
  onAnswerSubmit,
  onAudioPlay,
  cardNumber,
  onRate,
}: FlashcardEnhancedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    similarity: number;
    feedback: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-focus card for keyboard events on mount and word change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardRef.current && mode === 'recognition') {
        cardRef.current.focus();
      }
    }, 100); // Small delay to ensure DOM is ready
    return () => clearTimeout(timer);
  }, [word.id, mode]);

  /**
   * Handle rating button click
   */
  const handleRating = (e: React.MouseEvent, rating: DifficultyRating) => {
    e.stopPropagation(); // Prevent card flip
    onRate?.(rating);
  };

  // Determine front and back content based on direction
  const isSpanishToEnglish = direction === 'spanish-to-english';
  const frontContent = isSpanishToEnglish ? word.spanishWord : word.englishTranslation;
  const backContent = isSpanishToEnglish ? word.englishTranslation : word.spanishWord;
  const frontLanguage = isSpanishToEnglish ? 'Spanish' : 'English';
  const backLanguage = isSpanishToEnglish ? 'English' : 'Spanish';

  // Reset state when word changes
  useEffect(() => {
    setUserAnswer("");
    setAnswerChecked(false);
    setAnswerResult(null);
    setShowHint(false);
  }, [word.id]);

  // Auto-focus input in recall mode
  useEffect(() => {
    if (mode === 'recall' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, word.id]);

  /**
   * Handles pronunciation playback
   */
  const handlePlayAudio = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      setIsPlaying(true);
      playAudio("", word.spanishWord);
      onAudioPlay?.();
    } catch (error) {
      console.error("Failed to play pronunciation:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  /**
   * Handle answer submission in recall mode
   */
  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      return;
    }

    let result;
    if (direction === 'english-to-spanish') {
      // Check Spanish answer with article awareness
      result = checkSpanishAnswer(userAnswer, word.spanishWord);
    } else {
      // Check English answer
      result = checkAnswer(userAnswer, word.englishTranslation);
    }

    setAnswerResult(result);
    setAnswerChecked(true);
    onAnswerSubmit?.(userAnswer, result.isCorrect, result.similarity);
  };

  /**
   * Handle Enter key to submit
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !answerChecked) {
      handleSubmitAnswer();
    }
  };

  /**
   * Format gender display as abbreviation (m/f)
   */
  const getGenderAbbreviation = () => {
    if (!word.gender || word.partOfSpeech !== "noun") return null;
    
    const abbreviations = {
      masculine: "m",
      feminine: "f",
      neutral: "n"
    };
    
    return abbreviations[word.gender];
  };

  /**
   * Get Spanish part of speech translation
   */
  const getSpanishPartOfSpeech = () => {
    if (!word.partOfSpeech) return null;
    
    const translations: Record<string, string> = {
      noun: "sustantivo",
      verb: "verbo",
      adjective: "adjetivo",
      adverb: "adverbio",
      pronoun: "pronombre",
      preposition: "preposición",
      conjunction: "conjunción",
      interjection: "interjección"
    };
    
    return translations[word.partOfSpeech] || word.partOfSpeech;
  };

  /**
   * Render Recognition Mode (traditional flip card)
   */
  const renderRecognitionMode = () => {
    const handleClick = () => {
      onFlip?.();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onFlip?.();
      }
    };
    
    return (
      <div className="flashcard-simple">
        {/* Conditionally render EITHER front OR back - no 3D transforms */}
        {!isFlipped ? (
        /* Front Side - Question */
        <div className="flashcard-content">
          <div 
            className="flex flex-col items-center justify-center h-full p-6 sm:p-8"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            ref={cardRef}>
            {cardNumber && (
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium pointer-events-none">
                {cardNumber}
              </div>
            )}

            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 pointer-events-auto"
              aria-label="Play pronunciation"
            >
              <Volume2 className={`w-5 h-5 ${isPlaying ? "text-accent" : "text-text-secondary"} pointer-events-none`} />
            </button>

            <div className="text-center space-y-4 max-w-xl pointer-events-none">
              {/* Main word with gender */}
              <div className="space-y-2">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text leading-tight px-4">
                  {frontContent}
                  {isSpanishToEnglish && getGenderAbbreviation() && (
                    <span className="text-3xl sm:text-4xl md:text-5xl text-text-secondary/70 ml-2">
                      ({getGenderAbbreviation()})
                    </span>
                  )}
                </h2>
                
                {/* Part of speech in Spanish (if front is Spanish) */}
                {isSpanishToEnglish && getSpanishPartOfSpeech() && (
                  <p className="text-sm sm:text-base text-text-secondary font-medium tracking-wide">
                    {getSpanishPartOfSpeech()}
                  </p>
                )}
                
                {/* Part of speech in English (if front is English) */}
                {!isSpanishToEnglish && word.partOfSpeech && (
                  <p className="text-sm sm:text-base text-text-secondary font-medium tracking-wide capitalize">
                    {word.partOfSpeech}
                  </p>
                )}
              </div>

              {/* Example sentence */}
              {word.examples && word.examples.length > 0 && (
                <div className="pt-3 border-t border-separator/30">
                  <p className="text-base sm:text-lg text-text-secondary/90 italic leading-relaxed px-4">
                    &ldquo;{isSpanishToEnglish ? word.examples[0].spanish : word.examples[0].english}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <p className="absolute bottom-6 text-sm text-text-tertiary font-medium pointer-events-none">
              Tap or press Enter to reveal
            </p>
          </div>
        </div>
      ) : (
        /* Back Side - Answer with Rating Buttons */
        <div className="flashcard-content">
          <div 
            className="flex flex-col h-full p-6 sm:p-8"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            ref={cardRef}>
          {cardNumber && (
            <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
              {cardNumber}
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto pointer-events-none">
            <div className="text-center space-y-4">
              {/* Main answer with gender (only for English to Spanish) */}
              <div className="space-y-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text leading-tight px-4">
                  {backContent}
                  {!isSpanishToEnglish && getGenderAbbreviation() && (
                    <span className="text-2xl sm:text-3xl md:text-4xl text-text-secondary/70 ml-2">
                      ({getGenderAbbreviation()})
                    </span>
                  )}
                </h3>
                
                {/* Part of speech on back side */}
                {!isSpanishToEnglish && getSpanishPartOfSpeech() && (
                  <p className="text-sm sm:text-base text-text-secondary font-medium tracking-wide">
                    {getSpanishPartOfSpeech()}
                  </p>
                )}
                
                {isSpanishToEnglish && word.partOfSpeech && (
                  <p className="text-sm sm:text-base text-text-secondary font-medium tracking-wide capitalize">
                    {word.partOfSpeech}
                  </p>
                )}
              </div>
              
              {/* Example sentence in target language */}
              {word.examples && word.examples.length > 0 && (
                <div className="pt-3 border-t border-separator/30">
                  <p className="text-base sm:text-lg text-text-secondary/90 italic px-4 leading-relaxed">
                    &ldquo;{isSpanishToEnglish ? word.examples[0].english : word.examples[0].spanish}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  /**
   * Render Recall Mode (type the answer)
   */
  const renderRecallMode = () => (
    <div className="flashcard-recall">
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
        {cardNumber && (
          <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
            {cardNumber}
          </div>
        )}

        {/* Question */}
        <div className="text-center space-y-4 max-w-md">
          <p className="text-sm text-text-secondary font-medium">
            Type the {backLanguage} translation:
          </p>
          
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-text">
              {frontContent}
              {isSpanishToEnglish && getGenderAbbreviation() && (
                <span className="text-3xl md:text-4xl text-text-secondary/70 ml-2">
                  ({getGenderAbbreviation()})
                </span>
              )}
            </h2>
            
            {isSpanishToEnglish && getSpanishPartOfSpeech() && (
              <p className="text-sm text-text-secondary font-medium tracking-wide">
                {getSpanishPartOfSpeech()}
              </p>
            )}
            
            {!isSpanishToEnglish && word.partOfSpeech && (
              <p className="text-sm text-text-secondary font-medium tracking-wide capitalize">
                {word.partOfSpeech}
              </p>
            )}
          </div>

          {word.examples && word.examples.length > 0 && (
            <div className="pt-2 border-t border-separator/30 mt-3">
              <p className="text-sm sm:text-base text-text-secondary/90 italic leading-relaxed">
                &ldquo;{isSpanishToEnglish ? word.examples[0].spanish : word.examples[0].english}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Audio Button */}
        <button
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Play pronunciation"
        >
          <Volume2 className={`w-5 h-5 ${isPlaying ? "text-accent" : "text-text-secondary"}`} />
        </button>

        {/* Answer Input */}
        <div className="w-full max-w-md space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={answerChecked}
              placeholder={`Type in ${backLanguage}...`}
              className="w-full px-4 py-3 text-lg text-center border-2 border-separator rounded-xl focus:border-accent focus:outline-none disabled:opacity-50 disabled:bg-black/5 dark:disabled:bg-white/5 bg-bg-primary text-text"
            />
            {answerChecked && answerResult && (
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${answerResult.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {answerResult.isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {!answerChecked && (
            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim()}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          )}

          {/* Feedback */}
          {answerChecked && answerResult && (
            <div className="space-y-2">
              <div className={`p-3 rounded-xl text-center font-medium ${answerResult.isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {answerResult.feedback}
              </div>
              {!answerResult.isCorrect && (
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <p className="text-sm text-text-secondary">
                    Correct answer: <span className="font-semibold text-text">{backContent}</span>
                  </p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-text-tertiary">
                  Accuracy: {Math.round(answerResult.similarity * 100)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Render Listening Mode (audio-first)
   */
  const renderListeningMode = () => (
    <div className="flashcard-listening">
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
        {cardNumber && (
          <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
            {cardNumber}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-lg text-text-secondary font-medium">
            🎧 Listen and type what you hear
          </p>
          {getSpanishPartOfSpeech() && (
            <p className="text-sm text-text-secondary font-medium tracking-wide">
              {getSpanishPartOfSpeech()}
            </p>
          )}
        </div>

        {/* Large Audio Button */}
        <button
          onClick={handlePlayAudio}
          disabled={isPlaying}
          className="p-8 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-50 group"
          aria-label="Play audio"
        >
          <Volume2 className={`w-12 h-12 ${isPlaying ? "text-accent animate-pulse" : "text-accent group-hover:scale-110 transition-transform"}`} />
        </button>

        {/* Answer Input */}
        <div className="w-full max-w-md space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={answerChecked}
              placeholder="Type what you heard..."
              className="w-full px-4 py-3 text-lg text-center border-2 border-separator rounded-xl focus:border-accent focus:outline-none disabled:opacity-50 disabled:bg-black/5 dark:disabled:bg-white/5 bg-bg-primary text-text"
            />
            {answerChecked && answerResult && (
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${answerResult.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {answerResult.isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {!answerChecked && (
            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim()}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          )}

          {/* Feedback */}
          {answerChecked && answerResult && (
            <div className="space-y-2">
              <div className={`p-3 rounded-xl text-center font-medium ${answerResult.isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {answerResult.feedback}
              </div>
              {!answerResult.isCorrect && (
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <p className="text-sm text-text-secondary">
                    Correct: <span className="font-semibold text-text">{word.spanishWord}</span>
                  </p>
                  <p className="text-sm text-text-tertiary mt-1">
                    ({word.englishTranslation})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-text-tertiary text-center">
          Click the speaker icon to replay the audio
        </p>
      </div>
    </div>
  );

  // Render appropriate mode
  return (
    <div className="flashcard-container">
      {mode === 'recognition' && renderRecognitionMode()}
      {mode === 'recall' && renderRecallMode()}
      {mode === 'listening' && renderListeningMode()}

      <style jsx>{`
        .flashcard-container {
          width: 100%;
          max-width: 700px;
          height: clamp(250px, 30vh, 350px);
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .flashcard-container {
            height: clamp(200px, 28vh, 300px);
            max-width: 90vw;
          }
        }

        .flashcard-recall,
        .flashcard-listening {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          background: var(--bg-primary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .flashcard-simple {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          background: var(--bg-primary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }

        .flashcard-content {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          background: var(--bg-primary);
          overflow: hidden;
        }

        .flashcard-simple:focus-visible {
          outline: 3px solid var(--accent);
          outline-offset: 4px;
          border-radius: 20px;
        }

        @media (hover: hover) {
          .flashcard-simple:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
          }
        }
      `}</style>
    </div>
  );
}

