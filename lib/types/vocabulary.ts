/**
 * Core TypeScript type definitions for the Spanish Vocabulary Learning Application
 * Defines data models for vocabulary words, reviews, sessions, and user progress
 */

/**
 * Gender classification for Spanish nouns
 */
export type Gender = 'masculine' | 'feminine' | 'neutral';

/**
 * Part of speech classification
 */
export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'pronoun' 
  | 'preposition' 
  | 'conjunction' 
  | 'interjection';

/**
 * Vocabulary status categories for tracking learning progress
 */
export type VocabularyStatus = 'new' | 'learning' | 'mastered';

/**
 * User self-assessment difficulty ratings for spaced repetition
 */
export type DifficultyRating = 'forgot' | 'hard' | 'good' | 'easy';

/**
 * Context type for example sentences
 */
export type ExampleContext = 'formal' | 'informal' | 'neutral';

/**
 * Example sentence pair (Spanish + English)
 */
export interface ExampleSentence {
  spanish: string;
  english: string;
  context?: ExampleContext;
}

/**
 * Audio pronunciation data with multiple sources
 */
export interface AudioPronunciation {
  /** Audio file URL or base64 data */
  url: string;
  /** Source of pronunciation (tts, native, user) */
  source: 'tts' | 'native' | 'user';
  /** Regional accent (spain, mexico, argentina, etc.) */
  accent?: string;
  /** Speed multiplier (0.5 = slow, 1.0 = normal, 1.5 = fast) */
  speed?: number;
}

/**
 * Word relationship data (synonyms, antonyms, etc.)
 */
export interface WordRelationships {
  /** Synonyms */
  synonyms?: string[];
  /** Antonyms */
  antonyms?: string[];
  /** Related words */
  related?: string[];
  /** Word family */
  wordFamily?: string[];
}

/**
 * Verb conjugation table
 */
export interface VerbConjugation {
  /** Infinitive form */
  infinitive: string;
  /** Present tense conjugations */
  present?: {
    yo?: string;
    tu?: string;
    el?: string;
    nosotros?: string;
    vosotros?: string;
    ellos?: string;
  };
  /** Past tense conjugations */
  preterite?: {
    yo?: string;
    tu?: string;
    el?: string;
    nosotros?: string;
    vosotros?: string;
    ellos?: string;
  };
  /** Future tense conjugations */
  future?: {
    yo?: string;
    tu?: string;
    el?: string;
    nosotros?: string;
    vosotros?: string;
    ellos?: string;
  };
}

/**
 * Visual association data
 */
export interface VisualAssociation {
  /** Image URL */
  url: string;
  /** Image source (api, upload, generated) */
  source: 'api' | 'upload' | 'generated';
  /** Alt text for accessibility */
  altText?: string;
  /** Attribution if from external source */
  attribution?: string;
}

/**
 * Main vocabulary word entity
 */
export interface VocabularyWord {
  /** Unique identifier */
  id: string;
  
  /** Spanish word or phrase */
  spanishWord: string;
  
  /** English translation */
  englishTranslation: string;
  
  /** Gender (for nouns) */
  gender?: Gender;
  
  /** Part of speech */
  partOfSpeech?: PartOfSpeech;
  
  /** Example sentences (multiple with context) */
  examples: ExampleSentence[];
  
  /** URL or path to audio pronunciation file (legacy, for backwards compatibility) */
  audioUrl?: string;
  
  /** Enhanced audio pronunciations with multiple sources */
  audioPronunciations?: AudioPronunciation[];
  
  /** Word relationships (synonyms, antonyms, etc.) */
  relationships?: WordRelationships;
  
  /** Verb conjugation table (if word is a verb) */
  conjugation?: VerbConjugation;
  
  /** Visual associations (images) */
  images?: VisualAssociation[];
  
  /** Timestamp when word was added */
  createdAt: number;
  
  /** Timestamp of last update */
  updatedAt: number;
  
  /** Current learning status */
  status: VocabularyStatus;
  
  /** Personal notes or mnemonics (rich text supported) */
  notes?: string;
  
  /** Custom tags for organization */
  tags?: string[];
  
