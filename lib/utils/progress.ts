/**
 * Progress tracking and statistics utilities
 * Functions for calculating and formatting learning progress metrics
 */

import type { VocabularyWord, ReviewRecord, DailyStats } from '@/lib/types';
import { determineVocabularyStatus, calculateAccuracy } from './spaced-repetition';

/**
 * Progress statistics summary
 */
export interface ProgressStats {
  // Vocabulary counts
  totalWords: number;
  newWords: number;
  learningWords: number;
  masteredWords: number;
  
  // Review statistics
  totalReviews: number;
  cardsReviewedToday: number;
  newWordsAddedToday: number;
  cardsDueToday: number;
  
  // Accuracy metrics
  overallAccuracy: number;
  todayAccuracy: number;
  
  // Time metrics
  totalStudyTime: number; // milliseconds
  todayStudyTime: number; // milliseconds
  
  // Streak information
  currentStreak: number;
  longestStreak: number;
}

/**
 * Chart data point for visualizations
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Calculate vocabulary status counts
 * 
 * @param words - All vocabulary words
 * @param reviews - All review records
 * @returns Object with counts for each status
 */
export function calculateVocabularyStatusCounts(
  words: VocabularyWord[],
  reviews: ReviewRecord[]
): { new: number; learning: number; mastered: number } {
  const reviewMap = new Map(reviews.map(r => [r.vocabId, r]));
  
  let newCount = 0;
  let learningCount = 0;
  let masteredCount = 0;
  
  for (const word of words) {
    const review = reviewMap.get(word.id);
    
    if (!review) {
      newCount++;
      continue;
    }
    
    const status = determineVocabularyStatus(review);
    
    switch (status) {
      case 'new':
        newCount++;
        break;
      case 'learning':
        learningCount++;
        break;
      case 'mastered':
        masteredCount++;
        break;
    }
  }
  
  return { new: newCount, learning: learningCount, mastered: masteredCount };
}

/**
 * Calculate overall review accuracy
 * 
 * @param reviews - All review records
 * @returns Accuracy percentage (0-100)
 */
export function calculateOverallAccuracy(reviews: ReviewRecord[]): number {
  if (reviews.length === 0) return 0;
  
  const totalReviews = reviews.reduce((sum, r) => sum + r.totalReviews, 0);
  const totalCorrect = reviews.reduce((sum, r) => sum + r.correctCount, 0);
  
  if (totalReviews === 0) return 0;
  
  return Math.round((totalCorrect / totalReviews) * 100);
}

/**
 * Calculate current study streak
 * Number of consecutive days with at least one review session
 * 
 * @param stats - Daily stats records (should be sorted by date desc)
 * @returns Number of consecutive days
 */
