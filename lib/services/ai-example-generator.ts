/**
 * AI Example Generator Service (Phase 18.1.3)
 * 
 * Generates contextually appropriate Spanish example sentences using OpenAI.
 * Examples adapt to user's proficiency level (A1-C2 CEFR).
 * 
 * Features:
 * - Level-appropriate vocabulary and grammar
 * - Cached examples shared across users
 * - Cost control and budget management
 * - Fallback to templates when budget exceeded
 * - Cultural context appropriate for learners
 * 
 * @see lib/services/ai-cost-control.ts
 * @see lib/types/proficiency.ts
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/backend/db';
import { type CEFRLevel, getLevelDescription } from '@/lib/types/proficiency';
import {
  canMakeAICall,
  recordAICost,
  estimateTokens,
} from './ai-cost-control';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL = 'gpt-3.5-turbo';
const MAX_TOKENS = 80; // Optimized for single concise example (60-80 chars)
const TEMPERATURE = 0.3; // Lower for fastest, most consistent responses

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    // Read API key at runtime, not at module load time
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local'
      );
    }
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openaiClient;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExampleSentence {
  spanish: string;
  english: string;
  level: CEFRLevel;
  context?: string; // Optional context (e.g., "formal", "casual", "business")
}

export interface GenerateExamplesOptions {
  word: string;
  translation: string;
  partOfSpeech?: string;
  level: CEFRLevel;
  count?: number; // Number of examples to generate (default: 3)
  useCache?: boolean; // Whether to check cache first (default: true)
}

export interface GenerateExamplesResult {
  examples: ExampleSentence[];
  fromCache: boolean;
  cost?: number; // Cost in USD (if generated)
  tokensUsed?: number; // Tokens used (if generated)
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate contextually appropriate examples for a Spanish word
 * Checks cache first, falls back to AI generation, then templates
 */
export async function generateExamples(
  options: GenerateExamplesOptions
): Promise<GenerateExamplesResult> {
  const {
    word,
    translation,
    partOfSpeech,
    level,
    count = 3,
    useCache = true,
  } = options;

  // 1. Check cache first
  if (useCache) {
    const cached = await getCachedExamples(word, translation, level);
    if (cached && cached.length > 0) {
      console.log(`[AI Examples] Using cached examples for "${word}" (${level})`);
      return {
        examples: cached,
        fromCache: true,
      };
    }
  }

  // 2. Check if we can make AI API call
  const canUseAI = await canMakeAICall();
  console.log(`[AI Examples] Budget check for "${word}": ${canUseAI ? 'ALLOWED ✅' : 'BLOCKED ❌'}`);
  
  if (!canUseAI) {
    console.warn(
      `[AI Examples] Budget exceeded. Using fallback templates for "${word}"`
    );
    const fallbackExamples = await generateFallbackExamples(options);
    return {
      examples: fallbackExamples,
      fromCache: false,
    };
  }

  // 3. Generate with AI
  try {
    console.log(`[AI Examples] Calling OpenAI for "${word}" (${level})...`);
    const result = await generateWithOpenAI(options);
    console.log(`[AI Examples] ✅ OpenAI returned ${result.examples.length} examples for "${word}"`);
    
    // NOTE: Do NOT cache here - caching only happens when user saves the word
    // This allows premium users to get fresh AI examples without polluting the cache
    
    console.log(`[AI Examples] Successfully generated ${result.examples.length} examples for "${word}" (not cached yet)`);
    return {
      examples: result.examples,
      fromCache: false,
      cost: result.cost,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    console.error(`[AI Examples] ❌ OpenAI generation FAILED for "${word}":`, error);
    console.error(`[AI Examples] Error details:`, error instanceof Error ? error.message : String(error));
    
    // Fallback to templates on error
    const fallbackExamples = await generateFallbackExamples(options);
    console.log(`[AI Examples] Using ${fallbackExamples.length} fallback template examples for "${word}"`);
    
    return {
      examples: fallbackExamples,
      fromCache: false,
    };
  }
}

// ============================================================================
// OPENAI GENERATION
// ============================================================================

/**
 * Generate examples using OpenAI GPT-3.5-turbo
 */
async function generateWithOpenAI(
  options: GenerateExamplesOptions
): Promise<{ examples: ExampleSentence[]; cost: number; tokensUsed: number }> {
  const { word, translation, partOfSpeech, level, count = 3 } = options;

  const levelDesc = getLevelDescription(level);
  const pos = partOfSpeech || 'word';

  // Craft the prompt (optimized for single, fast example)
  const prompt = `Generate ${count} concise Spanish example sentence for "${word}" (${translation}).

Level: ${level} (${levelDesc})
Type: ${pos}

Requirements:
- Maximum 60-80 characters (8-12 words)
- Practical, everyday usage
- ${level}-appropriate vocabulary
- Natural and grammatically correct

Format:
Spanish: [sentence]
English: [translation]

Example:`;

  const openai = getOpenAIClient();
  
  if (!openai) {
    console.warn('[AI Examples] OpenAI client not available, using fallback templates');
    const examples = await generateFallbackExamples(options);
    return {
      examples,
      cost: 0,
      tokensUsed: 0,
    };
  }

  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Create ONE concise Spanish example sentence (60-80 chars max). Be natural, practical, and level-appropriate. Respond immediately with Spanish/English format only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
  });

  const duration = Date.now() - startTime;

  // Parse the response
  const content = response.choices[0].message.content || '';
  const examples = parseOpenAIResponse(content, level);

  // Track cost
  const tokensUsed = response.usage?.total_tokens || estimateTokens(prompt + content);
  const cost = (tokensUsed / 1000) * 0.002; // GPT-3.5-turbo pricing

  await recordAICost({
    service: 'openai',
    model: MODEL,
    endpoint: 'chat/completions',
    tokensUsed,
    success: examples.length > 0,
    metadata: {
      word,
      level,
      duration,
      examplesGenerated: examples.length,
    },
  });

  console.log(
    `[AI Examples] Generated ${examples.length} examples for "${word}" (${level}) ` +
    `in ${duration}ms. Cost: $${cost.toFixed(4)}, Tokens: ${tokensUsed}`
  );

  if (examples.length === 0) {
    throw new Error('Failed to parse examples from OpenAI response');
  }

  return { examples, cost, tokensUsed };
}

