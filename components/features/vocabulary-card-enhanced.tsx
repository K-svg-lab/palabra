"use client";

import { useState } from "react";
import { Volume2, Edit, Trash2, MoreHorizontal } from "lucide-react";
import type { VocabularyWord } from "@/lib/types/vocabulary";
import { playAudio } from "@/lib/services/audio";

/**
 * VocabularyCardEnhanced Component - Phase 16.4
 * 
 * Beautiful enhanced vocabulary card with Apple-inspired design.
 * 
 * Features:
 * - Large, readable typography
 * - Color-coded by status (New/Learning/Mastered)
 * - Progress bar showing review intervals
 * - Audio playback button
 * - Quick actions (Edit, Delete)
 * - Smooth hover animations
 * - Swipe actions on mobile (future)
 */

interface VocabularyCardEnhancedProps {
  /** The vocabulary word to display */
  word: VocabularyWord;
  /** Callback when edit is clicked */
  onEdit?: (word: VocabularyWord) => void;
  /** Callback when delete is clicked */
  onDelete?: (word: VocabularyWord) => void;
  /** Callback when card is clicked */
  onClick?: (word: VocabularyWord) => void;
}

export function VocabularyCardEnhanced({
  word,
  onEdit,
  onDelete,
  onClick,
}: VocabularyCardEnhancedProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Status-based styling
  const statusConfig = {
    new: {
      border: 'border-l-blue-500',
      badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
      label: 'New',
    },
    learning: {
      border: 'border-l-purple-500',
      badge: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
      label: 'Learning',
    },
    mastered: {
      border: 'border-l-green-500',
      badge: 'bg-green-50 dark:bg-green-900/20 text-green-600',
      label: 'Mastered',
    },
  };

  const config = statusConfig[word.status];

  // Calculate progress percentage (0-100)
  const calculateProgress = () => {
    // Simple progress based on status
    if (word.status === 'new') return 0;
    if (word.status === 'learning') return 50;
    if (word.status === 'mastered') return 100;
    return 0;
  };

  // Play audio
  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    try {
      // Pass empty string for audioUrl (use browser TTS) and Spanish word as text
      playAudio('', word.spanishWord);
      // Wait a moment for audio to finish
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to play audio:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Handle actions
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(word);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(word);
  };

  const handleClick = () => {
    onClick?.(word);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-900 
        rounded-xl p-4 
        border-l-4 ${config.border}
        border-t border-r border-b border-gray-200 dark:border-gray-800
        hover:scale-[1.01] active:scale-[0.99]
        hover:shadow-lg
        transition-all duration-300
        cursor-pointer
        group
        w-full max-w-full min-w-0 overflow-hidden
      `}
    >
      {/* Main content */}
      <div className="space-y-3 mb-3">
        {/* Header: Audio button and Status badge */}
        <div className="flex items-start justify-between">
          {/* Audio button */}
          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
              flex-shrink-0
            "
            title="Play pronunciation"
          >
            <Volume2
              className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            />
          </button>

          {/* Status badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
            {config.label}
          </span>
        </div>

        {/* Spanish word - Full, no truncation */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
            {word.spanishWord}
          </h3>
        </div>

        {/* English translation - Full, no truncation, indented */}
        <div className="pl-4">
          <p className="text-lg text-gray-600 dark:text-gray-400 break-words">
            → {word.englishTranslation}
          </p>
        </div>
        
        {/* Part of speech & gender */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📖 {word.partOfSpeech || 'Word'}</span>
          {word.gender && <span>· {word.gender}</span>}
        </div>
      </div>

      {/* Example sentence */}
      {word.examples && word.examples.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 text-sm italic text-gray-700 dark:text-gray-300">
          "{word.examples[0].spanish}"
        </div>
      )}

      {/* Progress bar (learning status) */}
      <div className="mb-3">
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              word.status === 'new' ? 'from-blue-500 to-blue-600' :
              word.status === 'learning' ? 'from-purple-500 to-purple-600' :
              'from-green-500 to-green-600'
            } rounded-full transition-all duration-500`}
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      {word.tags && word.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {word.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleEdit}
            className="
              px-3 py-1.5 rounded-lg
              bg-blue-50 dark:bg-blue-900/20
              text-blue-600
              hover:bg-blue-100 dark:hover:bg-blue-900/30
              transition-colors
              text-xs font-medium
              flex items-center gap-1
            "
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="
              px-3 py-1.5 rounded-lg
              text-gray-600 dark:text-gray-400
              hover:text-red-600 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors
              text-xs font-medium
              flex items-center gap-1
            "
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
      </div>
    </div>
  );
}
