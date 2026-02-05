/**
 * Central export point for all TypeScript type definitions
 */

export type {
  Gender,
  PartOfSpeech,
  VocabularyStatus,
  DifficultyRating,
  VocabularyWord,
  ReviewRecord,
  ReviewResponse,
  ReviewSession,
  DailyStats,
  UserPreferences,
  VocabularyLookupResult,
} from './vocabulary';

export type {
  TimePeriod,
  TrendDirection,
  LearningVelocity,
  RetentionMetrics,
  StreakData,
  StreakMilestone,
  PersonalRecord,
  HistoricalReport,
  WeeklyReport,
  MonthlyReport,
  YearInReview,
  AccuracyTrendPoint,
  VelocityDataPoint,
  HeatmapData,
  AdvancedStats,
  PeriodComparison,
} from './analytics';

export type {
  LanguageCode,
  LanguagePair,
  GrammarMetadata,
  SpanishRegion,
  RegionalVariant,
  VerifiedVocabularyData,
  VerificationInput,
  CacheStrategy,
  VerifiedLookupResponse,
  CacheStatistics,
  CorrectionPattern,
  VerifiedVocabularyUpdate,
  VerifiedVocabularyFilters,
} from './verified-vocabulary';

export {
  DEFAULT_CACHE_STRATEGY,
  AGGRESSIVE_CACHE_STRATEGY,
  isLanguageCode,
  isLanguagePair,
  parseLanguagePair,
  createLanguagePair,
} from './verified-vocabulary';

