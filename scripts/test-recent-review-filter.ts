/**
 * Test Recently Reviewed Filter
 * Verify that the 4-hour cooldown filter works correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRecentReviewFilter() {
  console.log('🧪 TESTING RECENTLY REVIEWED FILTER (4-HOUR COOLDOWN)');
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
    
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    
    console.log('📅 TIME REFERENCES:');
    console.log('─'.repeat(70));
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`4 hours ago:  ${fourHoursAgo.toISOString()}`);
    console.log(`1 hour ago:   ${oneHourAgo.toISOString()}`);
    console.log('');
    
    // Check words reviewed recently
    const recentlyReviewedWords = await prisma.vocabularyItem.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        lastReviewDate: {
          not: null,
        }
      },
      select: {
        spanish: true,
        lastReviewDate: true,
        nextReviewDate: true,
        repetitions: true,
      },
      orderBy: {
        lastReviewDate: 'desc',
      },
      take: 20,
    });
    
    console.log('🔍 RECENTLY REVIEWED WORDS (Last 20):');
    console.log('─'.repeat(70));
    
    if (recentlyReviewedWords.length === 0) {
      console.log('No recently reviewed words found.');
    } else {
      recentlyReviewedWords.forEach((word, i) => {
        const lastReview = word.lastReviewDate ? new Date(word.lastReviewDate) : null;
        const hoursSince = lastReview ? (now.getTime() - lastReview.getTime()) / (60 * 60 * 1000) : null;
        const withinCooldown = hoursSince !== null && hoursSince < 4;
        
        const indicator = withinCooldown ? '🔴' : '✅';
        const status = withinCooldown ? 'BLOCKED by cooldown' : 'Available';
        
        console.log(`${indicator} ${i + 1}. "${word.spanish}"`);
        console.log(`   Last reviewed: ${lastReview?.toISOString() || 'Never'}`);
        console.log(`   Hours since: ${hoursSince?.toFixed(2) || 'N/A'}`);
        console.log(`   Status: ${status}`);
        console.log('');
      });
    }
    
    // Count how many words would be filtered out
    const wordsWithinCooldown = recentlyReviewedWords.filter(word => {
      const lastReview = word.lastReviewDate ? new Date(word.lastReviewDate) : null;
      const hoursSince = lastReview ? (now.getTime() - lastReview.getTime()) / (60 * 60 * 1000) : null;
      return hoursSince !== null && hoursSince < 4;
    });
    
    console.log('📊 SUMMARY:');
    console.log('═'.repeat(70));
    console.log(`Total words reviewed (sample): ${recentlyReviewedWords.length}`);
    console.log(`Words within 4-hour cooldown: ${wordsWithinCooldown.length}`);
    console.log(`Words available after filter: ${recentlyReviewedWords.length - wordsWithinCooldown.length}`);
    console.log('');
    
    // Check how many words are currently due
    const dueWords = await prisma.vocabularyItem.count({
      where: {
        userId: user.id,
        isDeleted: false,
        nextReviewDate: {
          lte: now,
        }
      }
    });
    
    console.log('📈 IMPACT ON DUE WORDS:');
    console.log('─'.repeat(70));
    console.log(`Total due words (before filter): ${dueWords}`);
    
    // Estimate words filtered out (assuming same ratio)
    const estimatedFiltered = Math.round((wordsWithinCooldown.length / recentlyReviewedWords.length) * dueWords);
    const estimatedAvailable = dueWords - estimatedFiltered;
    
    console.log(`Estimated filtered out: ~${estimatedFiltered} words`);
    console.log(`Estimated available: ~${estimatedAvailable} words`);
    console.log('');
    
    console.log('💡 EXPECTED BEHAVIOR:');
    console.log('─'.repeat(70));
    console.log('✅ Words reviewed < 4 hours ago will NOT appear in review session');
    console.log('✅ Words reviewed > 4 hours ago WILL appear if due');
    console.log('✅ Words never reviewed WILL appear (no lastReviewDate)');
    console.log('✅ This prevents same-word-twice-in-one-day frustration');
    console.log('');
    
    console.log('🧪 TEST SCENARIOS:');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Scenario 1: Complete review session at 10:00 AM');
    console.log('  → Word "modales" marked as "Forgot"');
    console.log('  → Interval resets to 1 day');
    console.log('  → lastReviewDate: 10:00 AM (today)');
    console.log('  → nextReviewDate: 10:00 AM (tomorrow)');
    console.log('');
    console.log('Scenario 2: Start new review session at 2:00 PM (same day)');
    console.log('  → Only 4 hours passed (< 4-hour cooldown)');
    console.log('  → 🔴 "modales" is BLOCKED by cooldown');
    console.log('  → Will not appear in this session');
    console.log('');
    console.log('Scenario 3: Start new review session at 3:00 PM (next day)');
    console.log('  → 29 hours passed (> 4-hour cooldown)');
    console.log('  → ✅ "modales" is AVAILABLE');
    console.log('  → Will appear in this session (if due)');
    console.log('');
    
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Next steps:');
    console.log('1. Complete a review session on live site');
    console.log('2. Try to start another session within 4 hours');
    console.log('3. Verify words from first session do NOT appear');
    console.log('4. Wait 4+ hours and verify words DO appear again');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRecentReviewFilter()
  .catch(console.error);
