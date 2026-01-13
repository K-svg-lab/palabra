"use client";

import { useState } from "react";
import { Settings, ArrowRight, ArrowLeftRight, Headphones, Eye, Keyboard, Zap } from "lucide-react";
import type { StudySessionConfig, ReviewDirection, ReviewMode } from "@/lib/types/review";
import type { VocabularyStatus } from "@/lib/types/vocabulary";

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
  /** Callback when user starts session */
  onStart: (config: StudySessionConfig) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

export function SessionConfig({
  defaultConfig = {},
  availableTags = [],
  totalAvailable,
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

  const effectiveSessionSize = Math.min(sessionSize, totalAvailable);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-accent">
          <Settings className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-semibold text-text">
          Configure Study Session
        </h2>
        <p className="text-sm text-text-secondary">
          Customize your learning experience
        </p>
      </div>

      {/* Session Size */}
      <div className="space-y-3">
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
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">
          Review Direction
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => setDirection('spanish-to-english')}
            className={`p-4 rounded-xl border-2 transition-all ${
              direction === 'spanish-to-english'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              <span className="text-sm font-medium">ES → EN</span>
              <span className="text-xs text-text-secondary">Spanish to English</span>
            </div>
          </button>
          <button
            onClick={() => setDirection('english-to-spanish')}
            className={`p-4 rounded-xl border-2 transition-all ${
              direction === 'english-to-spanish'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span className="text-sm font-medium">EN → ES</span>
              <span className="text-xs text-text-secondary">English to Spanish</span>
            </div>
          </button>
          <button
            onClick={() => setDirection('mixed')}
            className={`p-4 rounded-xl border-2 transition-all ${
              direction === 'mixed'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              <span className="text-sm font-medium">Mixed</span>
              <span className="text-xs text-text-secondary">Both directions</span>
            </div>
          </button>
        </div>
      </div>

      {/* Review Mode */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">
          Review Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => setMode('recognition')}
            className={`p-4 rounded-xl border-2 transition-all ${
              mode === 'recognition'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">Recognition</span>
              <span className="text-xs text-text-secondary">Flip cards</span>
            </div>
          </button>
          <button
            onClick={() => setMode('recall')}
            className={`p-4 rounded-xl border-2 transition-all ${
              mode === 'recall'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Keyboard className="w-5 h-5" />
              <span className="text-sm font-medium">Recall</span>
              <span className="text-xs text-text-secondary">Type answer</span>
            </div>
          </button>
          <button
            onClick={() => setMode('listening')}
            className={`p-4 rounded-xl border-2 transition-all ${
              mode === 'listening'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-separator hover:border-accent/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Headphones className="w-5 h-5" />
              <span className="text-sm font-medium">Listening</span>
              <span className="text-xs text-text-secondary">Audio first</span>
            </div>
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">
          Filter by Status <span className="text-text-tertiary">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(['new', 'learning', 'mastered'] as VocabularyStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text">
            Filter by Tags <span className="text-text-tertiary">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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

      {/* Weak Words Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Practice Weak Words Only
          </label>
          <button
            onClick={() => setWeakWordsOnly(!weakWordsOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              weakWordsOnly ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                weakWordsOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {weakWordsOnly && (
          <div className="space-y-2 pl-6">
            <label className="block text-xs text-text-secondary">
              Accuracy threshold: {weakWordsThreshold}%
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

      {/* Randomize */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5">
        <label className="text-sm font-medium text-text">
          Randomize card order
        </label>
        <button
          onClick={() => setRandomize(!randomize)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            randomize ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              randomize ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
        <p className="text-sm text-center text-text-secondary">
          <span className="font-semibold text-accent">{effectiveSessionSize}</span> cards available
          {statusFilter.length > 0 && ` • ${statusFilter.join(', ')}`}
          {tagFilter.length > 0 && ` • Tags: ${tagFilter.join(', ')}`}
          {weakWordsOnly && ` • Weak words only`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-6 rounded-xl font-medium bg-black/5 dark:bg-white/5 text-text hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleStart}
          disabled={effectiveSessionSize === 0}
          className="flex-1 py-3 px-6 rounded-xl font-medium bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}

