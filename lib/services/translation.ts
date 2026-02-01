/**
 * Translation Service
 * 
 * Provides automated Spanish-English translation with multiple providers:
 * - DeepL API (premium quality, requires API key)
 * - MyMemory API (free, good quality)
 * 
 * @module lib/services/translation
 */

export interface TranslationResult {
  translatedText: string;
  confidence?: number;
  source: 'deepl' | 'mymemory' | 'dictionary' | 'fallback' | 'cache';
  detectedLanguage?: string;
}

export interface EnhancedTranslationResult {
  primary: string; // Main translation (lowercase)
  alternatives: string[]; // Alternative translations (all lowercase)
  source: string;
  confidence?: number;
}

export interface TranslationError {
  error: string;
  message: string;
  fallbackAvailable: boolean;
}

/**
 * Translates Spanish text to English using LibreTranslate API
 * 
 * Uses public LibreTranslate instance by default. Can be configured
 * to use a self-hosted instance via environment variables.
 * 
 * @param text - Spanish text to translate
 * @returns Translation result with confidence score
 * @throws TranslationError if translation fails
 */
/**
 * Translates using DeepL API (premium quality)
 * Now returns precise, lowercase translations
 */
async function translateWithDeepL(text: string): Promise<TranslationResult> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
  
  if (!apiKey) {
    throw new Error('DeepL API key not configured');
  }

  // DeepL Free API uses api-free.deepl.com, Pro uses api.deepl.com
  const apiUrl = apiKey.endsWith(':fx') 
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: 'ES',
      target_lang: 'EN-US',
      formality: 'default',
      context: 'Translate this single Spanish word to its most common English equivalent(s).',
    }),
    signal: AbortSignal.timeout(4000), // 4s timeout for speed
  });

  if (!response.ok) {
    throw new Error(`DeepL API returned ${response.status}`);
  }

  const data = await response.json();
  const rawTranslation = data.translations[0].text;
  
  // Clean and format the translation
  const cleanedTranslation = cleanTranslation(rawTranslation, text);
  const lowercaseTranslation = cleanedTranslation.toLowerCase();

  return {
    translatedText: lowercaseTranslation,
    source: 'deepl',
    detectedLanguage: data.translations[0].detected_source_language,
  };
}

/**
 * Cleans translation text to extract only English
 * Removes Spanish word if it appears in format "spanish (english)" or "spanish/english"
 * Returns result in lowercase
 */
function cleanTranslation(text: string, originalSpanishWord: string): string {
  if (!text) return text;
  
  const cleaned = text.trim().toLowerCase();
  const spanishLower = originalSpanishWord.toLowerCase();
  
  // Remove the Spanish word if it appears at the start
  // Pattern: "spanish (english)" -> "english"
  const parenPattern = new RegExp(`^${spanishLower}\\s*\\(([^)]+)\\)`, 'i');
  const parenMatch = cleaned.match(parenPattern);
  if (parenMatch) {
    return parenMatch[1].trim().toLowerCase();
  }
  
  // Pattern: "spanish / english" or "spanish/english" -> "english"
  const slashPattern = new RegExp(`^${spanishLower}\\s*/\\s*(.+)`, 'i');
  const slashMatch = cleaned.match(slashPattern);
  if (slashMatch) {
    return slashMatch[1].trim().toLowerCase();
  }
  
  // Pattern: "spanish - english" -> "english"
  const dashPattern = new RegExp(`^${spanishLower}\\s*-\\s*(.+)`, 'i');
  const dashMatch = cleaned.match(dashPattern);
  if (dashMatch) {
    return dashMatch[1].trim().toLowerCase();
  }
  
  // If translation starts with the Spanish word followed by anything in parentheses
  // Extract only the content in parentheses
  const genericParenPattern = /^[^(]+\(([^)]+)\)/;
  const genericMatch = cleaned.match(genericParenPattern);
  if (genericMatch) {
    return genericMatch[1].trim().toLowerCase();
  }
  
  return cleaned.toLowerCase();
}

/**
 * Translates using MyMemory API (free, good quality)
 * Now returns precise, lowercase translations
 */
async function translateWithMyMemory(text: string): Promise<TranslationResult> {
  const apiUrl = 'https://api.mymemory.translated.net/get';
  
  const response = await fetch(
    `${apiUrl}?q=${encodeURIComponent(text)}&langpair=es|en`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`MyMemory API returned ${response.status}`);
  }

  const data = await response.json();
  
  // Clean and format the translation
  const rawTranslation = data.responseData.translatedText;
  const cleanedTranslation = cleanTranslation(rawTranslation, text);
  const lowercaseTranslation = cleanedTranslation.toLowerCase();

  return {
    translatedText: lowercaseTranslation,
    confidence: data.responseData.match,
    source: 'mymemory',
    detectedLanguage: data.responseData.detectedLanguage,
  };
}

