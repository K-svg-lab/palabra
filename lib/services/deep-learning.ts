/**
 * Deep Learning Service (Phase 18.2.2)
 * 
 * Generates elaborative interrogation prompts to encourage deeper
 * processing and create richer memory traces.
 * 
 * Research: Pressley et al. (1988), Woloshyn et al. (1992)
 * - Elaborative interrogation: Asking "why/how" questions
 * - Effect size: d = 0.71 (medium-large)
 * - Works by connecting new info to existing knowledge
 * 
 * @module deep-learning
 */

import { prisma } from '@/lib/backend/prisma/client';
import OpenAI from 'openai';
import { trackAICost } from './ai-cost-control';

// Initialize OpenAI (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================================================
// TYPES
// ============================================================================

export type ElaborativePromptType = 
  | 'etymology'      // "Why do you think X sounds like Y?"
  | 'connection'     // "How might you remember X?"
  | 'usage'          // "When would you use X vs Y?"
  | 'comparison'     // "How is X similar to/different from Y?"
  | 'personal';      // "Can you think of a time when you'd use X?"

export interface ElaborativePrompt {
  type: ElaborativePromptType;
  question: string;
  hints?: string[];
  idealAnswer?: string;
  wordId: string;
  wordSpanish: string;
  wordEnglish: string;
}

export interface ElaborativeResponse {
  id: string;
  userId: string;
  wordId: string;
  promptType: ElaborativePromptType;
  question: string;
  userResponse: string | null;
  skipped: boolean;
  responseTime: number; // milliseconds
  createdAt: Date;
}

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Generate elaborative prompt for word
 * 
 * Checks cache first, then generates with AI if needed.
 * Falls back to template if AI unavailable or budget exceeded.
 * 
 * @param word - Vocabulary word
 * @param userLevel - User's CEFR level (A1-C2)
 * @returns Elaborative prompt
 */
export async function generateElaborativePrompt(
  word: {
    id: string;
    spanish: string;
    english: string;
    partOfSpeech?: string | null;
    examples?: any;
  },
  userLevel: string = 'B1'
): Promise<ElaborativePrompt> {
  // Check cache first
  const cached = await getCachedPrompt(word.spanish, userLevel);
  if (cached) {
    return {
      ...cached,
      wordId: word.id,
      wordSpanish: word.spanish,
      wordEnglish: word.english,
    };
  }

  // Try to generate with AI
  if (openai) {
    try {
      const aiPrompt = await generateWithAI(word, userLevel);
      
      // Cache for future users
      await cachePrompt(word.spanish, userLevel, aiPrompt);
      
      return {
        ...aiPrompt,
        wordId: word.id,
        wordSpanish: word.spanish,
        wordEnglish: word.english,
      };
    } catch (error) {
      console.error('[Deep Learning] AI generation failed:', error);
      // Fall through to template
    }
  }

  // Fallback to template
  return generateTemplatePrompt(word);
}

/**
 * Generate prompt using AI (OpenAI GPT-3.5-turbo)
 * 
 * @param word - Vocabulary word
 * @param userLevel - User's CEFR level
 * @returns AI-generated prompt
 */
