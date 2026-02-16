/**
 * Verify Vocabulary Count Issue
 * 
 * This script checks:
 * 1. Total vocabulary count in database
 * 2. IndexedDB count vs PostgreSQL count
 * 3. Whether 1000-word cap is affecting data
 */

import { prisma } from '@/lib/backend/db';
import { getAllVocabularyWords } from '@/lib/db/vocabulary';

async function verifyVocabularyCount() {
  console.log('🔍 VOCABULARY COUNT VERIFICATION');
  console.log('================================\n');
  
  try {
    // Get authenticated user
    const response = await fetch('http://localhost:3000/api/auth/me');
    if (!response.ok) {
      console.error('❌ Not authenticated. Please log in first.');
      process.exit(1);
    }
    
    const { user } = await response.json();
    console.log(`👤 User: ${user.email} (${user.id})\n`);
    
    // Check PostgreSQL count
    console.log('📊 PostgreSQL (Cloud Database):');
    const postgresTotal = await prisma.vocabularyItem.count({
      where: { 
        userId: user.id,
        isDeleted: false 
      }
    });
    console.log(`   Total words: ${postgresTotal}`);
    
    const postgresDeleted = await prisma.vocabularyItem.count({
      where: { 
        userId: user.id,
        isDeleted: true 
      }
    });
    console.log(`   Deleted words: ${postgresDeleted}`);
    console.log(`   Grand total: ${postgresTotal + postgresDeleted}\n`);
    
    // Get word distribution by update time
    console.log('📅 Most Recent 10 Words (by updatedAt):');
    const recentWords = await prisma.vocabularyItem.findMany({
      where: { userId: user.id, isDeleted: false },
      select: {
        spanish: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    recentWords.forEach((word, i) => {
      console.log(`   ${i + 1}. ${word.spanish} (updated: ${word.updatedAt.toISOString()})`);
    });
    
    console.log('\n📅 Oldest 10 Words (by updatedAt):');
    const oldestWords = await prisma.vocabularyItem.findMany({
      where: { userId: user.id, isDeleted: false },
      select: {
        spanish: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    });
    oldestWords.forEach((word, i) => {
      console.log(`   ${i + 1}. ${word.spanish} (updated: ${word.updatedAt.toISOString()})`);
    });
    
    // Check if we have the sync limit issue
    console.log('\n⚠️  SYNC LIMIT CHECK:');
    if (postgresTotal > 1000) {
      console.log(`   🔴 WARNING: You have ${postgresTotal} words, but sync endpoint only returns 1000!`);
      console.log(`   🔴 Words beyond the 1000 most recent may not sync to new devices.`);
      console.log(`   🔴 This confirms Issue #1 - vocabulary cap at 1000 words.\n`);
      
      // Show which words would be excluded
      const excludedCount = postgresTotal - 1000;
      console.log(`   📊 ${excludedCount} words would NOT sync (oldest ${excludedCount} by updatedAt)`);
      
      // Get the cutoff word
      const cutoffWord = await prisma.vocabularyItem.findMany({
        where: { userId: user.id, isDeleted: false },
        select: { spanish: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        skip: 999,
        take: 1,
      });
      
      if (cutoffWord[0]) {
        console.log(`   📌 Cutoff word: "${cutoffWord[0].spanish}" (updated: ${cutoffWord[0].updatedAt.toISOString()})`);
        console.log(`   📌 Words older than this would not sync to new devices.\n`);
      }
    } else {
      console.log(`   ✅ You have ${postgresTotal} words (under 1000 limit)`);
      console.log(`   ✅ All words should sync normally.\n`);
    }
    
    // Try to check IndexedDB (if running in browser context)
    console.log('💾 IndexedDB (Local Browser Database):');
    try {
      const localWords = await getAllVocabularyWords();
      console.log(`   Total words: ${localWords.length}`);
      
      const localDeleted = localWords.filter(w => w.isDeleted).length;
      console.log(`   Deleted words: ${localDeleted}`);
      console.log(`   Active words: ${localWords.length - localDeleted}\n`);
      
      // Compare counts
      if (localWords.length < postgresTotal) {
        const missing = postgresTotal - localWords.length;
        console.log(`   ⚠️  WARNING: ${missing} words missing from local database!`);
        console.log(`   ⚠️  This suggests sync is not downloading all words.\n`);
      } else if (localWords.length === postgresTotal) {
        console.log(`   ✅ Local and cloud counts match perfectly.\n`);
      } else {
        console.log(`   ℹ️  Local has more words (might include pending uploads).\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Cannot check IndexedDB (run this in browser console instead)\n`);
    }
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log(`   PostgreSQL: ${postgresTotal} words`);
    if (postgresTotal > 1000) {
      console.log(`   🔴 ISSUE CONFIRMED: Sync limit will truncate to 1000 words`);
      console.log(`   🔴 ${postgresTotal - 1000} words at risk of not syncing`);
    } else {
      console.log(`   ✅ No issue detected (under 1000 word limit)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyVocabularyCount();
