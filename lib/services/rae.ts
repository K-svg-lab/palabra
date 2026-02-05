/**
 * RAE (Real Academia Española) Service
 * 
 * Integrates with RAE API for authoritative Spanish language definitions.
 * Phase 16.1 Task 3 - RAE API Integration
 * 
 * API: https://rae-api.com/
 * Rate Limits: Free tier 10 req/min, 100/day (no API key needed)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RaeDefinition {
  word: string;
  category?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'article' | 'preposition' | 'conjunction' | 'interjection';
  gender?: 'masculine' | 'feminine' | 'masculine_and_feminine' | null;
  definitions: string[];
  etymology?: string;
  synonyms?: string[];
  antonyms?: string[];
  usage?: 'common' | 'rare' | 'outdated' | 'colloquial' | 'obsolete' | 'unknown';
  conjugations?: RaeConjugations;
  source: 'rae';
  confidence: number; // Always high (0.95) for RAE
}

export interface RaeConjugations {
  infinitive?: string;
  participle?: string;
  gerund?: string;
  // Full conjugation tables available but not needed for basic integration
}

interface RaeApiResponse {
  ok: boolean;
  data?: {
    word: string;
    meanings?: Array<{
      origin?: {
        raw?: string;
        type?: string;
        voice?: string;
        text?: string;
      };
      senses?: Array<{
        raw?: string;
        meaning_number?: number;
        category?: string;
        verb_category?: string | null;
        gender?: string | null;
        article?: {
          category?: string;
          gender?: string;
        };
        usage?: string;
        description?: string;
        synonyms?: string[];
        antonyms?: string[];
      }>;
      conjugations?: {
        non_personal?: {
          infinitive?: string;
          participle?: string;
          gerund?: string;
          compound_infinitive?: string;
          compound_gerund?: string;
        };
        // Other conjugation forms available but optional
      };
    }>;
  };
  error?: string;
  suggestions?: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RAE_API_BASE_URL = 'https://rae-api.com';
const RAE_REQUEST_TIMEOUT = 4000; // 4 seconds
const RAE_API_KEY = process.env.NEXT_PUBLIC_RAE_API_KEY; // Optional developer key

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get word definition from RAE dictionary
 * 
 * @param word - Spanish word to look up
 * @returns RaeDefinition or null if not found
 */
