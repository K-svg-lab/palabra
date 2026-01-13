/**
 * Advanced analytics and statistics utilities
 * Phase 11: Enhanced Progress & Statistics
 */

import type {
  VocabularyWord,
  ReviewRecord,
  DailyStats,
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
  TrendDirection,
  PeriodComparison,
  TimePeriod,
} from '@/lib/types';
import { calculateVocabularyStatusCounts } from './progress';

/**
 * Calculate learning velocity metrics
 * Measures rate of learning over time
 * 
 * @param stats - Array of daily stats
 * @param words - All vocabulary words
 * @returns Learning velocity metrics
 */
export function calculateLearningVelocity(
  stats: DailyStats[],
  words: VocabularyWord[]
): LearningVelocity {
  if (stats.length === 0) {
    return {
      wordsPerWeek: 0,
      reviewsPerWeek: 0,
      accuracyTrend: 'stable',
      velocityTrend: 'stable',
    };
  }

  // Calculate words per week
  const recentWeek = stats.slice(-7);
  const previousWeek = stats.slice(-14, -7);
  
  const recentWordsAdded = recentWeek.reduce((sum, s) => sum + s.newWordsAdded, 0);
  const previousWordsAdded = previousWeek.reduce((sum, s) => sum + s.newWordsAdded, 0);
  
  const recentReviews = recentWeek.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const previousReviews = previousWeek.reduce((sum, s) => sum + s.cardsReviewed, 0);
  
  // Calculate average accuracy for trend
  const recentAccuracy = calculateAverageAccuracy(recentWeek);
  const previousAccuracy = calculateAverageAccuracy(previousWeek);
  
  // Determine trends
  const accuracyTrend = determineTrend(recentAccuracy, previousAccuracy, 2);
  const velocityTrend = determineTrend(recentWordsAdded, previousWordsAdded, 1);
  
  return {
    wordsPerWeek: recentWordsAdded,
    reviewsPerWeek: recentReviews,
    accuracyTrend,
    velocityTrend,
  };
}

/**
 * Calculate retention metrics
 * Tracks how well vocabulary is being retained
 * 
 * @param words - All vocabulary words
 * @param reviews - All review records
 * @returns Retention metrics
 */
export function calculateRetentionMetrics(
  words: VocabularyWord[],
  reviews: ReviewRecord[]
): RetentionMetrics {
  if (words.length === 0) {
    return {
      overallRetentionRate: 0,
      newToLearningRate: 0,
      learningToMasteredRate: 0,
      averageDaysToMastery: 0,
      retentionTrend: 'stable',
    };
  }

  const reviewMap = new Map(reviews.map(r => [r.vocabId, r]));
  const statusCounts = calculateVocabularyStatusCounts(words, reviews);
  
  // Calculate progression rates
  const totalProgressed = statusCounts.learning + statusCounts.mastered;
  const newToLearningRate = words.length > 0 
    ? (totalProgressed / words.length) * 100 
    : 0;
  
  const learningToMasteredRate = (statusCounts.learning + statusCounts.mastered) > 0
    ? (statusCounts.mastered / (statusCounts.learning + statusCounts.mastered)) * 100
    : 0;
  
  // Calculate average days to mastery
  let masteryDays = 0;
  let masteryCount = 0;
  
  for (const word of words) {
    const review = reviewMap.get(word.id);
    if (review && review.easeFactor >= 2.5 && review.repetition >= 3 && review.lastReviewDate) {
      const created = new Date(word.createdAt);
      const lastReview = new Date(review.lastReviewDate);
      const days = Math.floor((lastReview.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      masteryDays += days;
      masteryCount++;
    }
  }
  
  const averageDaysToMastery = masteryCount > 0 ? Math.round(masteryDays / masteryCount) : 0;
  
  // Overall retention rate (based on accuracy and progression)
  const overallRetentionRate = Math.round((newToLearningRate + learningToMasteredRate) / 2);
  
  // Determine retention trend (would need historical data for accurate trend)
  const retentionTrend: TrendDirection = 'stable';
  
  return {
    overallRetentionRate,
    newToLearningRate: Math.round(newToLearningRate),
    learningToMasteredRate: Math.round(learningToMasteredRate),
    averageDaysToMastery,
    retentionTrend,
  };
}

/**
 * Calculate enhanced streak data with milestones
 * 
 * @param stats - Array of daily stats
 * @returns Enhanced streak data
 */
export function calculateStreakData(stats: DailyStats[]): StreakData {
  if (stats.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      freezesAvailable: 0,
      freezesUsed: 0,
      lastActiveDate: '',
      streakMilestones: getStreakMilestones(0),
    };
  }

  // Sort stats by date
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;
  let totalActiveDays = 0;
  let lastActiveDate = '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const stat of sortedStats) {
    if (stat.cardsReviewed === 0) continue;
    
    totalActiveDays++;
    lastActiveDate = stat.date;
    
    const currentDate = new Date(stat.date);
    currentDate.setHours(0, 0, 0, 0);
    
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    lastDate = currentDate;
  }
  
  // Calculate current streak (must include today or yesterday)
  if (lastDate) {
    const daysSinceActive = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActive <= 1) {
      currentStreak = tempStreak;
    }
  }
  
  // Calculate streak freezes (1 per 7 day streak, max 3)
  const freezesAvailable = Math.min(Math.floor(longestStreak / 7), 3);
  
  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    freezesAvailable,
    freezesUsed: 0, // Would need to track this separately
    lastActiveDate,
    streakMilestones: getStreakMilestones(longestStreak),
  };
}

