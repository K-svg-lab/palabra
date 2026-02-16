/**
 * Check Vocabulary Count Directly from Database
 * Verifies if the 1000-word sync limit is affecting the user
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVocabCount() {
  console.log('🔍 VOCABULARY COUNT VERIFICATION');
  console.log('================================\n');
  
  try {
    // Get all users with their vocab counts
    console.log('👥 Checking all users...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email || user.name || user.id}`);
      console.log('   ' + '─'.repeat(50));
      
      // Count total words
      const totalWords = await prisma.vocabularyItem.count({
        where: { 
          userId: user.id,
          isDeleted: false 
        }
      });
      
      const deletedWords = await prisma.vocabularyItem.count({
        where: { 
          userId: user.id,
          isDeleted: true 
        }
      });
      
      console.log(`   📊 Total active words: ${totalWords}`);
      console.log(`   🗑️  Deleted words: ${deletedWords}`);
      console.log(`   📈 Grand total: ${totalWords + deletedWords}`);
      
      // Check if exceeds sync limit
      if (totalWords > 1000) {
        console.log(`\n   🔴 ISSUE CONFIRMED!`);
        console.log(`   🔴 This user has ${totalWords} words`);
        console.log(`   🔴 Sync endpoint only returns 1000 most recent`);
        console.log(`   🔴 ${totalWords - 1000} words would NOT sync to new devices!`);
        
        // Show the cutoff
        const cutoffWord = await prisma.vocabularyItem.findMany({
          where: { userId: user.id, isDeleted: false },
          select: { 
            spanish: true, 
            updatedAt: true,
            createdAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          skip: 999,
          take: 1,
        });
        
        if (cutoffWord[0]) {
          console.log(`\n   📌 Sync cutoff word (position 1000):`);
          console.log(`      Word: "${cutoffWord[0].spanish}"`);
          console.log(`      Created: ${cutoffWord[0].createdAt.toISOString().split('T')[0]}`);
          console.log(`      Updated: ${cutoffWord[0].updatedAt.toISOString().split('T')[0]}`);
          console.log(`\n   ⚠️  All words older than this would be excluded from sync!`);
        }
        
        // Show oldest words that would be excluded
        console.log(`\n   📋 Sample of excluded words (oldest 5):`);
        const excludedWords = await prisma.vocabularyItem.findMany({
          where: { userId: user.id, isDeleted: false },
          select: { 
            spanish: true, 
            english: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'asc' },
          take: 5,
        });
        
        excludedWords.forEach((word, i) => {
          console.log(`      ${i + 1}. "${word.spanish}" → "${word.english}"`);
          console.log(`         (updated: ${word.updatedAt.toISOString().split('T')[0]})`);
        });
        
      } else if (totalWords > 800) {
        console.log(`\n   ⚠️  WARNING: Approaching 1000 word limit!`);
        console.log(`   ⚠️  Only ${1000 - totalWords} words until sync issues begin.`);
      } else {
        console.log(`\n   ✅ Under 1000 word limit (no sync issues)`);
      }
      
      // Show recent words
      console.log(`\n   📅 Most recent 5 words:`);
      const recentWords = await prisma.vocabularyItem.findMany({
        where: { userId: user.id, isDeleted: false },
        select: { 
          spanish: true, 
          english: true,
          updatedAt: true 
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });
      
      recentWords.forEach((word, i) => {
        console.log(`      ${i + 1}. "${word.spanish}" → "${word.english}"`);
        console.log(`         (updated: ${word.updatedAt.toISOString().split('T')[0]})`);
      });
    }
    
    console.log('\n\n📊 OVERALL SUMMARY:');
    console.log('==================');
    const allVocab = await prisma.vocabularyItem.groupBy({
      by: ['userId'],
      where: { isDeleted: false },
      _count: true,
    });
    
    const usersOver1000 = allVocab.filter(v => v._count > 1000);
    
    if (usersOver1000.length > 0) {
      console.log(`\n🔴 CRITICAL: ${usersOver1000.length} user(s) affected by 1000-word sync limit!`);
      usersOver1000.forEach(v => {
        console.log(`   - User ${v.userId}: ${v._count} words (${v._count - 1000} would not sync)`);
      });
      console.log(`\n✅ Fix has been applied to remove the limit.`);
      console.log(`✅ Users should perform a full sync to download all words.`);
    } else {
      console.log(`\n✅ No users currently affected by sync limit.`);
      console.log(`   (All users have < 1000 words)`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkVocabCount()
  .catch(console.error);
