"use client";

import { useState, useEffect } from "react";
import { Settings, Zap } from "lucide-react";
import type { StudySessionConfig } from "@/lib/types/review";
import type { VocabularyWord } from "@/lib/types/vocabulary";
import { getAllReviews, getDueReviews } from "@/lib/db/reviews";

/**
 * Session Configuration Component - Phase 18.2
 * 
 * Simplified session preferences aligned with intelligent algorithm:
 * - Session size (time management)
 * - Topic filter (thematic study)
 * - Practice mode (review any words, not just due)
 * 
 * Algorithm automatically handles:
 * - Method selection (5 varied methods)
 * - Direction variation (balanced ES→EN and EN→ES)
 * - Weakness targeting (70% weight toward struggling areas)
 * - Intelligent interleaving (spaced similar words)
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
  const [tagFilter, setTagFilter] = useState<string[]>(defaultConfig.tagFilter || []);
  const [practiceMode, setPracticeMode] = useState(defaultConfig.practiceMode || false);
  const [actualAvailable, setActualAvailable] = useState(totalAvailable);
  
  // Phase 18.2: Removed redundant settings (mode, direction, statusFilter, weakWordsOnly, weakWordsThreshold, randomize)
  // Algorithm now handles method selection, weakness targeting, and intelligent ordering automatically

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

        // Apply tag filter if configured
        if (tagFilter.length > 0) {
          wordsToReview = wordsToReview.filter(word =>
            word.tags?.some((tag: string) => tagFilter.includes(tag))
          );
        }

        setActualAvailable(wordsToReview.length);
      } catch (error) {
        console.error('Failed to calculate available cards:', error);
        setActualAvailable(totalAvailable);
      }
    }

    calculateAvailable();
  }, [allWords, practiceMode, tagFilter, totalAvailable]);

  const handleStart = () => {
    const config: StudySessionConfig = {
      sessionSize,
      direction: 'mixed',  // Phase 18.2: Algorithm varies direction per card
      // Phase 18.2: mode removed - algorithm selects optimal method per card automatically
      tagFilter: tagFilter.length > 0 ? tagFilter : undefined,
      practiceMode: practiceMode || undefined,
      // Phase 18.2: Removed redundant settings - algorithm handles these automatically:
      // - mode: Algorithm selects optimal review method (traditional, fill-blank, multiple-choice, audio, context-selection)
      // - statusFilter: Algorithm prioritizes due words
      // - weakWordsOnly: Algorithm weights weaknesses (70% toward struggling methods)
      // - weakWordsThreshold: Algorithm calculates dynamically
      // - randomize: Algorithm uses intelligent interleaving
    };
    onStart(config);
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
          Review Preferences
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary">
          Adjust your current session
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

      {/* Essential Settings */}
      
      {/* Algorithm Info */}
      <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
        <p className="text-sm text-text-secondary text-center">
          ✨ <strong className="text-accent">Smart Algorithm Active</strong>
          <br />
          <span className="text-xs">
            Palabra automatically varies review methods, targets your weaknesses, 
            and optimizes for retention. Just focus on learning!
          </span>
        </p>
      </div>

      {/* Advanced Options - Collapsible */}
      <div className="space-y-3">

        {/* Tag Filter - Keep for thematic study */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">
              🏷️ Filter by Topic <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    tagFilter.includes(tag)
                      ? 'bg-accent text-white'
                      : 'bg-black/5 dark:bg-white/5 text-text hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Practice Mode - Keep for flexibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Practice Mode
            </label>
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                practiceMode ? 'bg-orange-500' : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  practiceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-text-tertiary">
            Review any words, not just due cards
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-3 rounded-xl border ${actualAvailable === 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-accent/10 border-accent/20'}`}>
        <p className={`text-xs sm:text-sm text-center ${actualAvailable === 0 ? 'text-orange-800 dark:text-orange-200' : 'text-text-secondary'}`}>
          <span className={`font-semibold ${actualAvailable === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-accent'}`}>{effectiveSessionSize}</span> cards available
          {tagFilter.length > 0 && ` • Topics: ${tagFilter.join(', ')}`}
          {practiceMode && ` • Practice mode`}
        </p>
        {actualAvailable === 0 && tagFilter.length > 0 && (
          <p className="text-xs text-center text-orange-700 dark:text-orange-300 mt-2">
            No words found with selected topics. Try removing some filters.
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
          Apply
        </button>
      </div>
    </div>
  );
}