/**
 * Get streak milestones with achievement status
 * 
 * @param longestStreak - Current longest streak
 * @returns Array of streak milestones
 */
function getStreakMilestones(longestStreak: number): StreakMilestone[] {
  const milestones = [
    { days: 3, label: '3 Day Streak', emoji: '🔥' },
    { days: 7, label: '1 Week Streak', emoji: '⭐' },
    { days: 14, label: '2 Week Streak', emoji: '🌟' },
    { days: 30, label: '1 Month Streak', emoji: '💪' },
    { days: 60, label: '2 Month Streak', emoji: '🚀' },
    { days: 90, label: '3 Month Streak', emoji: '🏆' },
    { days: 180, label: '6 Month Streak', emoji: '👑' },
    { days: 365, label: '1 Year Streak', emoji: '🎯' },
  ];
  
  return milestones.map(m => ({
    ...m,
    achieved: longestStreak >= m.days,
  }));
}

/**
 * Calculate accuracy trend with moving average
 * 
 * @param stats - Array of daily stats
 * @param days - Number of days to include
 * @returns Array of accuracy trend points
 */
export function calculateAccuracyTrend(
  stats: DailyStats[],
  days: number = 30
): AccuracyTrendPoint[] {
  const sortedStats = [...stats]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
  
  const trendPoints: AccuracyTrendPoint[] = [];
  
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    
    // Calculate 7-day moving average
    const start = Math.max(0, i - 6);
    const window = sortedStats.slice(start, i + 1);
    const movingAverage = calculateAverageAccuracy(window);
    
    trendPoints.push({
      date: stat.date,
      accuracy: Math.round((stat.accuracyRate || 0) * 100),
      cardsReviewed: stat.cardsReviewed,
      movingAverage,
    });
  }
  
  return trendPoints;
}

/**
 * Calculate learning velocity over time
 * 
 * @param stats - Array of daily stats
 * @param words - All vocabulary words
 * @returns Array of velocity data points
 */
export function calculateVelocityTrend(
  stats: DailyStats[],
  words: VocabularyWord[]
): VelocityDataPoint[] {
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  
  let cumulativeWords = 0;
  const velocityPoints: VelocityDataPoint[] = [];
  
  for (const stat of sortedStats) {
    cumulativeWords += stat.newWordsAdded;
    
    velocityPoints.push({
      date: stat.date,
      wordsAdded: stat.newWordsAdded,
      reviewsCompleted: stat.cardsReviewed,
      cumulativeWords,
    });
  }
  
  return velocityPoints;
}

/**
 * Generate heatmap data for activity visualization
 * 
 * @param stats - Array of daily stats
 * @param days - Number of days to include (default 365)
 * @returns Array of heatmap data points
 */
