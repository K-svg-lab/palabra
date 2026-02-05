/**
 * Test script to verify Phase 16 database connection and functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPhase16Database() {
  console.log('🧪 Testing Phase 16 Database Connection...\n');

  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database\n');

    // Test 2: Check if Phase 16 tables exist
    console.log('2. Checking Phase 16 tables...');
    
    const verifiedVocabCount = await prisma.verifiedVocabulary.count();
    console.log(`   ✅ VerifiedVocabulary table exists (${verifiedVocabCount} records)`);
    
    const verificationCount = await prisma.vocabularyVerification.count();
    console.log(`   ✅ VocabularyVerification table exists (${verificationCount} records)\n`);

    // Test 3: Create a test verified vocabulary entry
    console.log('3. Creating test verified vocabulary entry...');
    
    const testWord = await prisma.verifiedVocabulary.upsert({
      where: {
        unique_word_lang_pair: {
          sourceWord: 'perro',
          languagePair: 'es-en',
        },
      },
      update: {
        verificationCount: { increment: 1 },
        lookupCount: { increment: 1 },
      },
      create: {
        sourceLanguage: 'es',
        targetLanguage: 'en',
        languagePair: 'es-en',
        sourceWord: 'perro',
        targetWord: 'dog',
        alternativeTranslations: ['hound', 'pup'],
        partOfSpeech: 'noun',
        grammarMetadata: {
          gender: 'masculine',
          plural: 'perros',
        },
        examples: [
          {
            source: 'El perro es muy amigable',
            target: 'The dog is very friendly',
            sourceLanguage: 'es',
            targetLanguage: 'en',
          },
        ],
        conjugations: [],
        synonyms: ['can'],
        antonyms: ['gato'],
        relatedWords: ['cachorro', 'mascota'],
        regionalVariants: [],
        verificationCount: 5,
        confidenceScore: 0.88,
        lastVerified: new Date(),
        primarySource: 'crowdsourced',
        apiSources: ['deepl'],
        hasDisagreement: false,
        disagreementCount: 0,
        requiresReview: false,
        isOffensive: false,
        lookupCount: 1,
        saveCount: 0,
        editFrequency: 0.05,
        avgReviewSuccessRate: 0.95,
      },
    });

    console.log('   ✅ Created/updated test word:', {
      word: testWord.sourceWord,
      translation: testWord.targetWord,
      confidence: testWord.confidenceScore,
      verifications: testWord.verificationCount,
    });
    console.log();

    // Test 4: Lookup the test word
    console.log('4. Testing cache lookup...');
    
    const cachedWord = await prisma.verifiedVocabulary.findUnique({
      where: {
        unique_word_lang_pair: {
          sourceWord: 'perro',
          languagePair: 'es-en',
        },
      },
    });

    if (cachedWord) {
      console.log('   ✅ Cache lookup successful:', {
        word: cachedWord.sourceWord,
        translation: cachedWord.targetWord,
        confidence: cachedWord.confidenceScore,
        verifications: cachedWord.verificationCount,
        lastVerified: cachedWord.lastVerified?.toISOString(),
      });
    } else {
      console.log('   ❌ Cache lookup failed');
    }
    console.log();

    // Test 5: Get cache statistics
    console.log('5. Getting cache statistics...');
    
    const stats = await prisma.verifiedVocabulary.aggregate({
      _count: { id: true },
      _avg: {
        confidenceScore: true,
        verificationCount: true,
      },
    });

    console.log('   ✅ Cache statistics:', {
      totalWords: stats._count.id,
      avgConfidence: stats._avg.confidenceScore?.toFixed(2),
      avgVerifications: stats._avg.verificationCount?.toFixed(1),
    });
    console.log();

    // Test 6: Query by confidence score
    console.log('6. Querying high-confidence words...');
    
    const highConfidenceWords = await prisma.verifiedVocabulary.findMany({
      where: {
        confidenceScore: { gte: 0.8 },
        verificationCount: { gte: 3 },
      },
      select: {
        sourceWord: true,
        targetWord: true,
        confidenceScore: true,
        verificationCount: true,
      },
      take: 5,
    });

    console.log(`   ✅ Found ${highConfidenceWords.length} high-confidence words:`);
    highConfidenceWords.forEach((word) => {
      console.log(`      - ${word.sourceWord} → ${word.targetWord} (${word.confidenceScore} confidence, ${word.verificationCount} verifications)`);
    });
    console.log();

    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  ✅ ALL PHASE 16 DATABASE TESTS PASSED   ║');
    console.log('╚═══════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPhase16Database();
