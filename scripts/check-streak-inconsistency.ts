/**
 * Check Streak Inconsistency (Issue #5)
 * Investigate why homepage shows 22 days but progress page shows 7 days
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStreakInconsistency() {
  console.log('🔍 STREAK INCONSISTENCY INVESTIGATION (Issue #5)');
  console.log('═'.repeat(70));
  console.log('');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'kbrookes2507@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`👤 User: ${user.email}\n`);
    
    // Get daily stats from database
    const allStats = await prisma.dailyStats.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: 40, // Get last 40 days
    });
    
    console.log(`📊 Total daily stats records: ${allStats.length}\n`);
    
    if (allStats.length === 0) {
      console.log('No stats found in database. Streak calculation requires stats records.');
      return;
    }
    
    // Calculate streak using the same logic as the app
    function calculateStreak(stats: any[], maxDays: number | null = null): number {
      if (stats.length === 0) return 0;
      
      // Limit to maxDays if specified
      const statsToUse = maxDays ? stats.slice(0, maxDays) : stats;
      
      let streak = 0;
      let currentDate = new Date();
      
      for (const stat of statsToUse) {
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
    
    // Calculate streak using different data windows
    const streak7Days = calculateStreak(allStats, 7);
    const streak30Days = calculateStreak(allStats, 30);
    const streakUnlimited = calculateStreak(allStats, null);
    
    console.log('🔥 STREAK CALCULATIONS:');
    console.log('─'.repeat(70));
    console.log(`Using last 7 days:  ${streak7Days} days`);
    console.log(`Using last 30 days: ${streak30Days} days`);
    console.log(`Using all data:     ${streakUnlimited} days`);
    console.log('');
    
    console.log('🎯 DIAGNOSIS:');
    console.log('═'.repeat(70));
    console.log('');
    
    if (streak7Days !== streak30Days || streak30Days !== streakUnlimited) {
      console.log('🔴 INCONSISTENCY CONFIRMED!');
      console.log('');
      console.log('Root Cause:');
      console.log('  - Homepage uses: getRecentStats(30) → sees full streak');
      console.log('  - Progress page uses: getRecentStats(7) → limited to 7 days max');
      console.log('');
      console.log('Example:');
      console.log('  If user has 22-day streak:');
      console.log('    - Homepage: calculateCurrentStreak(30 days) = 22 days ✅');
      console.log('    - Progress page: calculateCurrentStreak(7 days) = 7 days ❌');
      console.log('');
      console.log('Fix:');
      console.log('  Change progress page to use getRecentStats(90) or getRecentStats(365)');
      console.log('  This allows accurate streak calculation regardless of length');
    } else {
      console.log('✅ No calculation difference - all methods return same streak');
      console.log('   Issue might be cache/sync related');
    }
    
    // Show activity breakdown
    console.log('\n\n📅 ACTIVITY BREAKDOWN (Last 30 Days):');
    console.log('─'.repeat(70));
    
    const last30 = allStats.slice(0, 30);
    last30.forEach((stat, i) => {
      const hasActivity = stat.cardsReviewed > 0;
      const icon = hasActivity ? '✅' : '⭕';
      const date = new Date(stat.date).toISOString().split('T')[0];
      console.log(`${icon} Day ${i + 1}: ${date} - ${stat.cardsReviewed} cards reviewed`);
    });
    
    // Find the actual current streak
    console.log('\n\n🔍 ACTUAL CURRENT STREAK:');
    console.log('─'.repeat(70));
    
    let actualStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < allStats.length; i++) {
      const stat = allStats[i];
      const statDate = new Date(stat.date);
      statDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > actualStreak) break; // Gap detected
      
      if (stat.cardsReviewed > 0) {
        actualStreak++;
        console.log(`✅ Day ${daysDiff}: ${stat.date} - ${stat.cardsReviewed} cards`);
      } else if (daysDiff === 0) {
        // Today with no activity yet
        console.log(`⏳ Day ${daysDiff}: ${stat.date} - 0 cards (today, not yet reviewed)`);
      } else {
        // Past day with no activity - streak broken
        console.log(`❌ Day ${daysDiff}: ${stat.date} - 0 cards (streak broken)`);
        break;
      }
    }
    
    console.log(`\n🔥 ACTUAL STREAK: ${actualStreak} consecutive days\n`);
    
    console.log('📋 CONCLUSION:');
    console.log('═'.repeat(70));
    console.log(`Homepage shows: 22 days (using 30-day data window)`);
    console.log(`Progress page shows: 7 days (using 7-day data window) ⚠️`);
    console.log(`Actual streak: ${actualStreak} days`);
    console.log('');
    console.log('Fix Required:');
    console.log('  Change progress page to query more days of stats');
    console.log('  Recommended: getRecentStats(90) for up to 90-day streaks');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkStreakInconsistency()
  .catch(console.error);