export async function getRaeDefinition(word: string): Promise<RaeDefinition | null> {
  if (!word || word.trim().length === 0) {
    return null;
  }

  const cleanWord = word.trim().toLowerCase();

  try {
    // Build URL with optional API key
    const url = new URL(`${RAE_API_BASE_URL}/api/words/${encodeURIComponent(cleanWord)}`);
    if (RAE_API_KEY) {
      url.searchParams.set('api_key', RAE_API_KEY);
    }

    // Make request with timeout
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(RAE_REQUEST_TIMEOUT),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`[RAE] Rate limit exceeded. Retry after ${retryAfter}s`);
      return null;
    }

    // Handle not found
    if (response.status === 404) {
      console.log(`[RAE] Word not found: "${cleanWord}"`);
      return null;
    }

    if (!response.ok) {
      console.error(`[RAE] API error: ${response.status}`);
      return null;
    }

    const data: RaeApiResponse = await response.json();

    // Validate response
    if (!data.ok || !data.data || !data.data.meanings || data.data.meanings.length === 0) {
      return null;
    }

    // Parse and transform RAE data
    return transformRaeData(data.data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[RAE] Request timeout for "${cleanWord}"`);
    } else {
      console.error(`[RAE] Failed to fetch definition for "${cleanWord}":`, error.message);
    }
    return null;
  }
}

/**
 * Transform RAE API response to our RaeDefinition format
 */
function transformRaeData(data: RaeApiResponse['data']): RaeDefinition | null {
  if (!data || !data.meanings || data.meanings.length === 0) {
    return null;
  }

  const firstMeaning = data.meanings[0];
  const senses = firstMeaning.senses || [];

  // Extract primary category (POS) from first sense
  const firstSense = senses[0];
  const category = firstSense?.category as RaeDefinition['category'];

  // Extract gender (check both gender field and article.gender)
  let gender: RaeDefinition['gender'] = null;
  
  // Try direct gender field first
  if (firstSense?.gender) {
    const genderMap: Record<string, RaeDefinition['gender']> = {
      'masculine': 'masculine',
      'feminine': 'feminine',
      'masculine_and_feminine': 'masculine_and_feminine',
    };
    gender = genderMap[firstSense.gender] || null;
  }
  
  // If not found, try article.gender (often more reliable)
  if (!gender && firstSense?.article?.gender) {
    const articleGenderMap: Record<string, RaeDefinition['gender']> = {
      'masculine': 'masculine',
      'feminine': 'feminine',
      'masculine_and_feminine': 'masculine_and_feminine',
    };
    gender = articleGenderMap[firstSense.article.gender] || null;
  }
  
  // If still not found, infer from raw definition text
  // RAE uses "m." for masculine, "f." for feminine
  if (!gender && firstSense?.raw) {
    const raw = firstSense.raw.toLowerCase();
    if (raw.includes('m.') && !raw.includes('f.')) {
      gender = 'masculine';
    } else if (raw.includes('f.') && !raw.includes('m.')) {
      gender = 'feminine';
    } else if (raw.includes('m. y f.') || raw.includes('m., f.')) {
      gender = 'masculine_and_feminine';
    }
  }

  // Extract all definitions
  const definitions = senses
    .map(sense => sense.description)
    .filter((desc): desc is string => !!desc && desc.length > 0);

  if (definitions.length === 0) {
    return null;
  }

  // Extract etymology
  const etymology = firstMeaning.origin?.raw || firstMeaning.origin?.text;

  // Extract synonyms and antonyms
  const synonyms: string[] = [];
  const antonyms: string[] = [];
  senses.forEach(sense => {
    if (sense.synonyms) synonyms.push(...sense.synonyms);
    if (sense.antonyms) antonyms.push(...sense.antonyms);
  });

  // Extract usage
  const usage = firstSense?.usage as RaeDefinition['usage'] || 'common';

  // Extract conjugations (if verb)
  let conjugations: RaeConjugations | undefined;
  if (category === 'verb' && firstMeaning.conjugations?.non_personal) {
    conjugations = {
      infinitive: firstMeaning.conjugations.non_personal.infinitive,
      participle: firstMeaning.conjugations.non_personal.participle,
      gerund: firstMeaning.conjugations.non_personal.gerund,
    };
  }

  return {
    word: data.word,
    category,
    gender,
    definitions,
    etymology,
    synonyms: synonyms.length > 0 ? [...new Set(synonyms)] : undefined,
    antonyms: antonyms.length > 0 ? [...new Set(antonyms)] : undefined,
    usage,
    conjugations,
    source: 'rae',
    confidence: 0.95, // RAE is authoritative, high confidence
  };
}

/**
 * Extract primary translation from RAE definition
 * (Used for cross-validation)
 */
export function extractRaePrimaryMeaning(definition: RaeDefinition): string | null {
  if (!definition || !definition.definitions || definition.definitions.length === 0) {
    return null;
  }

  // Return first definition
  return definition.definitions[0];
}

/**
 * Check if RAE supports a word (quick check without full fetch)
 * Returns true if word exists in RAE dictionary
 */
export async function checkRaeSupport(word: string): Promise<boolean> {
  try {
    const definition = await getRaeDefinition(word);
    return definition !== null;
  } catch {
    return false;
  }
}

/**
 * Get RAE rate limit info from response headers
 */
export function parseRateLimitHeaders(headers: Headers): {
  minuteLimit: number;
  minuteRemaining: number;
  dailyLimit: number;
  dailyRemaining: number;
  tier: string;
} {
  return {
    minuteLimit: parseInt(headers.get('X-RateLimit-Minute-Limit') || '10', 10),
    minuteRemaining: parseInt(headers.get('X-RateLimit-Minute-Remaining') || '10', 10),
    dailyLimit: parseInt(headers.get('X-RateLimit-Daily-Limit') || '100', 10),
    dailyRemaining: parseInt(headers.get('X-RateLimit-Daily-Remaining') || '100', 10),
    tier: headers.get('X-RateLimit-Tier') || 'free',
  };
}

/**
 * Map RAE category to our PartOfSpeech type
 */
export function mapRaeCategoryToPartOfSpeech(
  category?: RaeDefinition['category']
): 'noun' | 'verb' | 'adjective' | 'adverb' | undefined {
  if (!category) return undefined;

  const mapping: Record<string, 'noun' | 'verb' | 'adjective' | 'adverb' | undefined> = {
    'noun': 'noun',
    'verb': 'verb',
    'adjective': 'adjective',
    'adverb': 'adverb',
    'pronoun': undefined,
    'article': undefined,
    'preposition': undefined,
    'conjunction': undefined,
    'interjection': undefined,
  };

  return mapping[category];
}
