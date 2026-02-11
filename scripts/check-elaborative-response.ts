/**
 * Check if elaborative response for "maní" was saved
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkElaborativeResponse() {
  try {
    console.log('🔍 Searching for "maní" in vocabulary...\n');
    
    // Find the vocabulary item
    const vocabItem = await prisma.vocabularyItem.findFirst({
      where: {
        spanish: {
          contains: 'maní',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        spanish: true,
        english: true,
      },
    });

    if (!vocabItem) {
      console.log('❌ Word "maní" not found in vocabulary');
      return;
    }

    console.log('✅ Found vocabulary item:');
    console.log(`   Spanish: ${vocabItem.spanish}`);
    console.log(`   English: ${vocabItem.english}`);
    console.log(`   ID: ${vocabItem.id}\n`);

    // Check for elaborative responses
    console.log('🔍 Checking for elaborative responses...\n');
    
    const responses = await prisma.elaborativeResponse.findMany({
      where: {
        wordId: vocabItem.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (responses.length === 0) {
      console.log('❌ No elaborative responses found for this word');
      console.log('\nPossible reasons:');
      console.log('1. Response may not have been saved yet');
      console.log('2. Deep learning card was shown but not saved');
      console.log('3. Database sync issue');
      return;
    }

    console.log(`✅ Found ${responses.length} elaborative response(s):\n`);
    
    responses.forEach((response, index) => {
      console.log(`--- Response #${index + 1} ---`);
      console.log(`Created: ${response.createdAt.toLocaleString()}`);
      console.log(`Prompt Type: ${response.promptType}`);
      console.log(`Question: ${response.question}`);
      console.log(`User Response: ${response.userResponse || '(skipped)'}`);
      console.log(`Skipped: ${response.skipped}`);
      console.log(`Response Time: ${response.responseTime}ms`);
      console.log('');
    });

    // Check total elaborative responses
    const totalCount = await prisma.elaborativeResponse.count();
    console.log(`\n📊 Total elaborative responses in database: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkElaborativeResponse();
