/**
 * Script to check recent deep learning responses in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentResponses() {
  try {
    console.log('🔍 Checking recent deep learning responses...\n');

    // Get the 5 most recent responses
    const responses = await prisma.elaborativeResponse.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (responses.length === 0) {
      console.log('❌ No deep learning responses found in database.');
      return;
    }

    console.log(`✅ Found ${responses.length} recent response(s):\n`);

    responses.forEach((response, index) => {
      console.log(`--- Response #${index + 1} ---`);
      console.log(`ID: ${response.id}`);
      console.log(`User: ${response.user.name || response.user.email}`);
      console.log(`Word ID: ${response.wordId}`);
      console.log(`Prompt Type: ${response.promptType}`);
      console.log(`Question: ${response.question}`);
      console.log(`User Response: ${response.userResponse || '(skipped)'}`);
      console.log(`Skipped: ${response.skipped ? 'Yes' : 'No'}`);
      console.log(`Response Time: ${response.responseTime}ms (${(response.responseTime / 1000).toFixed(1)}s)`);
      console.log(`Created: ${response.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Get statistics
    const totalCount = await prisma.elaborativeResponse.count();
    const skippedCount = await prisma.elaborativeResponse.count({
      where: { skipped: true },
    });
    const engagedCount = totalCount - skippedCount;
    const engagementRate = totalCount > 0 ? (engagedCount / totalCount * 100).toFixed(1) : '0';

    console.log('📊 Overall Statistics:');
    console.log(`Total Responses: ${totalCount}`);
    console.log(`Engaged: ${engagedCount} (${engagementRate}%)`);
    console.log(`Skipped: ${skippedCount} (${(100 - parseFloat(engagementRate)).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentResponses();
