/**
 * Analytics and advanced statistics type definitions
 * Types for Phase 11: Enhanced Progress & Statistics
 */

/**
 * Time period for data aggregation
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all-time';

/**
 * Trend direction indicator
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Learning velocity metrics
 * Measures the rate of learning over time
 */
export interface LearningVelocity {
  wordsPerWeek: number;
  reviewsPerWeek: number;
  accuracyTrend: TrendDirection;
  velocityTrend: TrendDirection;
}

/**
 * Retention rate metrics
 * Tracks how well words are being retained over time
 */
export interface RetentionMetrics {
  overallRetentionRate: number; // 0-100
  newToLearningRate: number; // % of new words that progress to learning
  learningToMasteredRate: number; // % of learning words that reach mastered
  averageDaysToMastery: number;
  retentionTrend: TrendDirection;
}

/**
 * Streak data with enhanced tracking
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezesAvailable: number;
  freezesUsed: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakMilestones: StreakMilestone[];
}

/**
 * Streak milestone achievement
 */
export interface StreakMilestone {
  days: number;
  label: string;
  achieved: boolean;
  achievedDate?: string;
  emoji: string;
}

/**
 * Personal record tracking
 */
export interface PersonalRecord {
  id: string;
  category: string;
  value: number;
  unit: string;
  achievedDate: string;
  description: string;
}

/**
 * Historical report for a time period
 */
export interface HistoricalReport {
  period: TimePeriod;
  startDate: string;
  endDate: string;
  totalWords: number;
  newWordsAdded: number;
  totalReviews: number;
  averageAccuracy: number;
  totalStudyTime: number; // milliseconds
  activeDays: number;
  mostProductiveDay: string;
  personalRecords: PersonalRecord[];
}

/**
 * Weekly summary report
 */
export interface WeeklyReport extends HistoricalReport {
  period: 'week';
  weekNumber: number;
  year: number;
  dailyBreakdown: {
    date: string;
    cardsReviewed: number;
    accuracy: number;
    studyTime: number;
  }[];
}

/**
 * Monthly summary report
 */
export interface MonthlyReport extends HistoricalReport {
  period: 'month';
  month: number;
  year: number;
  weeklyBreakdown: {
    weekNumber: number;
    cardsReviewed: number;
    accuracy: number;
    studyTime: number;
  }[];
}

/**
 * Year in review summary
 */
export interface YearInReview {
  year: number;
  totalWords: number;
  totalReviews: number;
  totalStudyTime: number;
  averageAccuracy: number;
  longestStreak: number;
  mostProductiveMonth: string;
  topAchievements: string[];
  monthlyData: {
    month: number;
    wordsAdded: number;
    reviews: number;
    accuracy: number;
  }[];
}

/**
 * Accuracy trend data point
 */
export interface AccuracyTrendPoint {
  date: string;
  accuracy: number;
  cardsReviewed: number;
  movingAverage?: number; // 7-day moving average
}

/**
 * Learning velocity data point
 */
export interface VelocityDataPoint {
  date: string;
  wordsAdded: number;
  reviewsCompleted: number;
  cumulativeWords: number;
}

/**
 * Heatmap data for activity visualization
 */
export interface HeatmapData {
  date: string;
  value: number; // activity level (0-4)
  cardsReviewed: number;
  studyTime: number;
}

/**
 * Advanced statistics summary
 */
export interface AdvancedStats {
  learningVelocity: LearningVelocity;
  retentionMetrics: RetentionMetrics;
  streakData: StreakData;
  accuracyTrend: AccuracyTrendPoint[];
  velocityTrend: VelocityDataPoint[];
  heatmapData: HeatmapData[];
  personalRecords: PersonalRecord[];
}

/**
 * Comparison data for period-over-period analysis
 */
export interface PeriodComparison {
  currentPeriod: HistoricalReport;
  previousPeriod: HistoricalReport;
  changes: {
    wordsAdded: number;
    reviews: number;
    accuracy: number;
    studyTime: number;
    activeDays: number;
  };
  percentageChanges: {
    wordsAdded: number;
    reviews: number;
    accuracy: number;
    studyTime: number;
    activeDays: number;
  };
}

