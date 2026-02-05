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

  // Format next review date
  const formatNextReview = (date: number | null) => {
    if (!date) return 'Not scheduled';
    
    const now = Date.now();
    const diff = date - now;
    
    if (diff < 0) return 'Due now';
    if (diff < 60000) return 'In 1 minute';
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
    if (diff < 604800000) return `In ${Math.floor(diff / 86400000)} days`;
    
    return new Date(date).toLocaleDateString();
  };

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
      await playAudio(word.spanishWord, 'es-ES');
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
      `}
    >
      {/* Main content */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Spanish → English */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {word.spanishWord}
            </span>
            <span className="text-gray-400 flex-shrink-0">→</span>
            <span className="text-lg text-gray-600 dark:text-gray-400 truncate">
              {word.englishTranslation}
            </span>
          </div>
          
          {/* Part of speech & gender */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>📖 {word.partOfSpeech || 'Word'}</span>
            {word.gender && <span>· {word.gender}</span>}
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Audio button */}
        <button
          onClick={handlePlayAudio}
          disabled={isPlayingAudio}
          className="
            p-2 rounded-lg
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors
            flex-shrink-0
            ml-2
          "
          title="Play pronunciation"
        >
          <Volume2
            className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          />
        </button>
      </div>

      {/* Example sentence */}
      {word.examples && word.examples.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 text-sm italic text-gray-700 dark:text-gray-300">
          "{word.examples[0].spanish}"
        </div>
      )}

      {/* Progress bar (next review) */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Next review</span>
          <span className="font-medium">{formatNextReview(word.nextReviewDate || null)}</span>
        </div>
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
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs text-gray-500">
          🔄 {word.totalReviews || 0} reviews
        </div>
        
        <div className="flex gap-1">
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
    </div>
  );
}
