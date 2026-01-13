"use client";

import { useState } from "react";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import type { VocabularyWord } from "@/lib/types/vocabulary";
import { playAudio } from "@/lib/services/audio";

/**
 * Flashcard Component
 * 
 * Displays a vocabulary word with a flip animation to reveal the translation
 * and additional metadata. Implements a card-flip interaction pattern.
 * 
 * Features:
 * - 3D flip animation (Spanish front → English back)
 * - Audio pronunciation playback
 * - Responsive touch and click interactions
 * - Metadata display (gender, part of speech, examples)
 * - Apple-style design with subtle shadows
 */

interface FlashcardProps {
  /** The vocabulary word to display */
  word: VocabularyWord;
  /** Whether the card is currently flipped */
  isFlipped?: boolean;
  /** Callback when card is clicked/tapped to flip */
  onFlip?: () => void;
  /** Current card number (e.g., "1 of 3") */
  cardNumber?: string;
}

export function Flashcard({ word, isFlipped = false, onFlip, cardNumber }: FlashcardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          <div className="flex flex-col items-center justify-center h-full p-6">
            {/* Card Number - Centered at top */}
            {cardNumber && (
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
                {cardNumber}
              </div>
            )}

            {/* Pronunciation Button */}
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Play pronunciation"
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? "text-accent" : "text-text-secondary"}`} />
            </button>

            {/* Spanish Word */}
            <div className="text-center space-y-3 max-w-md">
              {getGenderDisplay() && (
                <p className="text-xl text-text-secondary font-light">
                  {getGenderDisplay()}
                </p>
              )}
              <h2 className="text-4xl md:text-5xl font-semibold text-text">
                {word.spanishWord}
              </h2>
              {word.partOfSpeech && (
                <p className="text-xs text-text-secondary uppercase tracking-wide">
                  {word.partOfSpeech}
                </p>
              )}
              
              {/* Spanish Example Sentence with Navigation */}
              {word.examples && word.examples.length > 0 && (
                <div className="mt-4 w-full max-w-md">
                  {/* Example Text */}
                  <p className="text-sm text-text-secondary italic text-center">
                    &ldquo;{word.examples[currentExampleIndex].spanish}&rdquo;
                  </p>
                  
                  {/* Context Badge */}
                  {word.examples[currentExampleIndex].context && (
                    <div className="flex justify-center mt-2">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                        word.examples[currentExampleIndex].context === 'formal' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : word.examples[currentExampleIndex].context === 'informal'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {word.examples[currentExampleIndex].context}
                      </span>
                    </div>
                  )}
                  
                  {/* Navigation (if multiple examples) */}
                  {word.examples.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentExampleIndex((currentExampleIndex - 1 + word.examples.length) % word.examples.length);
                        }}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                        aria-label="Previous example"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-text-tertiary">
                        {currentExampleIndex + 1} / {word.examples.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentExampleIndex((currentExampleIndex + 1) % word.examples.length);
                        }}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                        aria-label="Next example"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tap to Flip Hint */}
            <p className="absolute bottom-4 text-xs text-text-tertiary">
              Tap or press Enter to reveal
            </p>
          </div>
        </div>

        {/* Back Side - English */}
        <div className="flashcard-face flashcard-back">
          <div className="flex flex-col h-full p-6">
            {/* Card Number - Centered at top */}
            {cardNumber && (
              <div className="absolute top-4 left-0 right-0 text-center text-xs text-text-tertiary font-medium">
                {cardNumber}
              </div>
            )}

            {/* Translation */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 overflow-y-auto">
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-3xl md:text-4xl font-semibold text-text">
                  {word.englishTranslation}
                </h3>
                
                {/* Spanish Word Reference */}
                <p className="text-lg text-text-secondary">
                  {getGenderDisplay() && <span className="mr-1">{getGenderDisplay()}</span>}
                  {word.spanishWord}
                </p>

                {/* English Example Translation */}
                {word.examples && word.examples.length > 0 && (
                  <div className="mt-3 w-full max-w-md">
                    <p className="text-xs text-text-tertiary italic text-center">
                      &ldquo;{word.examples[currentExampleIndex].english}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {word.tags && word.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {word.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/5 dark:bg-white/5 text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Image (if available) */}
              {word.images && word.images.length > 0 && (
                <div className="max-w-md w-full mt-3">
                  <div className="relative">
                    <img
                      src={word.images[currentImageIndex].url}
                      alt={word.images[currentImageIndex].altText || word.spanishWord}
                      className="w-full h-32 object-cover rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {word.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                        {word.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Synonyms (compact display) */}
              {word.relationships?.synonyms && word.relationships.synonyms.length > 0 && (
                <div className="max-w-md w-full mt-2">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">Synonyms</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {word.relationships.synonyms.slice(0, 3).map((synonym, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
                      >
                        {synonym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notes */}
              {word.notes && (
                <div className="max-w-md p-2 rounded-lg bg-black/5 dark:bg-white/5 mt-2">
                  <p className="text-xs text-text-secondary">
                    💭 {word.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Tap to Flip Hint */}
            <p className="text-center text-xs text-text-tertiary mt-2">
              Tap or press Enter to flip back
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .flashcard-container {
          width: 100%;
          max-width: 500px;
          height: 100%;
          max-height: 50vh;
          margin: 0 auto;
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
          border-radius: 16px;
          background: var(--bg-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .flashcard-front {
          transform: rotateY(0deg);
        }

        .flashcard-back {
          transform: rotateY(180deg);
        }

        /* Focus styles */
        .flashcard:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
          border-radius: 16px;
        }

        /* Hover effect */
        @media (hover: hover) {
          .flashcard:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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

