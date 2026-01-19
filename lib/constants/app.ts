/**
 * Application-wide constants and configuration values
 */

/**
 * Application metadata
 */
export const APP_NAME = 'Palabra';
export const APP_DESCRIPTION = 'AI-powered Spanish vocabulary learning with intelligent spaced repetition';
export const APP_VERSION = '1.0.0';

/**
 * Default values for spaced repetition algorithm (SM-2)
 */
export const SPACED_REPETITION = {
  /** Initial ease factor for new words */
  INITIAL_EASE_FACTOR: 2.5,
  
  /** Minimum ease factor */
  MIN_EASE_FACTOR: 1.3,
  
  /** Initial interval for new words (days) */
  INITIAL_INTERVAL: 1,
  
  /** Ease factor adjustment for 'easy' rating */
  EASY_BONUS: 0.15,
  
  /** Ease factor adjustment for 'hard' rating */
  HARD_PENALTY: -0.15,
  
  /** Ease factor adjustment for 'forgot' rating */
  FORGOT_PENALTY: -0.2,
} as const;

/**
 * Review session configuration
 */
export const REVIEW_CONFIG = {
  /** Default cards per session */
  DEFAULT_CARDS_PER_SESSION: 20,
  
  /** Minimum cards per session */
  MIN_CARDS_PER_SESSION: 5,
  
  /** Maximum cards per session */
  MAX_CARDS_PER_SESSION: 50,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  VOCABULARY: 'palabra_vocabulary',
  REVIEWS: 'palabra_reviews',
  SESSIONS: 'palabra_sessions',
  STATS: 'palabra_stats',
  PREFERENCES: 'palabra_preferences',
} as const;

/**
 * IndexedDB configuration
 */
export const DB_CONFIG = {
  NAME: 'palabra_db',
  VERSION: 4, // Incremented for Phase 8 enhancement (directional accuracy tracking in reviews)
  STORES: {
    VOCABULARY: 'vocabulary',
    REVIEWS: 'reviews',
    SESSIONS: 'sessions',
    STATS: 'stats',
    SETTINGS: 'settings',
  },
} as const;

/**
 * Animation timing constants (milliseconds)
 */
export const ANIMATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
} as const;

/**
 * Breakpoint values (pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 320,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  FLIP_CARD: ' ', // Space
  FORGOT: '1',
  HARD: '2',
  GOOD: '3',
  EASY: '4',
  CLOSE_MODAL: 'Escape',
  SEARCH: ['Meta+k', 'Control+k'],
} as const;