export async function translateToEnglish(
  text: string
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    throw {
      error: 'INVALID_INPUT',
      message: 'Text cannot be empty',
      fallbackAvailable: false,
    } as TranslationError;
  }

  // Try DeepL first if API key is available
  if (process.env.NEXT_PUBLIC_DEEPL_API_KEY) {
    try {
      const result = await translateWithDeepL(text);
      // Ensure lowercase
      return {
        ...result,
        translatedText: result.translatedText.toLowerCase(),
      };
    } catch (error) {
      console.warn('DeepL translation failed, falling back to MyMemory:', error);
      // Fall through to MyMemory
    }
  }

  // Use MyMemory as fallback (or primary if no DeepL key)
  try {
    const result = await translateWithMyMemory(text);
    // Ensure lowercase
    return {
      ...result,
      translatedText: result.translatedText.toLowerCase(),
    };
  } catch (error) {
    console.error('Translation error:', error);
    
    throw {
      error: 'TRANSLATION_FAILED',
      message: 'Unable to translate text. Please enter translation manually.',
      fallbackAvailable: true,
    } as TranslationError;
  }
}

/**
 * Get enhanced translation with multiple options
 * Returns primary translation plus alternatives for richer understanding
 * All translations are returned in lowercase
 * 
 * @param text - Spanish word to translate
 * @returns Enhanced translation result with alternatives
 */
export async function getEnhancedTranslation(
  text: string
): Promise<EnhancedTranslationResult> {
  if (!text || text.trim().length === 0) {
    throw {
      error: 'INVALID_INPUT',
      message: 'Text cannot be empty',
      fallbackAvailable: false,
    } as TranslationError;
  }

  // Get multiple translations
  const translations = await getMultipleTranslations(text);

  if (translations.length === 0) {
    // Fallback to single translation
    const singleTranslation = await translateToEnglish(text);
    return {
      primary: singleTranslation.translatedText.toLowerCase(),
      alternatives: [],
      source: singleTranslation.source,
      confidence: singleTranslation.confidence,
    };
  }

  // First translation is primary, rest are alternatives
  // Ensure all are lowercase
  const [primary, ...rest] = translations;

  return {
    primary: primary.translatedText.toLowerCase(),
    alternatives: rest.map(t => t.translatedText.toLowerCase()),
    source: primary.source,
    confidence: primary.confidence,
  };
}

/**
 * Translates English text to Spanish (reverse translation)
 * 
 * @param text - English text to translate
 * @returns Translation result
 */