/**
 * Parse OpenAI response into structured examples
 */
function parseOpenAIResponse(content: string, level: CEFRLevel): ExampleSentence[] {
  const examples: ExampleSentence[] = [];
  
  // Split by double newline or numbered lists
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentSpanish: string | null = null;
  let currentEnglish: string | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match "Spanish: [sentence]" or just a Spanish sentence
    if (trimmed.startsWith('Spanish:') || trimmed.startsWith('Español:')) {
      currentSpanish = trimmed.replace(/^(Spanish|Español):\s*/, '').trim();
    }
    // Match "English: [translation]" or "Inglés:"
    else if (trimmed.startsWith('English:') || trimmed.startsWith('Inglés:')) {
      currentEnglish = trimmed.replace(/^(English|Inglés):\s*/, '').trim();
      
      // If we have both, add to examples
      if (currentSpanish && currentEnglish) {
        examples.push({
          spanish: currentSpanish,
          english: currentEnglish,
          level,
        });
        currentSpanish = null;
        currentEnglish = null;
      }
    }
    // Try to detect alternating Spanish/English patterns
    else if (trimmed.length > 10 && !currentSpanish) {
      // Likely Spanish (first line)
      currentSpanish = trimmed.replace(/^\d+\.\s*/, ''); // Remove numbering
    }
    else if (trimmed.length > 10 && currentSpanish && !currentEnglish) {
      // Likely English translation (second line)
      currentEnglish = trimmed.replace(/^\d+\.\s*/, '');
      
      if (currentSpanish && currentEnglish) {
        examples.push({
          spanish: currentSpanish,
          english: currentEnglish,
          level,
        });
        currentSpanish = null;
        currentEnglish = null;
      }
    }
  }
  
  return examples;
}

// ============================================================================
// CACHING
// ============================================================================


/**
 * Cache generated examples in database
 * Now accepts optional translation and POS to populate complete entry
 */
async function cacheExamples(
  word: string,
  level: CEFRLevel,
  examples: ExampleSentence[],
  translation?: string,
  partOfSpeech?: string
): Promise<void> {
  // Find or create VerifiedVocabulary entry
  const existing = await prisma.verifiedVocabulary.findFirst({
    where: {
      sourceWord: word,
      sourceLanguage: 'es',
      targetLanguage: 'en',
    },
    select: {
      id: true,
      aiExamplesByLevel: true,
      targetWord: true,
      partOfSpeech: true,
    },
  });

  if (existing) {
    // Update existing entry - merge AI examples by level
    const examplesByLevel = (existing.aiExamplesByLevel as unknown as Record<string, ExampleSentence[]>) || {};
    examplesByLevel[level] = examples;

    const updateData: any = {
      aiExamplesByLevel: examplesByLevel as any,
      aiExamplesGenerated: true,
      aiExamplesGeneratedAt: new Date(),
    };

    // Update targetWord and partOfSpeech if they're missing and we have them
    if (translation && (!existing.targetWord || existing.targetWord === '')) {
      updateData.targetWord = translation;
    }
    if (partOfSpeech && !existing.partOfSpeech) {
      updateData.partOfSpeech = partOfSpeech;
    }

    await prisma.verifiedVocabulary.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    // Create new entry with complete data
    await prisma.verifiedVocabulary.create({
      data: {
        sourceWord: word,
        sourceLanguage: 'es',
        targetLanguage: 'en',
        languagePair: 'es-en',
        targetWord: translation || word, // Use translation if provided
        partOfSpeech: partOfSpeech || null,
        primarySource: 'ai-generated',
        aiExamplesByLevel: { [level]: examples } as any,
        aiExamplesGenerated: true,
        aiExamplesGeneratedAt: new Date(),
      },
    });
  }

  console.log(`[AI Examples] Cached ${examples.length} examples for "${word}" (${level})`);
}

