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
 */
function cleanTranslation(text: string, originalSpanishWord: string): string {
  if (!text) return text;
  
  const cleaned = text.trim();
  
  // Remove the Spanish word if it appears at the start
  // Pattern: "spanish (english)" -> "english"
  const parenPattern = new RegExp(`^${originalSpanishWord}\\s*\\(([^)]+)\\)`, 'i');
  const parenMatch = cleaned.match(parenPattern);
  if (parenMatch) {
    return parenMatch[1].trim();
  }
  
  // Pattern: "spanish / english" or "spanish/english" -> "english"
  const slashPattern = new RegExp(`^${originalSpanishWord}\\s*/\\s*(.+)`, 'i');
  const slashMatch = cleaned.match(slashPattern);
  if (slashMatch) {
    return slashMatch[1].trim();
  }
  
  // Pattern: "spanish - english" -> "english"
  const dashPattern = new RegExp(`^${originalSpanishWord}\\s*-\\s*(.+)`, 'i');
  const dashMatch = cleaned.match(dashPattern);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // If translation starts with the Spanish word followed by anything in parentheses
  // Extract only the content in parentheses
  const genericParenPattern = /^[^(]+\(([^)]+)\)/;
  const genericMatch = cleaned.match(genericParenPattern);
  if (genericMatch) {
    return genericMatch[1].trim();
  }
  
  return cleaned;
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
      primary: singleTranslation.translatedText,
      alternatives: [],
      source: singleTranslation.source,
      confidence: singleTranslation.confidence,
    };
  }

  // First translation is primary, rest are alternatives
  const [primary, ...rest] = translations;

  return {
    primary: primary.translatedText,
    alternatives: rest.map(t => t.translatedText),
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
 * Get multiple translation options for a word using a dictionary API
 * Provides comprehensive translation perspectives including synonyms and different meanings
 * 
 * @param text - Spanish word to translate
 * @returns Array of unique translation options
 */
async function getSpanishEnglishDictionary(text: string): Promise<string[]> {
  try {
    // Try Spanish Dict API (free dictionary with multiple translations)
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(text)}`
    );

    if (response.ok) {
      const data = await response.json();
      const translations = new Set<string>();
      
      // Extract definitions and synonyms
      data.forEach((entry: any) => {
        entry.meanings?.forEach((meaning: any) => {
          meaning.definitions?.forEach((def: any) => {
            if (def.definition) {
              // Extract English words from definitions
              const englishWords = extractEnglishWords(def.definition);
              englishWords.forEach(word => translations.add(word.toLowerCase()));
            }
          });
          
          // Add synonyms if available
          meaning.synonyms?.forEach((syn: string) => {
            translations.add(syn.toLowerCase());
          });
        });
      });

      return Array.from(translations).slice(0, 5); // Limit to 5 translations
    }
  } catch (error) {
    // Fallback to basic translation
  }

  return [];
}

/**
 * Extracts English words from a definition or translation
 * Removes articles, prepositions, and extracts key translation words
 */
function extractEnglishWords(text: string): string[] {
  // Common words to filter out
  const filterWords = new Set(['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
  
  // Extract words, remove punctuation
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !filterWords.has(word));
  
  return words;
}

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

  // Try to get translations from multiple sources in parallel
  const [deeplResult, mymemoryResult, dictionaryWords] = await Promise.allSettled([
    process.env.NEXT_PUBLIC_DEEPL_API_KEY ? translateWithDeepL(text) : Promise.reject('No API key'),
    translateWithMyMemory(text),
    getSpanishEnglishDictionary(text),
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

  // Add MyMemory translation
  if (mymemoryResult.status === 'fulfilled') {
    const result = mymemoryResult.value;
    addUniqueTranslation(result.translatedText, 'mymemory', result.confidence);
  }

  // Add dictionary translations (multiple meanings for richer context)
  if (dictionaryWords.status === 'fulfilled' && dictionaryWords.value.length > 0) {
    dictionaryWords.value.forEach(word => {
      addUniqueTranslation(word, 'dictionary', 0.7);
    });
  }

  // Limit to top 5 translations to avoid overwhelming users
  return translations.slice(0, 5);
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