export function generateHeatmapData(
  stats: DailyStats[],
  days: number = 365
): HeatmapData[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  
  const statsMap = new Map(stats.map(s => [s.date, s]));
  const heatmapData: HeatmapData[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    const stat = statsMap.get(dateKey);
    const cardsReviewed = stat?.cardsReviewed || 0;
    const studyTime = stat?.timeSpent || 0;
    
    // Activity level: 0 (none) to 4 (very active)
    let value = 0;
    if (cardsReviewed === 0) value = 0;
    else if (cardsReviewed < 10) value = 1;
    else if (cardsReviewed < 25) value = 2;
    else if (cardsReviewed < 50) value = 3;
    else value = 4;
    
    heatmapData.push({
      date: dateKey,
      value,
      cardsReviewed,
      studyTime,
    });
  }
  
  return heatmapData;
}

/**
 * Generate weekly report
 * 
 * @param stats - Array of daily stats (for the week)
 * @param words - All vocabulary words
 * @returns Weekly report
 */
export function generateWeeklyReport(
  stats: DailyStats[],
  words: VocabularyWord[]
): WeeklyReport {
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  
  if (sortedStats.length === 0) {
    const today = new Date();
    return {
      period: 'week',
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      weekNumber: getWeekNumber(today),
      year: today.getFullYear(),
      totalWords: words.length,
      newWordsAdded: 0,
      totalReviews: 0,
      averageAccuracy: 0,
      totalStudyTime: 0,
      activeDays: 0,
      mostProductiveDay: '',
      personalRecords: [],
      dailyBreakdown: [],
    };
  }
  
  const startDate = sortedStats[0].date;
  const endDate = sortedStats[sortedStats.length - 1].date;
  const firstDate = new Date(startDate);
  
  const newWordsAdded = sortedStats.reduce((sum, s) => sum + s.newWordsAdded, 0);
  const totalReviews = sortedStats.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const totalStudyTime = sortedStats.reduce((sum, s) => sum + s.timeSpent, 0);
  const averageAccuracy = calculateAverageAccuracy(sortedStats);
  const activeDays = sortedStats.filter(s => s.cardsReviewed > 0).length;
  
  const mostProductiveStat = sortedStats.reduce((max, s) => 
    s.cardsReviewed > max.cardsReviewed ? s : max, sortedStats[0]
  );
  
  const dailyBreakdown = sortedStats.map(s => ({
    date: s.date,
    cardsReviewed: s.cardsReviewed,
    accuracy: Math.round((s.accuracyRate || 0) * 100),
    studyTime: s.timeSpent,
  }));
  
  return {
    period: 'week',
    startDate,
    endDate,
    weekNumber: getWeekNumber(firstDate),
    year: firstDate.getFullYear(),
    totalWords: words.length,
    newWordsAdded,
    totalReviews,
    averageAccuracy,
    totalStudyTime,
    activeDays,
    mostProductiveDay: mostProductiveStat.date,
    personalRecords: [],
    dailyBreakdown,
  };
}

/**
 * Generate monthly report
 * 
 * @param stats - Array of daily stats (for the month)
 * @param words - All vocabulary words
 * @returns Monthly report
 */
export function generateMonthlyReport(
  stats: DailyStats[],
  words: VocabularyWord[]
): MonthlyReport {
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  
  if (sortedStats.length === 0) {
    const today = new Date();
    return {
      period: 'month',
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      totalWords: words.length,
      newWordsAdded: 0,
      totalReviews: 0,
      averageAccuracy: 0,
      totalStudyTime: 0,
      activeDays: 0,
      mostProductiveDay: '',
      personalRecords: [],
      weeklyBreakdown: [],
    };
  }
  
  const startDate = sortedStats[0].date;
  const endDate = sortedStats[sortedStats.length - 1].date;
  const firstDate = new Date(startDate);
  
  const newWordsAdded = sortedStats.reduce((sum, s) => sum + s.newWordsAdded, 0);
  const totalReviews = sortedStats.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const totalStudyTime = sortedStats.reduce((sum, s) => sum + s.timeSpent, 0);
  const averageAccuracy = calculateAverageAccuracy(sortedStats);
  const activeDays = sortedStats.filter(s => s.cardsReviewed > 0).length;
  
  const mostProductiveStat = sortedStats.reduce((max, s) => 
    s.cardsReviewed > max.cardsReviewed ? s : max, sortedStats[0]
  );
  
  // Group by week
  const weekMap = new Map<number, DailyStats[]>();
  for (const stat of sortedStats) {
    const weekNum = getWeekNumber(new Date(stat.date));
    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, []);
    }
    weekMap.get(weekNum)!.push(stat);
  }
  
  const weeklyBreakdown = Array.from(weekMap.entries()).map(([weekNumber, weekStats]) => ({
    weekNumber,
    cardsReviewed: weekStats.reduce((sum, s) => sum + s.cardsReviewed, 0),
    accuracy: calculateAverageAccuracy(weekStats),
    studyTime: weekStats.reduce((sum, s) => sum + s.timeSpent, 0),
  }));
  
  return {
    period: 'month',
    startDate,
    endDate,
    month: firstDate.getMonth() + 1,
    year: firstDate.getFullYear(),
    totalWords: words.length,
    newWordsAdded,
    totalReviews,
    averageAccuracy,
    totalStudyTime,
    activeDays,
    mostProductiveDay: mostProductiveStat.date,
    personalRecords: [],
    weeklyBreakdown,
  };
}