async function generateWithAI(
  word: {
    spanish: string;
    english: string;
    partOfSpeech?: string | null;
    examples?: any;
  },
  userLevel: string
): Promise<Omit<ElaborativePrompt, 'wordId' | 'wordSpanish' | 'wordEnglish'>> {
  const levelDescription = getLevelDescription(userLevel);
  
  const systemPrompt = `You are a Spanish teacher using elaborative interrogation to help students build deeper understanding of vocabulary.

Your goal is to create questions that:
1. Ask "why" or "how" the word relates to what the student already knows
2. Are simple and answerable without research
3. Encourage making connections to prior knowledge
4. Are engaging and conversational, not academic
5. Are appropriate for ${levelDescription}

Avoid:
- Questions that require looking things up
- Overly complex or abstract questions
- Questions that are too easy or obvious
- Academic or textbook-style language`;

  const userPrompt = `Generate an elaborative interrogation question for the Spanish word "${word.spanish}" (meaning: "${word.english}"${word.partOfSpeech ? `, ${word.partOfSpeech}` : ''}).

Examples of good elaborative questions:
- "Why do you think 'biblioteca' sounds similar to the English word 'library'?"
- "How might you remember that 'perro' means 'dog'?"
- "Why might 'banco' mean both 'bank' and 'bench' in Spanish?"
- "Can you think of a situation where you'd use 'estar' instead of 'ser'?"
- "How is 'conocer' different from 'saber' when talking about knowing something?"

Generate ONE engaging question now. Just the question, no explanation.`;

  const startTime = Date.now();
  
  const response = await openai!.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8, // Higher temperature for creativity
    max_tokens: 150,
  });

  const responseTime = Date.now() - startTime;
  const question = response.choices[0].message.content?.trim() || '';
  
  // Track cost
  const tokensUsed = response.usage?.total_tokens || 0;
  const cost = (tokensUsed / 1000) * 0.0015; // GPT-3.5-turbo pricing
  
  await trackAICost({
    service: 'openai',
    model: 'gpt-3.5-turbo',
    endpoint: 'chat/completions',
    tokensUsed,
    cost,
    success: true,
    metadata: {
      feature: 'deep-learning',
      word: word.spanish,
      level: userLevel,
      responseTime,
    },
  });

  // Determine type from question content
  const type = determinePromptType(question);

  return {
    type,
    question,
    hints: [],
  };
}

/**
 * Determine prompt type from question content
 * 
 * @param question - Generated question
 * @returns Prompt type
 */
function determinePromptType(question: string): ElaborativePromptType {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('similar') || lowerQuestion.includes('sounds like')) {
    return 'etymology';
  }
  if (lowerQuestion.includes('remember') || lowerQuestion.includes('recall')) {
    return 'connection';
  }
  if (lowerQuestion.includes('use') || lowerQuestion.includes('when')) {
    return 'usage';
  }
  if (lowerQuestion.includes('different') || lowerQuestion.includes('compare')) {
    return 'comparison';
  }
  if (lowerQuestion.includes('you') || lowerQuestion.includes('your')) {
    return 'personal';
  }
  
  return 'connection'; // Default
}

/**
 * Generate template-based prompt (fallback)
 * 
 * Used when AI is unavailable or budget exceeded.
 * 
 * @param word - Vocabulary word
 * @returns Template-based prompt
 */
function generateTemplatePrompt(
  word: {
    id: string;
    spanish: string;
    english: string;
    partOfSpeech?: string | null;
  }
): ElaborativePrompt {
  const templates = [
    {
      type: 'connection' as ElaborativePromptType,
      question: `How might you remember that "${word.spanish}" means "${word.english}"?`,
    },
    {
      type: 'personal' as ElaborativePromptType,
      question: `Can you think of a situation where you'd use "${word.spanish}"?`,
    },
    {
      type: 'etymology' as ElaborativePromptType,
      question: `Does "${word.spanish}" remind you of any English words?`,
    },
    {
      type: 'usage' as ElaborativePromptType,
      question: `When would you use "${word.spanish}" in conversation?`,
    },
  ];

  // Select random template
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    type: template.type,
    question: template.question,
    wordId: word.id,
    wordSpanish: word.spanish,
    wordEnglish: word.english,
  };
}

/**
 * Get CEFR level description for AI prompt
 * 
 * @param level - CEFR level (A1-C2)
 * @returns Human-readable description
 */
function getLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    A1: 'absolute beginners (basic phrases)',
    A2: 'elementary learners (simple conversations)',
    B1: 'intermediate learners (independent speakers)',
    B2: 'upper intermediate (confident speakers)',
    C1: 'advanced learners (proficient speakers)',
    C2: 'mastery level (near-native fluency)',
  };
  
  return descriptions[level] || descriptions.B1;
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Get cached prompt from database
 * 
 * @param word - Spanish word
 * @param level - CEFR level
 * @returns Cached prompt or null
 */