// ============================================================================
// FALLBACK TEMPLATES
// ============================================================================

/**
 * Generate fallback examples using templates
 * Used when AI budget is exceeded or API fails
 */
async function generateFallbackExamples(
  options: GenerateExamplesOptions
): Promise<ExampleSentence[]> {
  const { word, translation, level } = options;

  // Simple template-based examples
  const templates = [
    {
      spanish: `El ${word} es importante.`,
      english: `The ${translation} is important.`,
    },
    {
      spanish: `Necesito un ${word}.`,
      english: `I need a ${translation}.`,
    },
    {
      spanish: `¿Dónde está el ${word}?`,
      english: `Where is the ${translation}?`,
    },
  ];

  return templates.map(t => ({ ...t, level }));
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Batch generate examples for multiple words
 * Useful for pre-generation tasks
 */
export async function batchGenerateExamples(
  words: Array<{ word: string; translation: string; partOfSpeech?: string }>,
  levels: CEFRLevel[] = ['A1', 'B1', 'C1']
): Promise<{
  total: number;
  generated: number;
  cached: number;
  failed: number;
  totalCost: number;
}> {
  let generated = 0;
  let cached = 0;
  let failed = 0;
  let totalCost = 0;

  for (const wordData of words) {
    for (const level of levels) {
      try {
        const result = await generateExamples({
          ...wordData,
          level,
        });

        if (result.fromCache) {
          cached++;
        } else {
          generated++;
          totalCost += result.cost || 0;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate examples for ${wordData.word} (${level}):`, error);
        failed++;
      }
    }
  }

  const stats = {
    total: words.length * levels.length,
    generated,
    cached,
    failed,
    totalCost,
  };

  console.log('[AI Examples] Batch generation complete:', stats);
  return stats;
}

// ============================================================================
// PREMIUM TIER ROUTING (Phase 18.3.6)
// ============================================================================

import { hasActivePremium } from './stripe';

/**
 * Get examples with premium tier routing
 * Premium users: AI-generated examples (personalized)
 * Free users: Cached examples only (shared)
 * 
 * This function provides transparent tier-based switching - both tiers
 * get 3 examples, but premium users get fresh AI-generated content.
 * 
 * @param userId - User ID (null for guests)
 * @param word - Spanish word
 * @param translation - English translation
 * @param level - CEFR proficiency level
 * @param partOfSpeech - Optional part of speech
 * @returns Array of example sentences (always 3)
 */
export async function getExamplesForUser(
  userId: string | null,
  word: string,
  translation: string,
  level: CEFRLevel,
  partOfSpeech?: string
): Promise<ExampleSentence[]> {
  // Guest users: always use cache
  if (!userId) {
    return await getCachedExamples(word, translation, level);
  }

  // Check if premium using DATABASE ONLY (bypass Stripe completely)
  // This is more reliable than Stripe API which can be slow or have sync issues
  let isPremium = false;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionStatus: true },
    });
    
    isPremium = (
      user &&
      (user.subscriptionTier === 'premium' || user.subscriptionTier === 'lifetime') &&
      (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'lifetime')
    );
    
    console.log(`[AI Examples] Database premium check: User is ${isPremium ? 'PREMIUM ✅' : 'FREE ❌'}`);
  } catch (error) {
    console.error('[AI Examples] Database premium check failed:', error);
    // On error, default to cache (safe fallback)
    return await getCachedExamples(word, translation, level);
  }

  if (isPremium) {
    // Premium: Try AI generation, fallback to cache on error
    try {
      const result = await generateExamples({
        word,
        translation,
        partOfSpeech,
        level,
        count: 3,
        useCache: true, // Still check cache first (optimization)
      });
      
      return result.examples;
    } catch (error) {
      console.error('[AI Examples] Generation failed, using cache:', error);
      return await getCachedExamples(word, translation, level);
    }
  } else {
    // Free: Cache only
    return await getCachedExamples(word, translation, level);
  }
}

/**
 * Get cached examples for a word
 * Falls back to template examples if no cache exists
 * 
 * @param word - Spanish word
 * @param translation - English translation (optional, for template fallback)
 * @param level - CEFR proficiency level
 * @returns Array of cached example sentences
 */
async function getCachedExamples(
  word: string,
  translation: string | undefined,
  level: CEFRLevel
): Promise<ExampleSentence[]> {
  // Try to find cached examples in VerifiedVocabulary
  try {
    const cached = await prisma.verifiedVocabulary.findFirst({
      where: { 
        sourceWord: word,
      },
      select: {
        examples: true,
        targetWord: true, // Get translation from cache if not provided
        aiExamplesByLevel: true, // NEW: Get AI examples by level
      },
    });

    if (cached) {
      // PRIORITY 1: Check aiExamplesByLevel for the requested level
      if (cached.aiExamplesByLevel) {
        const examplesByLevel = cached.aiExamplesByLevel as Record<string, ExampleSentence[]>;
        
        // Try exact level match first
        if (examplesByLevel[level] && examplesByLevel[level].length > 0) {
          console.log(`[AI Examples] Found cached ${level} examples for "${word}"`);
          return examplesByLevel[level].slice(0, 3);
        }
        
        // Fallback to nearby level if exact match doesn't exist
        const fallbackLevel = getNearestAvailableLevel(level, examplesByLevel);
        if (fallbackLevel && examplesByLevel[fallbackLevel].length > 0) {
          console.log(`[AI Examples] Using ${fallbackLevel} examples for "${word}" (requested ${level})`);
          return examplesByLevel[fallbackLevel].slice(0, 3);
        }
      }
      
      // PRIORITY 2: Check legacy examples field
      if (cached.examples && Array.isArray(cached.examples)) {
        // Parse and return cached examples
        const examples = (cached.examples as any[]).map((ex: any) => ({
          spanish: ex.spanish || ex,
          english: ex.english || '',
          level: level,
        }));
        
        if (examples.length > 0) {
          console.log(`[AI Examples] Found legacy cached examples for "${word}"`);
          return examples.slice(0, 3);
        }
      }
      
      // Use cached translation if available
      if (!translation && cached.targetWord) {
        translation = cached.targetWord;
      }
    }
  } catch (error) {
    console.error('[AI Examples] Error fetching cached examples:', error);
    // Return empty array - caller will handle fallback
  }

  // No cache found - return empty array so caller can try AI generation
  console.log(`[AI Examples] No cache found for "${word}" - returning empty`);
  return [];
}

/**
 * Find the nearest available level when exact match doesn't exist
 * Fallback order: B2 → B1 → A2, A2 → A1 → B1, C2 → C1 → B2
 */
function getNearestAvailableLevel(
  requestedLevel: CEFRLevel,
  availableLevels: Record<string, ExampleSentence[]>
): CEFRLevel | null {
  const levelHierarchy: Record<CEFRLevel, CEFRLevel[]> = {
    'A1': ['A2', 'B1'],
    'A2': ['A1', 'B1', 'B2'],
    'B1': ['A2', 'B2', 'A1'],
    'B2': ['B1', 'C1', 'A2'],
    'C1': ['B2', 'C2', 'B1'],
    'C2': ['C1', 'B2'],
  };

  const fallbacks = levelHierarchy[requestedLevel] || [];
  
  for (const fallback of fallbacks) {
    if (availableLevels[fallback] && availableLevels[fallback].length > 0) {
      return fallback;
    }
  }

  // If no fallback found, try any available level
  const anyLevel = Object.keys(availableLevels).find(
    level => availableLevels[level] && availableLevels[level].length > 0
  );
  
  return anyLevel as CEFRLevel || null;
}

/**
 * Generate simple template examples as final fallback
 * Used when no cache exists and AI generation unavailable/blocked
 * 
 * @param word - Spanish word
 * @param translation - English translation
 * @param level - CEFR proficiency level
 * @returns Array of template example sentences
 */
function generateTemplateExamples(
  word: string,
  translation: string,
  level: CEFRLevel
): ExampleSentence[] {
  // Use translation or fall back to word if translation missing
  const eng = translation || word;
  
  // Simple templates for common cases
  const templates = [
    { spanish: `Yo uso "${word}" todos los días.`, english: `I use "${eng}" every day.` },
    { spanish: `${word} es importante.`, english: `${eng} is important.` },
    { spanish: `Me gusta ${word}.`, english: `I like ${eng}.` },
  ];

  return templates.map(t => ({
    spanish: t.spanish,
    english: t.english,
    level: level,
  }));
}