/**
 * Generate year in review summary
 * 
 * @param stats - Array of daily stats (for the year)
 * @param words - All vocabulary words
 * @param reviews - All review records
 * @returns Year in review
 */
export function generateYearInReview(
  stats: DailyStats[],
  words: VocabularyWord[],
  reviews: ReviewRecord[]
): YearInReview {
  const year = new Date().getFullYear();
  const yearStats = stats.filter(s => s.date.startsWith(String(year)));
  
  if (yearStats.length === 0) {
    return {
      year,
      totalWords: words.length,
      totalReviews: 0,
      totalStudyTime: 0,
      averageAccuracy: 0,
      longestStreak: 0,
      mostProductiveMonth: '',
      topAchievements: [],
      monthlyData: [],
    };
  }
  
  const totalReviews = yearStats.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const totalStudyTime = yearStats.reduce((sum, s) => sum + s.timeSpent, 0);
  const averageAccuracy = calculateAverageAccuracy(yearStats);
  const streakData = calculateStreakData(yearStats);
  
  // Group by month
  const monthMap = new Map<number, DailyStats[]>();
  for (let m = 1; m <= 12; m++) {
    monthMap.set(m, []);
  }
  
  for (const stat of yearStats) {
    const month = parseInt(stat.date.split('-')[1]);
    monthMap.get(month)!.push(stat);
  }
  
  const monthlyData = Array.from(monthMap.entries()).map(([month, monthStats]) => ({
    month,
    wordsAdded: monthStats.reduce((sum, s) => sum + s.newWordsAdded, 0),
    reviews: monthStats.reduce((sum, s) => sum + s.cardsReviewed, 0),
    accuracy: calculateAverageAccuracy(monthStats),
  }));
  
  const mostProductiveMonth = monthlyData.reduce((max, m) => 
    m.reviews > max.reviews ? m : max, monthlyData[0]
  );
  
  // Generate achievements
  const topAchievements: string[] = [];
  if (words.length >= 1000) topAchievements.push('Learned 1000+ words');
  if (totalReviews >= 10000) topAchievements.push('Completed 10,000+ reviews');
  if (streakData.longestStreak >= 100) topAchievements.push('100+ day streak');
  if (averageAccuracy >= 90) topAchievements.push('90%+ accuracy');
  
  return {
    year,
    totalWords: words.length,
    totalReviews,
    totalStudyTime,
    averageAccuracy,
    longestStreak: streakData.longestStreak,
    mostProductiveMonth: getMonthName(mostProductiveMonth.month),
    topAchievements,
    monthlyData,
  };
}

/**
 * Calculate personal records
 * 
 * @param stats - All daily stats
 * @param words - All vocabulary words
 * @returns Array of personal records
 */