  /** Soft delete flag for sync (true = deleted but not yet synced to server) */
  isDeleted?: boolean;
  
  /** Version number for conflict resolution during sync */
  version?: number;
}

/**
 * Review record tracking spaced repetition data (SM-2 algorithm)
 */
export interface ReviewRecord {
  /** Unique identifier */
  id: string;
  
  /** Reference to vocabulary word */
  vocabId: string;
  
  /** Ease factor (SM-2 algorithm, default 2.5) */
  easeFactor: number;
  
  /** Interval in days until next review */
  interval: number;
  
  /** Number of consecutive correct reviews */
  repetition: number;
  
  /** Timestamp of last review */
  lastReviewDate: number | null;
  
  /** Timestamp when next review is due */
  nextReviewDate: number;
  
  /** Total number of times reviewed */
  totalReviews: number;
  
  /** Number of correct responses */
  correctCount: number;
  
  /** Number of incorrect responses */
  incorrectCount: number;
  
  /** Directional accuracy tracking (Phase 8 Enhancement) */
  /** Spanish → English correct responses */
  esToEnCorrect: number;
  
  /** Spanish → English total reviews */
  esToEnTotal: number;
  
  /** English → Spanish correct responses */
  enToEsCorrect: number;
  
  /** English → Spanish total reviews */
  enToEsTotal: number;
}

/**
 * Individual review response within a session
 */
export interface ReviewResponse {
  /** Reference to vocabulary word */
  vocabId: string;
  
  /** User's difficulty rating */
  rating: DifficultyRating;
  
  /** Timestamp of response */
  timestamp: number;
  
  /** Time spent on card in milliseconds */
  timeSpent: number;
}

/**
 * Review session tracking
 */
export interface ReviewSession {
  /** Unique identifier */
  id: string;
  
  /** Timestamp when session started */
  startTime: number;
  
  /** Timestamp when session ended (null if ongoing) */
  endTime: number | null;
  
  /** Total cards reviewed in session */
  cardsReviewed: number;
  
  /** Accuracy rate (0-1) */
  accuracyRate: number;
  
  /** Individual responses in this session */
  responses: ReviewResponse[];
}

/**
 * Daily statistics aggregation
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format */
  date: string;
  
  /** New words added */
  newWordsAdded: number;
  
  /** Cards reviewed */
  cardsReviewed: number;
  
  /** Review sessions completed */
  sessionsCompleted: number;
  
  /** Average accuracy rate */
  accuracyRate: number;
  
  /** Timestamp of last modification (for sync tracking) */
  updatedAt?: number;
  
  /** Total time spent studying (milliseconds) */
  timeSpent: number;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  /** Daily review reminder time (HH:MM format) */
  reminderTime?: string;
  
  /** Enable daily reminders */
  remindersEnabled: boolean;
  
  /** Cards per review session */
  cardsPerSession: number;
  
  /** Dark mode preference */
  darkMode: 'light' | 'dark' | 'system';
  
  /** Audio autoplay on flashcard flip */
  audioAutoplay: boolean;
}

/**
 * API response structure for vocabulary lookup
 */
export interface VocabularyLookupResult {
  /** Whether the lookup was successful */
  success: boolean;
  
  /** English translation */
  translation?: string;
  
  /** Detected gender */
  gender?: Gender;
  
  /** Detected part of speech */
  partOfSpeech?: PartOfSpeech;
  
  /** Suggested example sentence in Spanish (legacy) */
  exampleSpanish?: string;
  
  /** Suggested example sentence in English (legacy) */
  exampleEnglish?: string;
  
  /** Multiple example sentences with context */
  examples?: ExampleSentence[];
  
  /** Audio URL (legacy) */
  audioUrl?: string;
  
  /** Enhanced audio pronunciations */
  audioPronunciations?: AudioPronunciation[];
  
  /** Word relationships */
  relationships?: WordRelationships;
  
  /** Verb conjugation (if applicable) */
  conjugation?: VerbConjugation;
  
  /** Suggested images */
  images?: VisualAssociation[];
  
  /** Confidence score (0-1) */
  confidence?: number;
  
  /** Error message if unsuccessful */
  error?: string;
}