export async function translateToSpanish(
  text: string
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    throw {
      error: 'INVALID_INPUT',
      message: 'Text cannot be empty',
      fallbackAvailable: false,
    } as TranslationError;
  }

  // Try DeepL first if API key is available
  if (process.env.NEXT_PUBLIC_DEEPL_API_KEY) {
    try {
      const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
      const apiUrl = apiKey.endsWith(':fx') 
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: 'EN',
          target_lang: 'ES',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          translatedText: data.translations[0].text,
          source: 'deepl',
        };
      }
    } catch (error) {
      console.warn('DeepL translation failed, falling back to MyMemory:', error);
    }
  }

  // Use MyMemory as fallback
  try {
    const apiUrl = 'https://api.mymemory.translated.net/get';
    
    const response = await fetch(
      `${apiUrl}?q=${encodeURIComponent(text)}&langpair=en|es`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`MyMemory API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      translatedText: data.responseData.translatedText,
      confidence: data.responseData.match,
      source: 'mymemory',
    };
  } catch (error) {
    console.error('Translation error:', error);
    
    throw {
      error: 'TRANSLATION_FAILED',
      message: 'Unable to translate text. Please enter translation manually.',
      fallbackAvailable: true,
    } as TranslationError;
  }
}

/**
 * Common Spanish words with their alternative English translations
 * Manually curated for quality and accuracy
 */
const COMMON_ALTERNATIVES: Record<string, string[]> = {
  // Abstract concepts
  'meta': ['goal', 'finish', 'milestone', 'target', 'aim'],
  'esperanza': ['hope', 'expectation', 'prospect', 'aspiration'],
  'libertad': ['freedom', 'liberty', 'independence', 'autonomy'],
  'amor': ['love', 'affection', 'fondness', 'devotion'],
  'paz': ['peace', 'calm', 'tranquility', 'serenity'],
  
  // Context-dependent words
  'banco': ['bank', 'bench', 'pew', 'shoal'],
  'luz': ['light', 'daylight', 'lamp', 'brightness'],
  'suelto': ['loose', 'separate', 'free', 'unattached'],
  'cara': ['face', 'side', 'surface', 'appearance'],
  'letra': ['letter', 'handwriting', 'lyrics', 'typeface'],
  
  // Common adjectives
  'bonito': ['beautiful', 'pretty', 'lovely', 'nice'],
  'grande': ['big', 'large', 'great', 'grand'],
  'pequeño': ['small', 'little', 'tiny', 'minor'],
  'bueno': ['good', 'kind', 'nice', 'fine'],
  'malo': ['bad', 'evil', 'poor', 'wicked'],
  
  // Common verbs
  'hacer': ['do', 'make', 'perform', 'create'],
  'tener': ['have', 'possess', 'hold', 'own'],
  'ir': ['go', 'leave', 'travel', 'head'],
  'ver': ['see', 'watch', 'view', 'look'],
  'dar': ['give', 'provide', 'grant', 'offer'],
  
  // Time and quantity
  'tiempo': ['time', 'weather', 'period', 'season'],
  'vez': ['time', 'occasion', 'turn', 'instance'],
  'poco': ['little', 'few', 'bit', 'scarce'],
  'mucho': ['much', 'lot', 'many', 'plenty'],
};

/**
 * Get multiple translation options from local dictionary
 * Provides reliable alternative translations for common words
 * 
 * @param text - Spanish word to translate
 * @returns Array of alternative translation options
 */
function getLocalAlternatives(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  return COMMON_ALTERNATIVES[normalized] || [];
}

/**
 * Get MyMemory translation with alternatives in a SINGLE call
 * Returns both primary translation and alternative options
 * Optimized to avoid duplicate API calls
 * 
 * @param text - Spanish word to translate
 * @returns Object with primary translation and alternatives
 */
async function getMyMemoryWithAlternatives(text: string): Promise<{
  primary: TranslationResult;
  alternatives: string[];
}> {
  const apiUrl = 'https://api.mymemory.translated.net/get';
  const response = await fetch(
    `${apiUrl}?q=${encodeURIComponent(text)}&langpair=es|en`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3000), // 3s timeout for speed
    }
  );

  if (!response.ok) {
    throw new Error(`MyMemory API returned ${response.status}`);
  }

  const data = await response.json();
  const alternatives = new Set<string>();
  const filterWords = new Set(['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from']);

  // Get primary translation - prioritize matches over responseData for better quality
  let primaryTranslation = '';
  let confidence = data.responseData.match;
  
  // First, check if matches have a high-quality single word or short phrase
  if (data.matches && data.matches.length > 0) {
    // Find the best match: short (1-2 words), high quality, no weird chars
    for (const match of data.matches.slice(0, 5)) {
      const translation = match.translation;
      const cleaned = cleanTranslation(translation, text).toLowerCase().trim();
      const wordCount = cleaned.split(/\s+/).length;
      const hasOnlyLetters = /^[a-z\s]+$/.test(cleaned);
      
      // Prefer single words or short 2-word phrases with only letters
      if (cleaned && wordCount <= 2 && hasOnlyLetters && cleaned.length > 1) {
        primaryTranslation = cleaned;
        confidence = match.match || confidence;
        break;
      }
    }
  }
  
  // Fallback to responseData if no good match found
  if (!primaryTranslation) {
    const rawTranslation = data.responseData.translatedText;
    const cleanedTranslation = cleanTranslation(rawTranslation, text);
    primaryTranslation = cleanedTranslation.toLowerCase().trim();
    
    // If still looks bad (multiple words, weird chars), extract first clean word
    if (primaryTranslation.split(/\s+/).length > 2 || !/^[a-z\s]+$/.test(primaryTranslation)) {
      const words = primaryTranslation.split(/\s+/);
      const firstCleanWord = words.find(w => /^[a-z]+$/.test(w) && w.length > 2);
      if (firstCleanWord) {
        primaryTranslation = firstCleanWord;
      }
    }
  }

  const primary: TranslationResult = {
    translatedText: primaryTranslation || 'unknown',
    confidence: confidence,
    source: 'mymemory',
    detectedLanguage: data.responseData.detectedLanguage,
  };

  // Extract alternatives from matches with strict quality control
  if (data.matches && Array.isArray(data.matches)) {
    // Take only top 8 matches for better coverage
    data.matches.slice(0, 8).forEach((match: any) => {
      if (match.translation) {
        const translation = match.translation.toLowerCase().trim();
        
        // Remove ALL punctuation first
        const cleanedTranslation = translation.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Split into words
        const words = cleanedTranslation.split(' ').filter((w: string) => w.length > 0);
        
        // Add full translation if it's 1-2 clean words
        if (words.length === 1 || words.length === 2) {
          const fullPhrase = words.join(' ');
          if (fullPhrase.length > 2 && !filterWords.has(fullPhrase)) {
            alternatives.add(fullPhrase);
          }
        }
        
        // Extract individual meaningful words from longer translations
        if (words.length >= 2 && words.length <= 4) {
          words.forEach(word => {
            // Only add if: longer than 2 chars, not a filter word, only letters
            if (word.length > 2 && !filterWords.has(word) && /^[a-z]+$/.test(word)) {
              alternatives.add(word);
            }
          });
        }
      }
    });
  }

  // Filter out: original Spanish word, primary translation, and any remaining junk
  const filtered = Array.from(alternatives)
    .filter(t => {
      // Exclude the original word
      if (t === text.toLowerCase()) return false;
      // Exclude the primary
      if (t === primaryTranslation) return false;
      // Only allow clean words/phrases (letters and spaces only)
      if (!/^[a-z\s]+$/.test(t)) return false;
      // Must be at least 3 characters
      if (t.length < 3) return false;
      return true;
    })
    .slice(0, 6); // Limit to 6 high-quality alternatives

  return { primary, alternatives: filtered };
}

// Dictionary API removed - was slow and unreliable
// Now using: DeepL (best quality) + MyMemory (fast) + Local dictionary (curated common words)

/**
 * Get multiple translation perspectives for a word
 * Now enhanced to provide more diverse and precise translations
 * 
 * @param text - Spanish word to translate
 * @returns Array of unique translation results
 */
export async function getMultipleTranslations(
  text: string
): Promise<TranslationResult[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const translations: TranslationResult[] = [];
  const seenTranslations = new Set<string>();

  // Get local alternatives (instant, no API call)
  const localAlts = getLocalAlternatives(text);

  // Get translations from ONLY fast sources in parallel (reduced from 4 to 2 API calls)
  const [deeplResult, myMemoryResult] = await Promise.allSettled([
    process.env.NEXT_PUBLIC_DEEPL_API_KEY ? translateWithDeepL(text) : Promise.reject('No API key'),
    getMyMemoryWithAlternatives(text), // Single call returns both primary + alternatives
  ]);

  // Helper to add unique translation
  const addUniqueTranslation = (translation: string, source: 'deepl' | 'mymemory' | 'dictionary', confidence?: number) => {
    const normalized = translation.toLowerCase().trim();
    if (normalized && !seenTranslations.has(normalized) && normalized !== text.toLowerCase()) {
      seenTranslations.add(normalized);
      translations.push({
        translatedText: normalized,
        source,
        confidence,
      });
    }
  };

  // Add DeepL translation (highest quality, first priority)
  if (deeplResult.status === 'fulfilled') {
    const result = deeplResult.value;
    addUniqueTranslation(result.translatedText, 'deepl', result.confidence);
  }

  // Add MyMemory primary translation + alternatives (from single call)
  if (myMemoryResult.status === 'fulfilled') {
    const { primary, alternatives } = myMemoryResult.value;
    addUniqueTranslation(primary.translatedText, 'mymemory', primary.confidence);
    
    // Add alternatives from MyMemory
    alternatives.forEach(alt => {
      addUniqueTranslation(alt, 'mymemory', 0.8);
    });
  }

  // Add local curated alternatives (highest quality for common words)
  localAlts.forEach(word => {
    addUniqueTranslation(word, 'dictionary', 0.9);
  });

  // Debug logging
  console.log('[Translation] Translations for', text, ':', {
    count: translations.length,
    primary: translations[0]?.translatedText,
    alternatives: translations.slice(1).map(t => t.translatedText),
  });

  // Return up to 8 translations (1 primary + up to 7 alternatives)
  return translations.slice(0, 8);
}

/**
 * Batch translate multiple words at once
 * 
 * @param words - Array of Spanish words to translate
 * @returns Array of translation results
 */
export async function batchTranslate(
  words: string[]
): Promise<TranslationResult[]> {
  // Translate words in parallel with rate limiting
  const results = await Promise.allSettled(
    words.map(word => translateToEnglish(word))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        translatedText: '',
        source: 'fallback' as const,
        confidence: 0,
      };
    }
  });
}

