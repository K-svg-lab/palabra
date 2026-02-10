// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../.env.local') });

import { prisma } from '@/lib/backend/db';

async function main() {
  console.log('🗄️  Database Table Information\n');
  console.log('═'.repeat(60));
  
  // Count cached words
  const totalCached = await prisma.verifiedVocabulary.count({
    where: {
      aiExamplesGenerated: true,
    },
  });
  
  console.log(`\n📊 Table: VerifiedVocabulary`);
  console.log(`   Total entries with AI examples: ${totalCached}`);
  
  // Show recent entries
  const recent = await prisma.verifiedVocabulary.findMany({
    where: {
      aiExamplesGenerated: true,
    },
    orderBy: {
      aiExamplesGeneratedAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      sourceWord: true,
      targetWord: true,
      partOfSpeech: true,
      sourceLanguage: true,
      targetLanguage: true,
      aiExamplesGenerated: true,
      aiExamplesGeneratedAt: true,
      primarySource: true,
      aiExamplesByLevel: true,
    },
  });
  
  console.log(`\n📝 Recent Cached Words (Last 5):\n`);
  
  recent.forEach((entry, i) => {
    const examples = entry.aiExamplesByLevel as any;
    const levels = [];
    if (examples?.A1) levels.push('A1');
    if (examples?.B1) levels.push('B1');
    if (examples?.C1) levels.push('C1');
    
    console.log(`${i + 1}. Word: "${entry.sourceWord}" → "${entry.targetWord || '(no translation)'}"`);
    console.log(`   ID: ${entry.id}`);
    console.log(`   Part of Speech: ${entry.partOfSpeech || '(not set)'}`);
    console.log(`   Language: ${entry.sourceLanguage} → ${entry.targetLanguage}`);
    console.log(`   Levels cached: ${levels.join(', ')}`);
    console.log(`   Generated: ${entry.aiExamplesGeneratedAt?.toLocaleString()}`);
    console.log(`   Source: ${entry.primarySource}`);
    console.log('');
  });
  
  console.log('═'.repeat(60));
  console.log('\n🔗 Database Connection:');
  console.log('   Provider: PostgreSQL (Neon)');
  console.log('   Table: VerifiedVocabulary');
  console.log('   Key Fields:');
  console.log('     - sourceWord: Spanish word');
  console.log('     - targetWord: English translation');
  console.log('     - partOfSpeech: Word type (verb, noun, etc.)');
  console.log('     - aiExamplesByLevel: JSON with A1, B1, C1 examples');
  console.log('     - aiExamplesGenerated: Boolean flag');
  console.log('     - aiExamplesGeneratedAt: Timestamp');
  console.log('\n✅ To view in Neon Console:');
  console.log('   1. Go to: https://console.neon.tech');
  console.log('   2. Select your project');
  console.log('   3. Click "Tables" → "VerifiedVocabulary"');
  console.log('   4. Filter: aiExamplesGenerated = true\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