async function getCachedPrompt(
  word: string,
  level: string
): Promise<Omit<ElaborativePrompt, 'wordId' | 'wordSpanish' | 'wordEnglish'> | null> {
  const cached = await prisma.elaborativePromptCache.findUnique({
    where: {
      word_level: {
        word,
        level,
      },
    },
  });

  if (!cached) return null;

  return {
    type: cached.promptType as ElaborativePromptType,
    question: cached.question,
    hints: cached.hints ? (cached.hints as string[]) : [],
    idealAnswer: cached.idealAnswer || undefined,
  };
}

/**
 * Cache prompt in database
 * 
 * @param word - Spanish word
 * @param level - CEFR level
 * @param prompt - Elaborative prompt
 */
async function cachePrompt(
  word: string,
  level: string,
  prompt: Omit<ElaborativePrompt, 'wordId' | 'wordSpanish' | 'wordEnglish'>
): Promise<void> {
  await prisma.elaborativePromptCache.upsert({
    where: {
      word_level: { word, level },
    },
    update: {
      promptType: prompt.type,
      question: prompt.question,
      hints: prompt.hints || [],
      idealAnswer: prompt.idealAnswer,
      useCount: { increment: 1 },
    },
    create: {
      word,
      level,
      promptType: prompt.type,
      question: prompt.question,
      hints: prompt.hints || [],
      idealAnswer: prompt.idealAnswer,
      useCount: 1,
    },
  });
}

// ============================================================================
// RESPONSE TRACKING
// ============================================================================

/**
 * Record user's elaborative response
 * 
 * Tracks whether user engaged with the prompt and their response.
 * 
 * @param params - Response parameters
 */
export async function recordElaborativeResponse(params: {
  userId: string;
  wordId: string;
  prompt: ElaborativePrompt;
  userResponse: string | null;
  skipped: boolean;
  responseTime: number;
}): Promise<void> {
  await prisma.elaborativeResponse.create({
    data: {
      userId: params.userId,
      wordId: params.wordId,
      promptType: params.prompt.type,
      question: params.prompt.question,
      userResponse: params.userResponse,
      skipped: params.skipped,
      responseTime: params.responseTime,
    },
  });
}

/**
 * Get elaborative response statistics for user
 * 
 * @param userId - User ID
 * @returns Statistics
 */
export async function getElaborativeStats(userId: string) {
  const [total, engaged, skipped] = await Promise.all([
    prisma.elaborativeResponse.count({ where: { userId } }),
    prisma.elaborativeResponse.count({
      where: { userId, skipped: false, userResponse: { not: null } },
    }),
    prisma.elaborativeResponse.count({ where: { userId, skipped: true } }),
  ]);

  const avgResponseTime = await prisma.elaborativeResponse.aggregate({
    where: { userId, skipped: false },
    _avg: { responseTime: true },
  });

  return {
    totalPrompts: total,
    engagementCount: engaged,
    skipCount: skipped,
    engagementRate: total > 0 ? engaged / total : 0,
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
  };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Check if deep learning mode is enabled for user
 * 
 * @param userId - User ID
 * @returns True if enabled
 */
export async function isDeepLearningEnabled(userId: string): Promise<boolean> {
  const cohort = await prisma.userCohort.findUnique({
    where: { userId },
    select: { featureFlags: true },
  });

  const flags = cohort?.featureFlags as any;
  return flags?.deepLearningMode === true;
}

/**
 * Get deep learning frequency for user
 * 
 * How often to show prompts (every N cards)
 * 
 * @param userId - User ID
 * @returns Frequency (default: 12 cards)
 */
export async function getDeepLearningFrequency(userId: string): Promise<number> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // Default to every 12 cards if not set
  return 12; // TODO: Add field to UserSettings model
}
