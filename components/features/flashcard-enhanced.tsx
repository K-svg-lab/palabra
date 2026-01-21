"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Check, X, AlertCircle } from "lucide-react";
import type { VocabularyWord, DifficultyRating } from "@/lib/types/vocabulary";
import type { ReviewMode, ReviewDirection } from "@/lib/types/review";
import { playAudio, isTTSBroken } from "@/lib/services/audio";
import { checkAnswer, checkAnswerMultiple, checkSpanishAnswer } from "@/lib/utils/answer-checker";

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
  /** Callback when user wants to continue to next card after viewing feedback */
  onContinue?: () => void;
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
  onContinue,
  cardNumber,
  onRate,
}: FlashcardEnhancedProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    similarity: number;
    feedback: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [ttsErrorShown, setTtsErrorShown] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstCardRef = useRef(true);

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
    
    // Guard: Prevent duplicate ratings
    if (ratingSubmitted) {
      return;
    }
    
    setRatingSubmitted(true);
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
    setRatingSubmitted(false);
  }, [word.id]);

  // Auto-focus input in recall/listening mode
  useEffect(() => {
    if ((mode === 'recall' || mode === 'listening') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, word.id]);

  // Re-focus input after answer is checked and user continues
  useEffect(() => {
    if (!answerChecked && inputRef.current && (mode === 'recall' || mode === 'listening')) {
      inputRef.current.focus();
    }
  }, [answerChecked, mode]);

  // Auto-play audio when new card appears in listening mode
  useEffect(() => {
    
    if (mode !== 'listening') return;
    
    // Don't auto-play if TTS is completely broken
    if (isTTSBroken()) {
      if (!ttsErrorShown) {
        setTtsErrorShown(true);
      }
      return;
    }
    
    // On mobile, don't auto-play on first card (needs user interaction to unlock audio)
    // After first interaction, auto-play works normally
    if (isFirstCardRef.current && !audioUnlocked) {
      return; // Don't auto-play on first card
    }
    
    let cancelled = false;
    
    // Ensure voices are loaded before auto-playing (especially on first card)
    const playWithLoadedVoices = async () => {
      
      // Wait for voices to be available
      if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        
        
        if (voices.length === 0) {
          
          // Voices not loaded yet, wait for them
          await new Promise<void>((resolve) => {
            const handler = () => {
              speechSynthesis.removeEventListener('voiceschanged', handler);
              resolve();
            };
            speechSynthesis.addEventListener('voiceschanged', handler);
            // Fallback timeout in case event doesn't fire
            setTimeout(() => {
              speechSynthesis.removeEventListener('voiceschanged', handler);
              resolve();
            }, 500);
          });
        }
      }
      
      // Check if cancelled before playing
      if (cancelled) {
        return;
      }
      
      
      // Small delay to ensure component is ready
      setTimeout(() => {
        
        if (!cancelled) {
          
          playAudio("", word.spanishWord);
          onAudioPlay?.();
          
        }
      }, 300);
    };
    
    playWithLoadedVoices();
    
    // Cleanup function to prevent double play
    return () => {
      cancelled = true;
      
      // Stop any ongoing speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id, mode]);

  /**
   * Handles pronunciation playback
   */
  const handlePlayAudio = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Mark audio as unlocked after first user interaction
    if (!audioUnlocked) {
      setAudioUnlocked(true);
    }
    
    if (isFirstCardRef.current) {
      isFirstCardRef.current = false;
    }
    
    try {
      setIsPlaying(true);
      playAudio("", word.spanishWord);
      onAudioPlay?.();
      
      // Check if TTS became broken after this attempt
      setTimeout(() => {
        if (isTTSBroken() && !ttsErrorShown) {
          setTtsErrorShown(true);
        }
      }, 6000); // Wait 6 seconds to see if error occurs
    } catch (error) {
      console.error("Failed to play pronunciation:", error);
    } finally {
      setTimeout(() => setIsPlaying(false), 500);
    }
  };

  /**
   * Handle answer submission in recall mode
   */
  const handleSubmitAnswer = () => {
    // Guard: Prevent duplicate submissions
    if (answerChecked) {
      return;
    }
    
    if (!userAnswer.trim()) {
      return;
    }

    const isListeningMode = mode === 'listening';
    let result;
    
    // In listening mode, user always hears and types Spanish, so always check against Spanish word
    if (isListeningMode) {
      result = checkSpanishAnswer(userAnswer, word.spanishWord, isListeningMode);
    } else if (direction === 'english-to-spanish') {
      // Check Spanish answer with article awareness
      result = checkSpanishAnswer(userAnswer, word.spanishWord, isListeningMode);
    } else {
      // Check English answer - handle comma-separated translations
      const englishTranslations = word.englishTranslation
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      if (englishTranslations.length > 1) {
        // Multiple translations - check against all
        result = checkAnswerMultiple(userAnswer, englishTranslations, false, isListeningMode);
      } else {
        // Single translation - use basic check
        result = checkAnswer(userAnswer, englishTranslations[0] || word.englishTranslation, false, isListeningMode);
      }
    }
    
    setAnswerResult(result);
    setAnswerChecked(true);
    onAnswerSubmit?.(userAnswer, result.isCorrect, result.similarity);
    
    // Focus container so it can receive Enter key for continuing
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    }, 100);
  };

  /**
   * Handle Enter key to submit answer
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !answerChecked) {
      handleSubmitAnswer();
    }
  };

  /**
   * Handle continue to next card after viewing feedback
   */
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  /**
   * Format gender display as abbreviation (m./f.) to match vocabulary cards
   */
  const getGenderAbbreviation = () => {
    if (!word.gender || word.partOfSpeech !== "noun") return null;
    
    const abbreviations = {
      masculine: "m.",
      feminine: "f.",
      neutral: "n."
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
      <div 
        className="flashcard-simple" 
        style={{
          height: '100%',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Conditionally render EITHER front OR back - no 3D transforms */}
        {!isFlipped ? (
        /* Front Side - Question */
        <div className="flashcard-content">
          <div 
            className="flex flex-col h-full p-6 sm:p-8"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            ref={cardRef}
            style={{outline: 'none'}}>

            {/* Main content area - ABSOLUTE centered for pixel-perfect alignment */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none px-6">
              <div className="text-center space-y-4 max-w-xl mx-auto">
                {/* Main word area - consistent height to prevent shift */}
                <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text leading-none">
                      {frontContent}
                    </h2>
                    {isSpanishToEnglish && getGenderAbbreviation() && (
                      <span className="text-xl sm:text-2xl text-text-secondary font-normal">
                        {getGenderAbbreviation()}
                      </span>
                    )}
                  </div>
                  {/* Audio button - ALWAYS RENDERED to prevent layout shift */}
                  {isSpanishToEnglish ? (
                    <button
                      onClick={handlePlayAudio}
                      disabled={isPlaying}
                      tabIndex={-1}
                      className="p-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 pointer-events-auto flex-shrink-0"
                      aria-label="Play pronunciation"
                    >
                      <Volume2 className={`w-5 h-5 ${isPlaying ? "text-accent" : "text-text-secondary"} pointer-events-none`} />
                    </button>
                  ) : (
                    <div className="p-1.5 flex-shrink-0 h-[32px]" aria-hidden="true"></div>
                  )}
                  
                  {/* Part of speech badge */}
                  {isSpanishToEnglish && getSpanishPartOfSpeech() && (
                    <div className="flex justify-center">
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium uppercase tracking-wider">
                        {getSpanishPartOfSpeech()}
                      </span>
                    </div>
                  )}
                  
                  {!isSpanishToEnglish && word.partOfSpeech && (
                    <div className="flex justify-center">
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium uppercase tracking-wider">
                        {word.partOfSpeech}
                      </span>
                    </div>
                  )}
                </div>

                {/* Example sentence */}
                {word.examples && word.examples.length > 0 && (
                  <div className="pt-4 mt-3 border-t border-separator/25">
                    <p className="text-base sm:text-lg text-text-secondary italic leading-relaxed px-4">
                      &ldquo;{isSpanishToEnglish ? word.examples[0].spanish : word.examples[0].english}&rdquo;
                    </p>
                  </div>
                )}

                {/* Placeholder for rating buttons - prevents layout shift */}
                <div className="pt-4 mt-1">
                  <div className="h-[40px] sm:h-[44px]" aria-hidden="true"></div>
                </div>
              </div>
            </div>

            {/* Tap hint at bottom - absolutely positioned */}
            <p className="absolute bottom-6 inset-x-0 text-center text-sm text-text-tertiary font-medium pointer-events-none">
              Tap or press Enter to reveal
            </p>
          </div>
        </div>
      ) : (
        /* Back Side - Answer */
        <div className="flashcard-content">
          <div 
            className="flex flex-col h-full p-6 sm:p-8"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            ref={cardRef}
            style={{outline: 'none'}}>

          {/* Main content area - ABSOLUTE centered for pixel-perfect alignment */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none px-6">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              {/* Main answer area - consistent height to prevent shift */}
              <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text leading-none">
                    {backContent}
                  </h3>
                  {!isSpanishToEnglish && getGenderAbbreviation() && (
                    <span className="text-xl sm:text-2xl text-text-secondary font-normal">
                      {getGenderAbbreviation()}
                    </span>
                  )}
                </div>
                {/* Invisible placeholder to match front side speaker button - ALWAYS RENDERED */}
                <div className="p-1.5 flex-shrink-0 h-[32px]" aria-hidden="true"></div>
                
                {/* Part of speech badge */}
                {!isSpanishToEnglish && getSpanishPartOfSpeech() && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium uppercase tracking-wider">
                      {getSpanishPartOfSpeech()}
                    </span>
                  </div>
                )}
                
                {isSpanishToEnglish && word.partOfSpeech && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium uppercase tracking-wider">
                      {word.partOfSpeech}
                    </span>
                  </div>
                )}
              </div>

                {/* Example sentence */}
                {word.examples && word.examples.length > 0 && (
                  <div className="pt-4 mt-3 border-t border-separator/25">
                    <p className="text-base sm:text-lg text-text-secondary italic leading-relaxed px-4">
                      &ldquo;{isSpanishToEnglish ? word.examples[0].english : word.examples[0].spanish}&rdquo;
                    </p>
                  </div>
                )}

                {/* Rating Buttons - Integrated below example sentence */}
                {onRate && (
                  <div className="pt-4 mt-1 pointer-events-auto">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <button
                        onClick={(e) => handleRating(e, "forgot")}
                        disabled={ratingSubmitted}
                        className="flex items-center gap-1 py-2 px-2.5 sm:px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-black/5 dark:border-white/5 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/5 dark:disabled:hover:bg-white/5"
                      >
                        <span className="text-base sm:text-lg">😞</span>
                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary whitespace-nowrap">Forgot</span>
                      </button>
                      <button
                        onClick={(e) => handleRating(e, "hard")}
                        disabled={ratingSubmitted}
                        className="flex items-center gap-1 py-2 px-2.5 sm:px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-black/5 dark:border-white/5 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/5 dark:disabled:hover:bg-white/5"
                      >
                        <span className="text-base sm:text-lg">🤔</span>
                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary whitespace-nowrap">Hard</span>
                      </button>
                      <button
                        onClick={(e) => handleRating(e, "good")}
                        disabled={ratingSubmitted}
                        className="flex items-center gap-1 py-2 px-2.5 sm:px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-black/5 dark:border-white/5 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/5 dark:disabled:hover:bg-white/5"
                      >
                        <span className="text-base sm:text-lg">😊</span>
                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary whitespace-nowrap">Good</span>
                      </button>
                      <button
                        onClick={(e) => handleRating(e, "easy")}
                        disabled={ratingSubmitted}
                        className="flex items-center gap-1 py-2 px-2.5 sm:px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-black/5 dark:border-white/5 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/5 dark:disabled:hover:bg-white/5"
                      >
                        <span className="text-base sm:text-lg">🎉</span>
                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary whitespace-nowrap">Easy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tap hint at bottom - absolutely positioned - only show when no rating buttons */}
            {!onRate && (
            <p className="absolute bottom-6 inset-x-0 text-center text-sm text-text-tertiary font-medium pointer-events-none">
              Tap or press Enter to reveal
            </p>
            )}
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
    <div 
      ref={containerRef}
      className="flashcard-recall"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && answerChecked) {
          e.preventDefault();
          handleContinue();
        }
      }}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
        {/* Question */}
        <div className="text-center space-y-5 max-w-md">
          <p className="text-xs sm:text-sm text-text-tertiary/90 font-medium uppercase tracking-wider">
            Type the {backLanguage} translation
          </p>
          
          <div className="space-y-3">
            <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
              <h2 className="text-4xl md:text-5xl font-bold text-text">
                {frontContent}
              </h2>
              {isSpanishToEnglish && getGenderAbbreviation() && (
                <span className="text-2xl md:text-3xl text-text-tertiary/70 font-normal">
                  {getGenderAbbreviation()}
                </span>
              )}
            </div>
            
            {isSpanishToEnglish && getSpanishPartOfSpeech() && (
              <p className="text-xs sm:text-sm text-text-secondary/80 font-medium tracking-[0.05em] uppercase">
                {getSpanishPartOfSpeech()}
              </p>
            )}
            
            {!isSpanishToEnglish && word.partOfSpeech && (
              <p className="text-xs sm:text-sm text-text-secondary/80 font-medium tracking-[0.05em] uppercase">
                {word.partOfSpeech}
              </p>
            )}
          </div>

          {word.examples && word.examples.length > 0 && (
            <div className="pt-4">
              <div className="h-px w-12 bg-separator/40 mx-auto mb-3"></div>
              <p className="text-xs sm:text-sm text-text-secondary/80 italic leading-relaxed font-light">
                {isSpanishToEnglish ? word.examples[0].spanish : word.examples[0].english}
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
              disabled={!userAnswer.trim() || answerChecked}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          )}

          {/* Feedback - Only show if incorrect */}
          {answerChecked && answerResult && !answerResult.isCorrect && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                <p className="text-sm text-text-secondary">
                  Correct answer: <span className="font-semibold text-text">{backContent}</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-tertiary">
                  Accuracy: {Math.round(answerResult.similarity * 100)}%
                </p>
              </div>
            </div>
          )}
          
          {/* Continue Button - shown after answer is checked */}
          {answerChecked && (
            <div className="space-y-2">
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
              <p className="text-xs text-text-tertiary text-center">
                Press Enter or tap Continue
              </p>
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
    <div 
      ref={containerRef}
      className="flashcard-listening"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && answerChecked) {
          e.preventDefault();
          handleContinue();
        }
      }}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
        {/* TTS Error - Complete Blocking Message */}
        {ttsErrorShown ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 max-w-md mx-auto px-6">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                    Audio Required
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                    Listening mode requires working audio. Your device's text-to-speech is not functioning.
                  </p>
                  <div className="text-left bg-white/50 dark:bg-black/20 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      To enable audio:
                    </p>
                    <ol className="text-xs text-red-700 dark:text-red-400 space-y-1 list-decimal list-inside">
                      <li>Open <strong>Google Play Store</strong></li>
                      <li>Search for <strong>"Google Text-to-Speech"</strong></li>
                      <li>Install or update the app</li>
                      <li>Go to Settings → Language & input → Text-to-speech</li>
                      <li>Select Google TTS Engine</li>
                      <li>Tap Settings → Install voice data</li>
                      <li>Download <strong>Spanish</strong> voices</li>
                      <li>Restart Chrome and try again</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/review')}
              className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              ← Exit Listening Mode
            </button>
          </div>
        ) : (
          <>
        {/* Instructions */}
        <div className="text-center space-y-3">
          {isFirstCardRef.current && !audioUnlocked ? (
            <div className="space-y-2">
              <p className="text-base sm:text-lg text-accent font-semibold">
                👆 Tap the speaker to start
              </p>
              <p className="text-sm text-text-tertiary">
                Audio will play automatically for remaining cards
              </p>
            </div>
          ) : (
            <>
              <p className="text-base sm:text-lg text-text-secondary font-medium">
                🎧 Listen and type what you hear
              </p>
              {getSpanishPartOfSpeech() && (
                <p className="text-xs sm:text-sm text-text-secondary/80 font-medium tracking-[0.05em] uppercase">
                  {getSpanishPartOfSpeech()}
                </p>
              )}
            </>
          )}
        </div>

        {/* Large Audio Button - Hide if TTS is broken */}
        {!ttsErrorShown && (
          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={`p-8 rounded-full transition-all disabled:opacity-50 group ${
              isFirstCardRef.current && !audioUnlocked 
                ? "bg-accent hover:bg-accent/90 animate-pulse shadow-lg shadow-accent/50" 
                : "bg-accent/10 hover:bg-accent/20"
            }`}
            aria-label="Play audio"
          >
            <Volume2 className={`w-12 h-12 ${
              isPlaying 
                ? "text-white animate-pulse" 
                : isFirstCardRef.current && !audioUnlocked
                ? "text-white"
                : "text-accent group-hover:scale-110 transition-transform"
            }`} />
          </button>
        )}

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
              disabled={!userAnswer.trim() || answerChecked}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          )}

          {/* Feedback - Only show if incorrect */}
          {answerChecked && answerResult && !answerResult.isCorrect && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                <p className="text-sm text-text-secondary">
                  Correct: <span className="font-semibold text-text">{word.spanishWord}</span>
                </p>
                <p className="text-sm text-text-tertiary mt-1">
                  ({word.englishTranslation})
                </p>
              </div>
            </div>
          )}
          
          {/* Continue Button - shown after answer is checked */}
          {answerChecked && (
            <div className="space-y-2">
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
              <p className="text-xs text-text-tertiary text-center">
                Press Enter or tap Continue
              </p>
            </div>
          )}
        </div>

        {!answerChecked && !ttsErrorShown && (
          <p className="text-xs text-text-tertiary text-center">
            Click the speaker icon to replay the audio
          </p>
        )}
      </>
        )}
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
          max-width: 650px;
          height: 100%;
          max-height: 320px;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .flashcard-container {
            max-height: 300px;
            max-width: 92vw;
          }
        }
        
        @media (min-height: 750px) {
          .flashcard-container {
            max-height: 380px;
          }
        }
        
        @media (min-height: 950px) {
          .flashcard-container {
            max-height: 420px;
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
          border: 2px solid rgba(0, 0, 0, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          overflow: visible;
        }
        
        @media (prefers-color-scheme: dark) {
          .flashcard-simple {
            border: 2px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4);
          }
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
          outline: none;
        }

        @media (hover: hover) {
          .flashcard-simple:hover {
            border: 2px solid rgba(0, 0, 0, 0.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.16);
            transform: translateY(-2px);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        
        @media (hover: hover) and (prefers-color-scheme: dark) {
          .flashcard-simple:hover {
            border: 2px solid rgba(255, 255, 255, 0.35);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
}

