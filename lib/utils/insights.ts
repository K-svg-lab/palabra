/**
 * Learning Insights Generator
 * Apple Health-style contextual insights and motivational messages
 * 
 * Generates smart insights based on user learning data
 */

export interface Insight {
  id: string;
  type: 'success' | 'motivation' | 'tip' | 'milestone' | 'celebration';
  icon: string;
  title: string;
  description: string;
  gradient: { from: string; to: string };
  priority: number; // Higher = more important
}

export interface LearningStats {
  // Today
  cardsReviewedToday: number;
  newWordsAddedToday: number;
  todayAccuracy: number;
  todayStudyTime: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  
  // Totals
  totalWords: number;
  totalReviews: number;
  overallAccuracy: number;
  totalStudyTime: number;
  
  // Progress
  newWords: number;
  learningWords: number;
  masteredWords: number;
  
  // Recent trends
  newWordsThisWeek?: number;
  reviewsThisWeek?: number;
  averageAccuracyThisWeek?: number;
  
  // Phase 18.1: Proficiency tracking (optional)
  userId?: string;
  languageLevel?: string;
  levelAssessedAt?: Date;
  
  // Optional: Pre-computed proficiency assessment (from server)
  proficiencyInsight?: {
    suggestedLevel: string;
    currentLevel: string;
    reason: string;
    confidence: number;
  };
}

/**
 * Generate Apple-style insights from user data
 */
export function generateInsights(stats: LearningStats): Insight[] {
  const insights: Insight[] = [];
  
  // Phase 18.1: Proficiency assessment insights (if pre-computed on server)
  if (stats.proficiencyInsight) {
    const { suggestedLevel, currentLevel, reason, confidence } = stats.proficiencyInsight;
    
    if (confidence > 0.7) {
      const levelIndex = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(currentLevel);
      const suggestedIndex = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(suggestedLevel);
      
      if (suggestedIndex > levelIndex) {
        // Level up suggestion
        insights.push({
          id: 'proficiency-level-up',
          type: 'milestone',
          icon: '🎓',
          title: `Ready for ${suggestedLevel}?`,
          description: reason,
          gradient: { from: '#667EEA', to: '#764BA2' },
          priority: 95,
        });
      } else if (suggestedIndex < levelIndex) {
        // Level down suggestion (be gentle)
        insights.push({
          id: 'proficiency-adjust',
          type: 'tip',
          icon: '💡',
          title: 'Consider adjusting your level',
          description: reason,
          gradient: { from: '#4A90E2', to: '#50E3C2' },
          priority: 85,
        });
      }
    }
  }
  
  // Streak achievements
  if (stats.currentStreak >= 30) {
    insights.push({
      id: 'streak-30',
      type: 'celebration',
      icon: '🔥',
      title: `${stats.currentStreak}-day streak!`,
      description: 'Incredible dedication! You\'re in the top 1% of learners.',
      gradient: { from: '#FF6B35', to: '#F7931E' },
      priority: 100,
    });
  } else if (stats.currentStreak >= 14) {
    insights.push({
      id: 'streak-14',
      type: 'milestone',
      icon: '🔥',
      title: `${stats.currentStreak}-day streak!`,
      description: stats.currentStreak === stats.longestStreak
        ? 'That\'s your personal best!'
        : `Just ${stats.longestStreak - stats.currentStreak} more to match your record!`,
      gradient: { from: '#FF6B35', to: '#F7931E' },
      priority: 90,
    });
  } else if (stats.currentStreak >= 7) {
    insights.push({
      id: 'streak-7',
      type: 'success',
      icon: '🔥',
      title: `${stats.currentStreak}-day streak!`,
      description: 'A full week of learning! Keep the momentum going.',
      gradient: { from: '#FF6B35', to: '#F7931E' },
      priority: 85,
    });
  } else if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak-building',
      type: 'motivation',
      icon: '📈',
      title: 'Building momentum',
      description: `${stats.currentStreak} days in a row! Just ${7 - stats.currentStreak} more to reach a week.`,
      gradient: { from: '#4A90E2', to: '#50E3C2' },
      priority: 70,
    });
  }
  
  // Learning velocity
  if (stats.newWordsThisWeek && stats.newWordsThisWeek > 0) {
    const yearlyProjection = stats.newWordsThisWeek * 52;
    insights.push({
      id: 'velocity',
      type: 'success',
      icon: '📚',
      title: `${stats.newWordsThisWeek} words this week`,
      description: `At this pace, you'll learn ${yearlyProjection} words this year!`,
      gradient: { from: '#667EEA', to: '#764BA2' },
      priority: 80,
    });
  }
  
  // Today's activity
  if (stats.cardsReviewedToday >= 50) {
    insights.push({
      id: 'active-day',
      type: 'celebration',
      icon: '⚡',
      title: 'Power session!',
      description: `${stats.cardsReviewedToday} cards reviewed today. You're crushing it!`,
      gradient: { from: '#F093FB', to: '#F5576C' },
      priority: 95,
    });
  } else if (stats.cardsReviewedToday >= 20) {
    insights.push({
      id: 'productive-day',
      type: 'success',
      icon: '✨',
      title: 'Productive day',
      description: `${stats.cardsReviewedToday} cards reviewed. Great work!`,
      gradient: { from: '#4FACFE', to: '#00F2FE' },
      priority: 75,
    });
  }
  
  // Accuracy feedback
  if (stats.todayAccuracy >= 90 && stats.cardsReviewedToday >= 10) {
    insights.push({
      id: 'accuracy-excellent',
      type: 'celebration',
      icon: '🎯',
      title: `${stats.todayAccuracy}% accuracy today`,
      description: 'Outstanding! Your retention is excellent.',
      gradient: { from: '#11998E', to: '#38EF7D' },
      priority: 85,
    });
  } else if (stats.overallAccuracy >= 85) {
    insights.push({
      id: 'accuracy-high',
      type: 'success',
      icon: '🎯',
      title: `${stats.overallAccuracy}% overall accuracy`,
      description: 'Excellent recall! Your reviews are working.',
      gradient: { from: '#11998E', to: '#38EF7D' },
      priority: 75,
    });
  } else if (stats.overallAccuracy < 60 && stats.totalReviews > 20) {
    insights.push({
      id: 'accuracy-improve',
      type: 'tip',
      icon: '💪',
      title: 'Room to improve',
      description: `${stats.overallAccuracy}% accuracy. Try reviewing more frequently!`,
      gradient: { from: '#FFA500', to: '#FF6B6B' },
      priority: 80,
    });
  }
  
  // Mastery progress
  const masteryRate = stats.totalWords > 0 ? (stats.masteredWords / stats.totalWords) * 100 : 0;
  if (masteryRate >= 50) {
    insights.push({
      id: 'mastery-half',
      type: 'milestone',
      icon: '🏆',
      title: `${stats.masteredWords} words mastered`,
      description: `You've mastered ${Math.round(masteryRate)}% of your vocabulary!`,
      gradient: { from: '#A770EF', to: '#CF8BF3' },
      priority: 90,
    });
  } else if (masteryRate >= 25) {
    insights.push({
      id: 'mastery-quarter',
      type: 'success',
      icon: '📖',
      title: 'Making progress',
      description: `${stats.masteredWords} words mastered. You're ${Math.round(masteryRate)}% of the way!`,
      gradient: { from: '#A770EF', to: '#CF8BF3' },
      priority: 70,
    });
  }
  
  // Total words milestones
  if (stats.totalWords >= 1000) {
    insights.push({
      id: 'words-1000',
      type: 'celebration',
      icon: '🌟',
      title: '1,000+ words!',
      description: 'You have an impressive vocabulary collection!',
      gradient: { from: '#FFD700', to: '#FFA500' },
      priority: 95,
    });
  } else if (stats.totalWords >= 500) {
    insights.push({
      id: 'words-500',
      type: 'milestone',
      icon: '🎉',
      title: '500+ words!',
      description: 'Halfway to 1,000! Your vocabulary is growing fast.',
      gradient: { from: '#FFD700', to: '#FFA500' },
      priority: 85,
    });
  } else if (stats.totalWords >= 100) {
    insights.push({
      id: 'words-100',
      type: 'success',
      icon: '🎊',
      title: '100+ words!',
      description: 'You\'ve built a solid foundation. Keep going!',
      gradient: { from: '#FFD700', to: '#FFA500' },
      priority: 80,
    });
  }
  
  // Study time insights
  if (stats.totalStudyTime >= 36000000) { // 10+ hours
    const hours = Math.floor(stats.totalStudyTime / 3600000);
    insights.push({
      id: 'study-time-dedication',
      type: 'milestone',
      icon: '⏱️',
      title: `${hours} hours of study`,
      description: 'Your dedication is inspiring! Keep up the great work.',
      gradient: { from: '#667EEA', to: '#764BA2' },
      priority: 75,
    });
  }
  
  // Motivational messages for beginners
  if (stats.totalWords < 10 && stats.totalWords > 0) {
    insights.push({
      id: 'getting-started',
      type: 'motivation',
      icon: '🌱',
      title: 'Great start!',
      description: 'Every expert was once a beginner. Keep adding words!',
      gradient: { from: '#56CCF2', to: '#2F80ED' },
      priority: 90,
    });
  }
  
  // No activity today
  if (stats.cardsReviewedToday === 0 && stats.totalWords > 0) {
    insights.push({
      id: 'review-reminder',
      type: 'tip',
      icon: '📝',
      title: 'Start your review',
      description: 'A few minutes of practice today can make a big difference!',
      gradient: { from: '#667EEA', to: '#764BA2' },
      priority: 85,
    });
  }
  
  // Sort by priority and return top 3
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

