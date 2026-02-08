/**
 * Review Methods Type Definitions - Phase 18.1 Task 4
 * 
 * Defines types for 5 retrieval practice methods:
 * 1. Traditional - Classic flip card (Spanish → English)
 * 2. Fill in the Blank - Type the missing word in context
 * 3. Multiple Choice - Select correct translation from 4 options
 * 4. Audio Recognition - Hear the word, select/type translation
 * 5. Context Selection - Choose correct word for a given sentence
 * 
 * @module lib/types/review-methods
 */

import type { VocabularyWord, DifficultyRating, ExampleSentence } from './vocabulary';

/**
 * Review method types
 */
export type ReviewMethodType = 
  | 'traditional'        // Classic flip card
  | 'fill-blank'         // Type missing word in sentence
  | 'multiple-choice'    // Select from 4 options
  | 'audio-recognition'  // Audio → translation
  | 'context-selection'; // Choose word for sentence

/**
 * Method difficulty multipliers for SM-2 algorithm
 * Higher = easier (reduces interval growth)
 * Lower = harder (increases interval growth more on success)
 */
export const METHOD_DIFFICULTY_MULTIPLIERS: Record<ReviewMethodType, number> = {
  'traditional': 1.0,          // Baseline difficulty
  'multiple-choice': 0.8,      // Easier (recognition with options)
  'audio-recognition': 1.2,    // Harder (audio processing required)
  'fill-blank': 1.1,           // Medium-hard (context + spelling)
  'context-selection': 0.9,    // Medium (understanding context)
};

/**
 * Method display metadata
 */
export interface ReviewMethodMetadata {
  type: ReviewMethodType;
  name: string;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skillsTargeted: string[];
}

export const REVIEW_METHOD_METADATA: Record<ReviewMethodType, ReviewMethodMetadata> = {
  'traditional': {
    type: 'traditional',
    name: 'Traditional',
    icon: '🎴',
    description: 'Classic flip card review',
    difficulty: 'medium',
    skillsTargeted: ['recognition', 'recall'],
  },
  'fill-blank': {
    type: 'fill-blank',
    name: 'Fill in the Blank',
    icon: '✍️',
    description: 'Type the missing word in a sentence',
    difficulty: 'medium',
    skillsTargeted: ['spelling', 'context', 'recall'],
  },
  'multiple-choice': {
    type: 'multiple-choice',
    name: 'Multiple Choice',
    icon: '✅',
    description: 'Select the correct translation',
    difficulty: 'easy',
    skillsTargeted: ['recognition', 'discrimination'],
  },
  'audio-recognition': {
    type: 'audio-recognition',
    name: 'Audio Recognition',
    icon: '🎧',
    description: 'Hear the word and identify meaning',
    difficulty: 'hard',
    skillsTargeted: ['listening', 'recognition'],
  },
  'context-selection': {
    type: 'context-selection',
    name: 'Context Selection',
    icon: '📝',
    description: 'Choose the right word for the sentence',
    difficulty: 'medium',
    skillsTargeted: ['comprehension', 'context'],
  },
};

/**
 * Method selection history to prevent repetition
 */
export interface MethodHistory {
  wordId: string;
  method: ReviewMethodType;
  timestamp: number;
}

/**
 * Method selection weights based on performance
 */
export interface MethodSelectionWeights {
  traditional: number;
  fillBlank: number;
  multipleChoice: number;
  audioRecognition: number;
  contextSelection: number;
}

/**
 * Word performance by method type
 */
export interface MethodPerformance {
  method: ReviewMethodType;
  attempts: number;
  correct: number;
  accuracy: number;
  lastAttempt: number;
}

/**
 * Multiple choice option
 */
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Fill in the blank question
 */
export interface FillBlankQuestion {
  sentence: string;          // Full sentence with placeholder
  blankPosition: number;     // Character position of blank
  correctAnswer: string;     // The word to fill in
  context: string;           // Before text
  afterContext: string;      // After text
}

/**
 * Context selection question
 */
export interface ContextSelectionQuestion {
  sentence: string;          // Sentence with placeholder
  options: string[];         // 4 word options
  correctIndex: number;      // Index of correct option
  context: 'formal' | 'informal' | 'neutral';
}

/**
 * Audio recognition challenge
 */
export interface AudioRecognitionChallenge {
  audioUrl?: string;         // URL to audio file
  useTTS: boolean;           // Whether to use TTS
  targetWord: string;        // Word being pronounced
  showText: boolean;         // Whether to show Spanish text
}

/**
 * Review method result
 */
export interface ReviewMethodResult {
  wordId: string;
  method: ReviewMethodType;
  rating: DifficultyRating;
  timeSpent: number;         // Milliseconds
  isCorrect: boolean;
  userAnswer?: string;       // For fill-blank and audio-text
  selectedOptionId?: string; // For multiple-choice
  similarity?: number;       // For fuzzy matching (0-1)
}

/**
 * Method selector configuration
 */
export interface MethodSelectorConfig {
  /** Enable method variation (default: true) */
  enableVariation: boolean;
  
  /** Minimum history size before weighting kicks in (default: 5) */
  minHistorySize: number;
  
  /** Weight toward weaker methods (default: 0.7) */
  weaknessWeight: number;
  
  /** Prevent immediate repetition window (default: 3 cards) */
  repetitionWindow: number;
  
  /** Disabled methods (empty = all enabled) */
  disabledMethods: ReviewMethodType[];
}

/**
 * Default method selector configuration
 */
export const DEFAULT_METHOD_SELECTOR_CONFIG: MethodSelectorConfig = {
  enableVariation: true,
  minHistorySize: 5,
  weaknessWeight: 0.7,
  repetitionWindow: 3,
  disabledMethods: [],
};

/**
 * Method selection context
 */
export interface MethodSelectionContext {
  word: VocabularyWord;
  recentHistory: MethodHistory[];
  performance?: MethodPerformance[];
  userLevel?: string; // CEFR level (A1-C2)
}

/**
 * Method selection result
 */
export interface MethodSelectionResult {
  method: ReviewMethodType;
  reason: string;
  confidence: number; // 0-1
  alternatives: Array<{
    method: ReviewMethodType;
    score: number;
  }>;
}
