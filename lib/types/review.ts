/**
 * Review Types - Advanced Learning Features (Phase 8)
 * Defines types for bidirectional flashcards, multiple review modes, and custom study sessions
 */

import type { VocabularyWord, DifficultyRating } from './vocabulary';

/**
 * Direction of flashcard review
 */
export type ReviewDirection = 'spanish-to-english' | 'english-to-spanish' | 'mixed';

/**
 * Review mode types
 */
export type ReviewMode = 'recognition' | 'recall' | 'listening';

/**
 * Study session configuration
 */
export interface StudySessionConfig {
  /** Number of cards in the session */
  sessionSize: number;
  
  /** Review direction */
  direction: ReviewDirection;
  
  /** Review mode - Phase 18.2: Optional, algorithm selects if not provided */
  mode?: ReviewMode;
  
  /** Filter by vocabulary status */
  statusFilter?: ('new' | 'learning' | 'mastered')[];
  
  /** Filter by tags */
  tagFilter?: string[];
  
  /** Only practice weak words (accuracy < threshold) */
  weakWordsOnly?: boolean;
  
  /** Weak word accuracy threshold (0-100) */
  weakWordsThreshold?: number;
  
  /** Randomize card order - Phase 18.2: Optional, algorithm uses intelligent interleaving if not provided */
  randomize?: boolean;
  
  /** Practice mode: include cards that aren't due yet */
  practiceMode?: boolean;
}

/**
 * Default study session configuration
 */
export const DEFAULT_SESSION_CONFIG: StudySessionConfig = {
  sessionSize: 20,
  direction: 'mixed',  // Phase 18.2: Mixed mode for balanced ES→EN and EN→ES practice
  mode: 'recognition',
  randomize: true,
};

/**
 * Review attempt for recall mode
 */
export interface RecallAttempt {
  /** User's typed answer */
  userAnswer: string;
  
  /** Correct answer */
  correctAnswer: string;
  
  /** Whether answer was correct */
  isCorrect: boolean;
  
  /** Similarity score (0-1) for partial credit */
  similarityScore: number;
  
  /** Time taken to answer (milliseconds) */
  timeToAnswer: number;
}

/**
 * Extended review result with mode-specific data
 */
export interface ExtendedReviewResult {
  /** Vocabulary word ID */
  vocabularyId: string;
  
  /** Difficulty rating */
  rating: DifficultyRating;
  
  /** Review mode used */
  mode: ReviewMode;
  
  /** Review direction */
  direction: ReviewDirection;
  
  /** Timestamp of review */
  reviewedAt: Date;
  
  /** Time spent on card (milliseconds) */
  timeSpent: number;
  
  /** Phase 18.1 Task 4: Review method type (traditional, fill-blank, etc.) */
  reviewMethod?: string;
  
  /** Phase 18.1 Task 4: Difficulty multiplier for SM-2 (based on method) */
  difficultyMultiplier?: number;
  
  /** Recall attempt data (if mode is recall) */
  recallAttempt?: RecallAttempt;
  
  /** Number of times audio was played (if mode is listening) */
  audioPlayCount?: number;
}

/**
 * Forgetting curve data point
 */
export interface ForgettingCurveDataPoint {
  /** Days since last review */
  daysSinceReview: number;
  
  /** Retention probability (0-1) */
  retentionProbability: number;
  
  /** Timestamp of data point */
  timestamp: number;
}

/**
 * Advanced spaced repetition metadata
 */
export interface AdvancedSRMetadata {
  /** Forgetting curve data points */
  forgettingCurve: ForgettingCurveDataPoint[];
  
  /** Predicted retention at next review date */
  predictedRetention: number;
  
  /** Optimal review date based on forgetting curve */
  optimalReviewDate: number;
  
  /** Difficulty adjustment factor (personalized) */
  difficultyAdjustment: number;
  
  /** Average time to answer (milliseconds) */
  avgTimeToAnswer: number;
  
  /** Standard deviation of time to answer */
  stdDevTimeToAnswer: number;
}