/**
 * Get a motivational message based on performance
 */
export function getMotivationalMessage(accuracy: number, reviewCount: number): string {
  if (accuracy >= 90 && reviewCount >= 10) {
    return '🎯 Outstanding! You\'re mastering this!';
  } else if (accuracy >= 80) {
    return '✨ Great job! Keep up the excellent work!';
  } else if (accuracy >= 70) {
    return '💪 Good progress! You\'re getting better!';
  } else if (accuracy >= 60) {
    return '📈 Keep practicing! You\'re improving!';
  } else {
    return '🌟 Every review makes you stronger!';
  }
}

/**
 * Get achievement title for milestones
 */
export function getAchievementTitle(type: string, value: number): string {
  switch (type) {
    case 'streak':
      if (value >= 100) return 'Centurion';
      if (value >= 50) return 'Half Century';
      if (value >= 30) return 'Monthly Warrior';
      if (value >= 14) return 'Two Week Champion';
      if (value >= 7) return 'Week Warrior';
      return 'Streak Builder';
    case 'words':
      if (value >= 1000) return 'Word Master';
      if (value >= 500) return 'Vocabulary Expert';
      if (value >= 100) return 'Word Collector';
      return 'Beginner';
    case 'reviews':
      if (value >= 10000) return 'Review Legend';
      if (value >= 5000) return 'Review Master';
      if (value >= 1000) return 'Practice Champion';
      return 'Reviewer';
    default:
      return 'Learner';
  }
}