export function calculatePersonalRecords(
  stats: DailyStats[],
  words: VocabularyWord[]
): PersonalRecord[] {
  if (stats.length === 0) return [];
  
  const records: PersonalRecord[] = [];
  
  // Most cards in one day
  const maxCards = stats.reduce((max, s) => Math.max(max, s.cardsReviewed), 0);
  if (maxCards > 0) {
    const maxCardsStat = stats.find(s => s.cardsReviewed === maxCards)!;
    records.push({
      id: 'max-cards-day',
      category: 'Reviews',
      value: maxCards,
      unit: 'cards',
      achievedDate: maxCardsStat.date,
      description: 'Most cards reviewed in one day',
    });
  }
  
  // Best accuracy day
  const maxAccuracy = stats.reduce((max, s) => Math.max(max, s.accuracyRate || 0), 0);
  if (maxAccuracy > 0) {
    const maxAccuracyStat = stats.find(s => s.accuracyRate === maxAccuracy)!;
    records.push({
      id: 'best-accuracy',
      category: 'Accuracy',
      value: Math.round(maxAccuracy * 100),
      unit: '%',
      achievedDate: maxAccuracyStat.date,
      description: 'Best accuracy in one day',
    });
  }
  
  // Longest study session
  const maxStudyTime = stats.reduce((max, s) => Math.max(max, s.timeSpent), 0);
  if (maxStudyTime > 0) {
    const maxTimeStat = stats.find(s => s.timeSpent === maxStudyTime)!;
    records.push({
      id: 'longest-session',
      category: 'Study Time',
      value: Math.round(maxStudyTime / 60000), // Convert to minutes
      unit: 'minutes',
      achievedDate: maxTimeStat.date,
      description: 'Longest study session',
    });
  }
  
  // Most words in one day
  const maxWords = stats.reduce((max, s) => Math.max(max, s.newWordsAdded), 0);
  if (maxWords > 0) {
    const maxWordsStat = stats.find(s => s.newWordsAdded === maxWords)!;
    records.push({
      id: 'max-words-day',
      category: 'Learning',
      value: maxWords,
      unit: 'words',
      achievedDate: maxWordsStat.date,
      description: 'Most words added in one day',
    });
  }
  
  return records;
}

/**
 * Compare two time periods
 * 
 * @param currentStats - Stats for current period
 * @param previousStats - Stats for previous period
 * @param currentWords - Current vocabulary words
 * @param previousWords - Previous vocabulary words
 * @returns Period comparison
 */
export function comparePeriods(
  currentStats: DailyStats[],
  previousStats: DailyStats[],
  currentWords: VocabularyWord[],
  previousWords: VocabularyWord[]
): PeriodComparison {
  const currentReport = generateWeeklyReport(currentStats, currentWords);
  const previousReport = generateWeeklyReport(previousStats, previousWords);
  
  const changes = {
    wordsAdded: currentReport.newWordsAdded - previousReport.newWordsAdded,
    reviews: currentReport.totalReviews - previousReport.totalReviews,
    accuracy: currentReport.averageAccuracy - previousReport.averageAccuracy,
    studyTime: currentReport.totalStudyTime - previousReport.totalStudyTime,
    activeDays: currentReport.activeDays - previousReport.activeDays,
  };
  
  const percentageChanges = {
    wordsAdded: previousReport.newWordsAdded > 0 
      ? Math.round((changes.wordsAdded / previousReport.newWordsAdded) * 100) 
      : 0,
    reviews: previousReport.totalReviews > 0 
      ? Math.round((changes.reviews / previousReport.totalReviews) * 100) 
      : 0,
    accuracy: previousReport.averageAccuracy > 0 
      ? Math.round((changes.accuracy / previousReport.averageAccuracy) * 100) 
      : 0,
    studyTime: previousReport.totalStudyTime > 0 
      ? Math.round((changes.studyTime / previousReport.totalStudyTime) * 100) 
      : 0,
    activeDays: previousReport.activeDays > 0 
      ? Math.round((changes.activeDays / previousReport.activeDays) * 100) 
      : 0,
  };
  
  return {
    currentPeriod: currentReport,
    previousPeriod: previousReport,
    changes,
    percentageChanges,
  };
}

// Helper functions

/**
 * Calculate average accuracy from stats
 */
function calculateAverageAccuracy(stats: DailyStats[]): number {
  if (stats.length === 0) return 0;
  
  const totalCards = stats.reduce((sum, s) => sum + s.cardsReviewed, 0);
  if (totalCards === 0) return 0;
  
  const weightedAccuracy = stats.reduce(
    (sum, s) => sum + (s.accuracyRate || 0) * s.cardsReviewed,
    0
  );
  
  return Math.round((weightedAccuracy / totalCards) * 100);
}

/**
 * Determine trend direction
 */
function determineTrend(
  current: number,
  previous: number,
  threshold: number
): TrendDirection {
  const diff = current - previous;
  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Get week number of year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get month name from number
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

