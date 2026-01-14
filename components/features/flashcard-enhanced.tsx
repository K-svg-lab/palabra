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
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:58',message:'FlashcardEnhanced mounted',data:{mode,direction,isFlipped,hasOnRate:!!onRate,wordId:word.id,spanish:word.spanishWord,english:word.englishTranslation},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,D'})}).catch(()=>{});
  }, []);
  // #endregion

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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:78',message:'FlashcardEnhanced props updated',data:{mode,isFlipped,hasOnRate:!!onRate},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  }, [mode, isFlipped, onRate]);
  // #endregion

  /**
   * Handle rating button click
   */
  const handleRating = (e: React.MouseEvent, rating: DifficultyRating) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:86',message:'handleRating called',data:{rating,hasOnRate:!!onRate},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
   * Format gender display with appropriate article
   */
  const getGenderDisplay = () => {
    if (!word.gender || word.partOfSpeech !== "noun") return null;
    
    const articles = {
      masculine: "el",
      feminine: "la",
      neutral: ""
    };
    
    return articles[word.gender];
  };

  /**
   * Render Recognition Mode (traditional flip card)
   */
  const renderRecognitionMode = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:185',message:'renderRecognitionMode called',data:{isFlipped,hasOnRate:!!onRate,frontContent:isSpanishToEnglish?word.spanishWord:word.englishTranslation,backContent:isSpanishToEnglish?word.englishTranslation:word.spanishWord},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
    // #endregion
    return (
    <div
      className={`flashcard ${isFlipped ? "flipped" : ""}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip?.();
        }
      }}
      aria-label={isFlipped ? `Flip card to show ${frontLanguage}` : `Flip card to show ${backLanguage}`}
    >
      {/* Front Side - Question */}
      <div className="flashcard-face flashcard-front" ref={(el) => {
        // #region agent log
        if (el) {
          const computed = window.getComputedStyle(el);
          fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:203',message:'Front face CSS',data:{transform:computed.transform,backfaceVisibility:computed.backfaceVisibility,display:computed.display,opacity:computed.opacity,visibility:computed.visibility,zIndex:computed.zIndex},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I,J,K'})}).catch(()=>{});
        }
        // #endregion
      }}>
        <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
          {cardNumber && (
            <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
              {cardNumber}
            </div>
          )}

          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Play pronunciation"
          >
            <Volume2 className={`w-5 h-5 ${isPlaying ? "text-accent" : "text-text-secondary"}`} />
          </button>

          <div className="text-center space-y-4">
            {isSpanishToEnglish && getGenderDisplay() && (
              <p className="text-2xl sm:text-3xl text-text-secondary font-light">
                {getGenderDisplay()}
              </p>
            )}
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text leading-tight px-4">
              {frontContent}
            </h2>
            {word.partOfSpeech && (
              <p className="text-sm sm:text-base text-text-secondary uppercase tracking-wider mt-3">
                {word.partOfSpeech}
              </p>
            )}
          </div>

          <p className="absolute bottom-6 text-sm text-text-tertiary font-medium">
            Tap or press Enter to reveal
          </p>
        </div>
      </div>

      {/* Back Side - Answer with Rating Buttons */}
      <div className="flashcard-face flashcard-back" ref={(el) => {
        // #region agent log
        if (el) {
          const computed = window.getComputedStyle(el);
          fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:242',message:'Back face CSS',data:{transform:computed.transform,backfaceVisibility:computed.backfaceVisibility,display:computed.display,opacity:computed.opacity,visibility:computed.visibility,zIndex:computed.zIndex},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I,J,K'})}).catch(()=>{});
        }
        // #endregion
      }}>
        <div className="flex flex-col h-full p-6 sm:p-8">
          {cardNumber && (
            <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
              {cardNumber}
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text leading-tight px-4">
                {backContent}
              </h3>
              
              {word.examples && word.examples.length > 0 && (
                <p className="text-base sm:text-lg text-text-secondary italic mt-6 max-w-sm mx-auto px-4 leading-relaxed">
                  &ldquo;{isSpanishToEnglish ? word.examples[0].english : word.examples[0].spanish}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Rating Buttons - Always visible on back */}
          {onRate && (
            <div className="space-y-3 mt-auto">
              <p className="text-sm text-center text-text-secondary font-medium">
                How well did you know this?
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={(e) => handleRating(e, "forgot")}
                  className="flex flex-col items-center gap-1.5 py-4 sm:py-5 px-2 rounded-2xl font-medium transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl"
                >
                  <span className="text-xs sm:text-sm font-bold opacity-75">1</span>
                  <span className="text-2xl sm:text-3xl">😞</span>
                  <span className="text-xs sm:text-sm font-semibold">Forgot</span>
                </button>
                <button
                  onClick={(e) => handleRating(e, "hard")}
                  className="flex flex-col items-center gap-1.5 py-4 sm:py-5 px-2 rounded-2xl font-medium transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl"
                >
                  <span className="text-xs sm:text-sm font-bold opacity-75">2</span>
                  <span className="text-2xl sm:text-3xl">🤔</span>
                  <span className="text-xs sm:text-sm font-semibold">Hard</span>
                </button>
                <button
                  onClick={(e) => handleRating(e, "good")}
                  className="flex flex-col items-center gap-1.5 py-4 sm:py-5 px-2 rounded-2xl font-medium transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
                >
                  <span className="text-xs sm:text-sm font-bold opacity-75">3</span>
                  <span className="text-2xl sm:text-3xl">😊</span>
                  <span className="text-xs sm:text-sm font-semibold">Good</span>
                </button>
                <button
                  onClick={(e) => handleRating(e, "easy")}
                  className="flex flex-col items-center gap-1.5 py-4 sm:py-5 px-2 rounded-2xl font-medium transition-all hover:scale-105 active:scale-95 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl"
                >
                  <span className="text-xs sm:text-sm font-bold opacity-75">4</span>
                  <span className="text-2xl sm:text-3xl">🎉</span>
                  <span className="text-xs sm:text-sm font-semibold">Easy</span>
                </button>
              </div>
              <p className="text-xs text-center text-text-tertiary">
                Press 1-4 or tap a button
              </p>
            </div>
          )}
        </div>
      </div>
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
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-text-secondary font-medium">
            Type the {backLanguage} translation:
          </p>
          {isSpanishToEnglish && getGenderDisplay() && (
            <p className="text-xl text-text-secondary font-light">
              {getGenderDisplay()}
            </p>
          )}
          <h2 className="text-4xl md:text-5xl font-semibold text-text">
            {frontContent}
          </h2>
          {word.partOfSpeech && (
            <p className="text-xs text-text-secondary uppercase tracking-wide">
              {word.partOfSpeech}
            </p>
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
          {word.partOfSpeech && (
            <p className="text-xs text-text-secondary uppercase tracking-wide">
              {word.partOfSpeech}
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
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/d79d142f-c32e-4ecd-a071-4aceb3e5ea20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flashcard-enhanced.tsx:510',message:'About to render mode',data:{mode,willRenderRecognition:mode==='recognition',willRenderRecall:mode==='recall',willRenderListening:mode==='listening'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  }, [mode]);
  // #endregion
  
  return (
    <div 
      className="flashcard-container"
      style={{ perspective: mode === 'recognition' ? "1000px" : undefined }}
    >
      {mode === 'recognition' && renderRecognitionMode()}
      {mode === 'recall' && renderRecallMode()}
      {mode === 'listening' && renderListeningMode()}

      <style jsx>{`
        .flashcard-container {
          width: 100%;
          max-width: 600px;
          height: 100%;
          min-height: 500px;
          max-height: calc(100vh - 180px);
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .flashcard-container {
            max-height: calc(100vh - 160px);
            min-height: 450px;
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

        .flashcard {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          background: var(--bg-primary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          /* NO overflow: hidden - it breaks transform-style: preserve-3d */
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          cursor: pointer;
        }

        .flashcard.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          background: var(--bg-primary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .flashcard-front {
          transform: rotateY(0deg);
        }

        .flashcard-back {
          transform: rotateY(180deg);
        }

        .flashcard:focus-visible {
          outline: 3px solid var(--accent);
          outline-offset: 4px;
          border-radius: 20px;
        }

        @media (hover: hover) {
          .flashcard:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
          }
        }

        .flashcard {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
    </div>
  );
}

