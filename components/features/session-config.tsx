"use client";

import { useState, useEffect } from "react";
import { Settings, ArrowRight, ArrowLeftRight, Headphones, Eye, Keyboard, Zap } from "lucide-react";
import type { StudySessionConfig, ReviewDirection, ReviewMode } from "@/lib/types/review";
import type { VocabularyStatus, VocabularyWord } from "@/lib/types/vocabulary";
import { getAllReviews, getDueReviews } from "@/lib/db/reviews";

/**
 * Session Configuration Component - Phase 8
 * 
 * Allows users to customize their study session:
 * - Session size (number of cards)
 * - Review direction (Spanish→English, English→Spanish, Mixed)
 * - Review mode (Recognition, Recall, Listening)
 * - Filters (status, tags, weak words)
 */

interface SessionConfigProps {
  /** Default configuration */
  defaultConfig?: Partial<StudySessionConfig>;
  /** Available tags for filtering */
  availableTags?: string[];
  /** Total available cards matching criteria */
  totalAvailable: number;
  /** All vocabulary words for calculating filtered counts */
  allWords: VocabularyWord[];
  /** Callback when user starts session */
  onStart: (config: StudySessionConfig) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

export function SessionConfig({
  defaultConfig = {},
  availableTags = [],
  totalAvailable,
  allWords,
  onStart,
  onCancel,
}: SessionConfigProps) {
  const [sessionSize, setSessionSize] = useState(defaultConfig.sessionSize || 20);
  const [direction, setDirection] = useState<ReviewDirection>(defaultConfig.direction || 'spanish-to-english');
  const [mode, setMode] = useState<ReviewMode>(defaultConfig.mode || 'recognition');
  const [statusFilter, setStatusFilter] = useState<VocabularyStatus[]>(defaultConfig.statusFilter || []);
  const [tagFilter, setTagFilter] = useState<string[]>(defaultConfig.tagFilter || []);
  const [weakWordsOnly, setWeakWordsOnly] = useState(defaultConfig.weakWordsOnly || false);
  const [weakWordsThreshold, setWeakWordsThreshold] = useState(defaultConfig.weakWordsThreshold || 70);
  const [randomize, setRandomize] = useState(defaultConfig.randomize ?? true);
  const [practiceMode, setPracticeMode] = useState(defaultConfig.practiceMode || false);
  const [actualAvailable, setActualAvailable] = useState(totalAvailable);

  // Calculate actual available cards based on current filters
  useEffect(() => {
    async function calculateAvailable() {
      try {
        // Get all review records for filtering
        const allReviews = await getAllReviews();
        const reviewMap = new Map(allReviews.map(r => [r.vocabId, r]));

        // Get due review records
        const dueReviews = await getDueReviews();
        const dueVocabIds = new Set(dueReviews.map(r => r.vocabId));

        // Start with due words or all words based on practice mode
        let wordsToReview = practiceMode 
          ? [...allWords]
          : allWords.filter(word => {
              const hasReview = reviewMap.has(word.id);
              const isDue = dueVocabIds.has(word.id);
              return !hasReview || isDue;
            });

        // Apply status filter if configured
        if (statusFilter.length > 0) {
          wordsToReview = wordsToReview.filter(word => 
            statusFilter.includes(word.status)
          );
        }

        // Apply tag filter if configured
        if (tagFilter.length > 0) {
          wordsToReview = wordsToReview.filter(word =>
            word.tags?.some((tag: string) => tagFilter.includes(tag))
          );
        }

        // Apply weak words filter if configured
        if (weakWordsOnly) {
          const threshold = weakWordsThreshold / 100;
          
          wordsToReview = wordsToReview.filter(word => {
            const review = reviewMap.get(word.id);
            if (!review || review.totalReviews === 0) return true; // Include new words
            
            // Phase 8 Enhancement: Use directional accuracy based on current direction
            let accuracy: number;
            if (direction === 'english-to-spanish') {
              // EN→ES direction: use productive accuracy (typically harder)
              if (review.enToEsTotal > 0) {
                accuracy = review.enToEsCorrect / review.enToEsTotal;
              } else {
                // Never tested in this direction = needs practice (treat as 0% accuracy)
                accuracy = 0;
              }
            } else if (direction === 'spanish-to-english') {
              // ES→EN direction: use receptive accuracy
              if (review.esToEnTotal > 0) {
                accuracy = review.esToEnCorrect / review.esToEnTotal;
              } else {
                // Never tested in this direction = needs practice (treat as 0% accuracy)
                accuracy = 0;
              }
            } else {
              // Mixed direction: use overall accuracy
              accuracy = review.correctCount / review.totalReviews;
            }
            
            return accuracy < threshold;
          });
        }

        setActualAvailable(wordsToReview.length);
      } catch (error) {
        console.error('Failed to calculate available cards:', error);
        setActualAvailable(totalAvailable);
      }
    }

    calculateAvailable();
  }, [allWords, practiceMode, statusFilter, tagFilter, weakWordsOnly, weakWordsThreshold, totalAvailable, direction]);

  const handleStart = () => {
    const config: StudySessionConfig = {
      sessionSize,
      direction,
      mode,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      tagFilter: tagFilter.length > 0 ? tagFilter : undefined,
      weakWordsOnly: weakWordsOnly || undefined,
      weakWordsThreshold: weakWordsOnly ? weakWordsThreshold : undefined,
      randomize,
      practiceMode: practiceMode || undefined,
    };
    onStart(config);
  };

  const toggleStatus = (status: VocabularyStatus) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleTag = (tag: string) => {
    setTagFilter(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const effectiveSessionSize = Math.min(sessionSize, actualAvailable);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-accent">
          <Settings className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-text">
          Configure Study Session
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary">
          Customize your learning experience
        </p>
      </div>

      {/* Session Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text">
          Session Size: <span className="text-accent">{effectiveSessionSize}</span> cards
        </label>
        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={sessionSize}
          onChange={(e) => setSessionSize(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>5</span>
          <span>25</span>
          <span>50</span>
        </div>
      </div>

      {/* Review Direction */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text">
          Review Direction
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            onClick={() => setDirection('spanish-to-english')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              direction === 'spanish-to-english'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">ES → EN</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">Spanish to English</span>
            </div>
          </button>
          <button
            onClick={() => setDirection('english-to-spanish')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              direction === 'english-to-spanish'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
              <span className="text-xs sm:text-sm font-medium">EN → ES</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">English to Spanish</span>
            </div>
          </button>
          <button
            onClick={() => setDirection('mixed')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              direction === 'mixed'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Mixed</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">Both directions</span>
            </div>
          </button>
        </div>
      </div>

      {/* Review Mode */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text">
          Review Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            onClick={() => setMode('recognition')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              mode === 'recognition'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Recognition</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">Flip cards</span>
            </div>
          </button>
          <button
            onClick={() => setMode('recall')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              mode === 'recall'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Recall</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">Type answer</span>
            </div>
          </button>
          <button
            onClick={() => setMode('listening')}
            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
              mode === 'listening'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-2">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Listening</span>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">Audio first</span>
            </div>
          </button>
        </div>
      </div>

      {/* Advanced Options - Compact Layout */}
      <div className="space-y-2 p-3 rounded-xl bg-black/5 dark:bg-white/5">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text">
            Filter by Status <span className="text-text-tertiary">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(['new', 'learning', 'mastered'] as VocabularyStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter.includes(status)
                    ? 'bg-accent text-white'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {status === 'new' && '🆕 New'}
                {status === 'learning' && '📚 Learning'}
                {status === 'mastered' && '✅ Mastered'}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-separator">
            <label className="block text-xs font-medium text-text">
              Filter by Tags <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    tagFilter.includes(tag)
                      ? 'bg-accent text-white'
                      : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weak Words & Practice Mode - Compact Toggles */}
        <div className="space-y-2 pt-2 border-t border-separator">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Weak Words Only
            </label>
            <button
              onClick={() => setWeakWordsOnly(!weakWordsOnly)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                weakWordsOnly ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  weakWordsOnly ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {weakWordsOnly && (
            <div className="space-y-1 pl-5">
              <label className="block text-xs text-text-secondary">
                Threshold: {weakWordsThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={weakWordsThreshold}
                onChange={(e) => setWeakWordsThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-separator">
          <label className="text-xs font-medium text-text flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            Practice Mode
          </label>
          <button
            onClick={() => setPracticeMode(!practiceMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              practiceMode ? 'bg-orange-500' : 'bg-black/10 dark:bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                practiceMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-separator">
          <label className="text-xs font-medium text-text">
            Randomize Order
          </label>
          <button
            onClick={() => setRandomize(!randomize)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              randomize ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                randomize ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-3 rounded-xl border ${actualAvailable === 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-accent/10 border-accent/20'}`}>
        <p className={`text-xs sm:text-sm text-center ${actualAvailable === 0 ? 'text-orange-800 dark:text-orange-200' : 'text-text-secondary'}`}>
          <span className={`font-semibold ${actualAvailable === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-accent'}`}>{effectiveSessionSize}</span> cards available
          {statusFilter.length > 0 && ` • ${statusFilter.join(', ')}`}
          {tagFilter.length > 0 && ` • Tags: ${tagFilter.join(', ')}`}
          {weakWordsOnly && ` • Weak words only`}
        </p>
        {actualAvailable === 0 && weakWordsOnly && (
          <p className="text-xs text-center text-orange-700 dark:text-orange-300 mt-2">
            No words found below {weakWordsThreshold}% accuracy. Try lowering the threshold or disable "Weak Words Only".
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sm:gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 text-text hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleStart}
          disabled={actualAvailable === 0}
          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}

