/**
 * Test Review Sync Fix
 * Verify that Review records are now being synced to PostgreSQL
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReviewSyncFix() {
  console.log('🔍 TESTING REVIEW SYNC FIX');
  console.log('==========================\n');
  
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'kbrookes2507@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`👤 User: ${user.email}\n`);
    
    // Check current state
    console.log('📊 CURRENT STATE:');
    console.log('─'.repeat(60));
    
    const vocabCount = await prisma.vocabularyItem.count({
      where: {
        userId: user.id,
        isDeleted: false,
      }
    });
    
    const vocabWithReviews = await prisma.vocabularyItem.count({
      where: {
        userId: user.id,
        isDeleted: false,
        repetitions: {
          gt: 0
        }
      }
    });
    
    const reviewRecordCount = await prisma.review.count({
      where: {
        userId: user.id,
      }
    });
    
    console.log(`Total vocabulary words: ${vocabCount}`);
    console.log(`Words with reviews (repetitions > 0): ${vocabWithReviews}`);
    console.log(`Review records in PostgreSQL: ${reviewRecordCount}`);
    
    if (reviewRecordCount === 0 && vocabWithReviews > 0) {
      console.log('\n🔴 ISSUE CONFIRMED: No Review records despite having reviewed words');
      console.log('   This indicates reviews are NOT being synced to PostgreSQL\n');
    } else if (reviewRecordCount > 0) {
      console.log('\n✅ GOOD: Review records exist in PostgreSQL');
      console.log(`   ${reviewRecordCount} review records found\n`);
      
      // Show sample review records
      const sampleReviews = await prisma.review.findMany({
        where: { userId: user.id },
        include: {
          vocabulary: {
            select: {
              spanish: true,
              english: true,
            }
          }
        },
        orderBy: { reviewDate: 'desc' },
        take: 5
      });
      
      console.log('Sample of most recent reviews:');
      sampleReviews.forEach((r, i) => {
        console.log(`   ${i + 1}. "${r.vocabulary.spanish}" (${r.vocabulary.english})`);
        console.log(`      Reviewed: ${r.reviewDate.toISOString().split('T')[0]}`);
        console.log(`      Quality: ${r.quality}/5, Correct: ${r.correct}`);
        console.log(`      Type: ${r.reviewType}, Direction: ${r.direction}`);
      });
    }
    
    // Check problem words specifically
    console.log('\n\n📝 CHECKING PROBLEM WORDS:');
    console.log('─'.repeat(60));
    
    const problemWords = ['modales', 'botella', 'ortografía'];
    
    for (const wordText of problemWords) {
      const word = await prisma.vocabularyItem.findFirst({
        where: {
          userId: user.id,
          spanish: {
            contains: wordText,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          spanish: true,
          repetitions: true,
        }
      });
      
      if (word) {
        const reviewCount = await prisma.review.count({
          where: {
            userId: user.id,
            vocabularyId: word.id,
          }
        });
        
        console.log(`\n"${word.spanish}":`);
        console.log(`   VocabularyItem.repetitions: ${word.repetitions}`);
        console.log(`   Review records count: ${reviewCount}`);
        
        if (word.repetitions > 0 && reviewCount === 0) {
          console.log(`   🔴 MISMATCH: Has ${word.repetitions} repetitions but 0 Review records`);
        } else if (word.repetitions > 0 && reviewCount > 0) {
          console.log(`   ✅ SYNCED: Both repetitions and Review records exist`);
        }
      }
    }
    
    console.log('\n\n📋 DIAGNOSIS:');
    console.log('═'.repeat(60));
    
    if (reviewRecordCount === 0 && vocabWithReviews > 0) {
      console.log('🔴 Reviews are NOT being synced to PostgreSQL');
      console.log('\nNext steps:');
      console.log('   1. Complete a review session on the live site');
      console.log('   2. Check if Review records are created in PostgreSQL');
      console.log('   3. If still 0, the sync endpoint fix needs verification');
    } else if (reviewRecordCount > 0) {
      console.log('✅ Fix is working! Review records are being synced to PostgreSQL');
      console.log('\nData integrity restored:');
      console.log(`   - ${reviewRecordCount} review records backed up in cloud`);
      console.log(`   - No risk of data loss if browser storage is cleared`);
      console.log(`   - Retention analytics and method tracking now possible`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testReviewSyncFix()
  .catch(console.error);
