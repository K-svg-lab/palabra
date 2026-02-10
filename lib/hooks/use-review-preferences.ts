/**
 * Review Preferences Hook
 * 
 * Manages user's review session preferences with localStorage persistence.
 * Provides smart defaults and remembers last used settings for instant start.
 * 
 * Phase 18 UX Enhancement: Eliminate configuration friction
 */

import { useState, useEffect } from 'react';
import type { StudySessionConfig } from '@/lib/types/review';
import { DEFAULT_SESSION_CONFIG } from '@/lib/types/review';

const STORAGE_KEY = 'review-preferences';

/**
 * Stored preferences interface
 */
interface ReviewPreferences {
  sessionSize: number;
  direction: 'spanish-to-english' | 'english-to-spanish' | 'mixed';
  mode: 'recognition' | 'recall' | 'listening';
  statusFilter: ('new' | 'learning' | 'mastered')[];
  weakWordsOnly: boolean;
  weakWordsThreshold: number;
  practiceMode: boolean;
  randomize: boolean;
  tagFilter: string[];
  interleavingEnabled: boolean; // Phase 18.1.5: Interleaved Practice
  lastUpdated: number;
}

/**
 * Default preferences (smart defaults for instant start)
 */
const DEFAULT_PREFERENCES: ReviewPreferences = {
  sessionSize: 20,
  direction: 'mixed',  // Phase 18.2: Mixed mode for balanced ES→EN and EN→ES practice
  mode: 'recognition',
  statusFilter: ['new', 'learning'], // Focus on active learning by default
  weakWordsOnly: false,
  weakWordsThreshold: 70,
  practiceMode: false,
  randomize: true,
  tagFilter: [],
  interleavingEnabled: true, // Phase 18.1.5: ON by default for optimal learning
  lastUpdated: Date.now(),
};

/**
 * Hook to manage review preferences
 */
export function useReviewPreferences() {
  const [preferences, setPreferencesState] = useState<ReviewPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReviewPreferences;
        
        // Migration: Update old 'spanish-to-english' default to 'mixed'
        // This ensures existing users get the new balanced bidirectional practice
        if (parsed.direction === 'spanish-to-english') {
          console.log('[Preferences] 🔄 Migrating direction from ES→EN to mixed mode');
          parsed.direction = 'mixed';
          parsed.lastUpdated = Date.now();
          
          // Save migrated preferences
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (saveError) {
            console.error('Failed to save migrated preferences:', saveError);
          }
        }
        
        setPreferencesState(parsed);
      }
    } catch (error) {
      console.error('Failed to load review preferences:', error);
      // Use defaults if load fails
    } finally {
      setIsLoaded(true);
    }
  }, []);

  /**
   * Update preferences and persist to localStorage
   */
  const setPreferences = (updates: Partial<ReviewPreferences>) => {
    const newPreferences: ReviewPreferences = {
      ...preferences,
      ...updates,
      lastUpdated: Date.now(),
    };

    setPreferencesState(newPreferences);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to save review preferences:', error);
    }
  };

  /**
   * Convert preferences to StudySessionConfig
   */
  const toSessionConfig = (overrides?: Partial<StudySessionConfig>): StudySessionConfig => {
    return {
      ...DEFAULT_SESSION_CONFIG,
      sessionSize: preferences.sessionSize,
      direction: preferences.direction,
      mode: preferences.mode,
      statusFilter: preferences.statusFilter,
      weakWordsOnly: preferences.weakWordsOnly,
      weakWordsThreshold: preferences.weakWordsThreshold,
      practiceMode: preferences.practiceMode,
      randomize: preferences.randomize,
      tagFilter: preferences.tagFilter,
      ...overrides,
    };
  };

  /**
   * Update preferences from StudySessionConfig
   */
  const updateFromConfig = (config: StudySessionConfig) => {
    setPreferences({
      sessionSize: config.sessionSize,
      direction: config.direction,
      mode: config.mode,
      statusFilter: config.statusFilter || [],
      weakWordsOnly: config.weakWordsOnly || false,
      weakWordsThreshold: config.weakWordsThreshold || 70,
      practiceMode: config.practiceMode || false,
      randomize: config.randomize,
      tagFilter: config.tagFilter || [],
    });
  };

  /**
   * Reset to defaults
   */
  const resetToDefaults = () => {
    setPreferencesState(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  };

  return {
    preferences,
    setPreferences,
    toSessionConfig,
    updateFromConfig,
    resetToDefaults,
    isLoaded,
  };
}