export function calculateCurrentStreak(stats: DailyStats[]): number {
  if (stats.length === 0) return 0;
  
  // Sort by date descending
  const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));
  
  let streak = 0;
  let currentDate = new Date();
  
  for (const stat of sortedStats) {
    const statDate = new Date(stat.date);
    const daysDiff = Math.floor((currentDate.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If we've gone more than 1 day without activity, streak is broken
    if (daysDiff > streak + 1) {
      break;
    }
    
    // Only count days with actual activity
    if (stat.cardsReviewed > 0) {
      streak++;
    } else if (daysDiff === 0) {
      // Today with no activity yet doesn't break the streak
      continue;
    } else {
      // Past day with no activity breaks the streak
      break;
    }
    
    currentDate = statDate;
  }
  
  return streak;
}

/**
 * Calculate longest study streak
 * 
 * @param stats - Daily stats records
 * @returns Longest consecutive days
 */
export function calculateLongestStreak(stats: DailyStats[]): number {
  if (stats.length === 0) return 0;
  
  // Sort by date ascending
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDate: Date | null = null;
  
  for (const stat of sortedStats) {
    // Only count days with activity
    if (stat.cardsReviewed === 0) {
      currentStreak = 0;
      previousDate = null;
      continue;
    }
    
    const currentDate = new Date(stat.date);
    
    if (!previousDate) {
      currentStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        // Consecutive day
        currentStreak++;
      } else {
        // Gap in streak
        currentStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
    previousDate = currentDate;
  }
  
  return longestStreak;
}

/**
 * Format time duration for display
 * 
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted string (e.g., "5m 30s", "1h 15m")
 */
export function formatStudyTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
}

/**
 * Prepare chart data for reviews over time
 * 
 * @param stats - Daily stats records
 * @param days - Number of days to show (default 7)
 * @returns Array of chart data points
 */
export function prepareReviewsChartData(
  stats: DailyStats[],
  days: number = 7
): ChartDataPoint[] {
  // Get the last N days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  
  const statsMap = new Map(stats.map(s => [s.date, s]));
  const chartData: ChartDataPoint[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    const stat = statsMap.get(dateKey);
    
    chartData.push({
      date: dateKey,
      value: stat?.cardsReviewed || 0,
      label: formatDateForChart(date),
    });
  }
  
  return chartData;
}

/**
 * Prepare chart data for accuracy over time
 * 
 * @param stats - Daily stats records
 * @param days - Number of days to show (default 7)
 * @returns Array of chart data points
 */
export function prepareAccuracyChartData(
  stats: DailyStats[],
  days: number = 7
): ChartDataPoint[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  
  const statsMap = new Map(stats.map(s => [s.date, s]));
  const chartData: ChartDataPoint[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    const stat = statsMap.get(dateKey);
    
    chartData.push({
      date: dateKey,
      value: stat?.accuracyRate ? Math.round(stat.accuracyRate * 100) : 0,
      label: formatDateForChart(date),
    });
  }
  
  return chartData;
}

/**
 * Format date for chart labels
 * 
 * @param date - Date to format
 * @returns Formatted string (e.g., "Mon", "Tue")
 */
function formatDateForChart(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get date range label
 * 
 * @param days - Number of days in range
 * @returns Label string (e.g., "Last 7 days")
 */
export function getDateRangeLabel(days: number): string {
  if (days === 1) return 'Today';
  if (days === 7) return 'Last 7 days';
  if (days === 30) return 'Last 30 days';
  return `Last ${days} days`;
}

/**
 * Calculate milestone achievements
 * Returns milestones that have been reached
 * 
 * @param stats - Progress statistics
 * @returns Array of milestone descriptions
 */
export function calculateMilestones(stats: ProgressStats): string[] {
  const milestones: string[] = [];
  
  // Vocabulary milestones
  if (stats.totalWords >= 1000) milestones.push('1000+ Words');
  else if (stats.totalWords >= 500) milestones.push('500+ Words');
  else if (stats.totalWords >= 100) milestones.push('100+ Words');
  else if (stats.totalWords >= 50) milestones.push('50+ Words');
  else if (stats.totalWords >= 10) milestones.push('10+ Words');
  
  // Review milestones
  if (stats.totalReviews >= 10000) milestones.push('10,000+ Reviews');
  else if (stats.totalReviews >= 5000) milestones.push('5,000+ Reviews');
  else if (stats.totalReviews >= 1000) milestones.push('1,000+ Reviews');
  else if (stats.totalReviews >= 500) milestones.push('500+ Reviews');
  else if (stats.totalReviews >= 100) milestones.push('100+ Reviews');
  
  // Mastery milestones
  if (stats.masteredWords >= 100) milestones.push('100+ Mastered');
  else if (stats.masteredWords >= 50) milestones.push('50+ Mastered');
  else if (stats.masteredWords >= 25) milestones.push('25+ Mastered');
  else if (stats.masteredWords >= 10) milestones.push('10+ Mastered');
  
  // Streak milestones
  if (stats.currentStreak >= 365) milestones.push('1 Year Streak! 🔥');
  else if (stats.currentStreak >= 180) milestones.push('180 Day Streak! 🔥');
  else if (stats.currentStreak >= 100) milestones.push('100 Day Streak! 🔥');
  else if (stats.currentStreak >= 30) milestones.push('30 Day Streak! 🔥');
  else if (stats.currentStreak >= 7) milestones.push('7 Day Streak! 🔥');
  
  return milestones;
}

