"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import type { VocabularyWord, DifficultyRating } from "@/lib/types/vocabulary";
import { playAudio } from "@/lib/services/audio";

/**
 * Flashcard Component
 * 
 * Displays a vocabulary word with a flip animation to reveal the translation
 * and rating buttons. Optimized for mobile and desktop viewing.
 * 
 * Features:
 * - 3D flip animation (Spanish front → English back with rating buttons)
 * - Audio pronunciation playback
 * - Responsive touch and click interactions
 * - Self-contained rating system on card back
 * - Fully visible without scrolling
 */

interface FlashcardProps {
  /** The vocabulary word to display */
  word: VocabularyWord;
  /** Whether the card is currently flipped */
  isFlipped?: boolean;
  /** Callback when card is clicked/tapped to flip */
  onFlip?: () => void;
  /** Current card number (e.g., "1 of 5") */
  cardNumber?: string;
  /** Callback when user rates the card */
  onRate?: (rating: DifficultyRating) => void;
}

export function Flashcard({ word, isFlipped = false, onFlip, cardNumber, onRate }: FlashcardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Handles pronunciation playback
   * Prevents card flip during audio playback
   */
  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    
    try {
      setIsPlaying(true);
      playAudio("", word.spanishWord); // Use browser TTS
    } catch (error) {
      console.error("Failed to play pronunciation:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  /**
   * Handle rating button click
   */
  const handleRating = (e: React.MouseEvent, rating: DifficultyRating) => {
    e.stopPropagation(); // Prevent card flip
    onRate?.(rating);
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

  return (
    <div 
      className="flashcard-container"
      style={{ perspective: "1000px" }}
    >
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
        aria-label={isFlipped ? "Flip card to show Spanish" : "Flip card to show English"}
      >
        {/* Front Side - Spanish */}
        <div className="flashcard-face flashcard-front">
          <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
            {/* Card Number */}
            {cardNumber && (
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
                {cardNumber}
              </div>
            )}

            {/* Pronunciation Button */}
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Play pronunciation"
            >
              <Volume2 className={`w-5 h-5 ${isPlaying ? "text-accent" : "text-text-secondary"}`} />
            </button>

            {/* Spanish Word - Clean and Prominent */}
            <div className="text-center space-y-4">
              {getGenderDisplay() && (
                <p className="text-2xl sm:text-3xl text-text-secondary font-light">
                  {getGenderDisplay()}
                </p>
              )}
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-text leading-tight px-4">
                {word.spanishWord}
              </h2>
              {word.partOfSpeech && (
                <p className="text-sm sm:text-base text-text-secondary uppercase tracking-wider mt-3">
                  {word.partOfSpeech}
                </p>
              )}
              
              {/* Example Sentence */}
              {word.examples && word.examples.length > 0 && (
                <p className="text-base sm:text-lg text-text-secondary italic mt-6 max-w-sm mx-auto px-4 leading-relaxed">
                  &ldquo;{word.examples[0].spanish}&rdquo;
                </p>
              )}
            </div>

            {/* Tap to Flip Hint */}
            <p className="absolute bottom-6 text-sm text-text-tertiary font-medium">
              Tap or press Enter to reveal
            </p>
          </div>
        </div>

        {/* Back Side - English with Rating Buttons */}
        <div className="flashcard-face flashcard-back">
          <div className="flex flex-col h-full p-6 sm:p-8">
            {/* Card Number */}
            {cardNumber && (
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
                {cardNumber}
              </div>
            )}

            {/* English Translation - Prominent and Clean */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text leading-tight px-4">
                  {word.englishTranslation}
                </h3>
                
                {/* Spanish Word Reference */}
                <p className="text-xl sm:text-2xl text-text-secondary">
                  {getGenderDisplay() && <span className="mr-1">{getGenderDisplay()}</span>}
                  {word.spanishWord}
                </p>

                {/* English Example Translation */}
                {word.examples && word.examples.length > 0 && (
                  <p className="text-base sm:text-lg text-text-secondary italic mt-6 max-w-sm mx-auto px-4 leading-relaxed">
                    &ldquo;{word.examples[0].english}&rdquo;
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

        .flashcard {
          position: relative;
          width: 100%;
          height: 100%;
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

        /* Focus styles */
        .flashcard:focus-visible {
          outline: 3px solid var(--accent);
          outline-offset: 4px;
          border-radius: 20px;
        }

        /* Hover effect */
        @media (hover: hover) {
          .flashcard:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
          }
        }

        /* Prevent text selection during flip */
        .flashcard {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
    </div>
  );
}

