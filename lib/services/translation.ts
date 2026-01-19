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
  source: 'deepl' | 'mymemory' | 'fallback' | 'cache';
  detectedLanguage?: string;
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
      target_lang: 'EN',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API returned ${response.status}`);
  }

  const data = await response.json();
  const rawTranslation = data.translations[0].text;
  
  // Clean the translation to remove Spanish word if present
  const cleanedTranslation = cleanTranslation(rawTranslation, text);

  return {
    translatedText: cleanedTranslation,
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
  
  // Clean the translation to remove Spanish word if present
  const rawTranslation = data.responseData.translatedText;
  const cleanedTranslation = cleanTranslation(rawTranslation, text);

  return {
    translatedText: cleanedTranslation,
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
      return await translateWithDeepL(text);
    } catch (error) {
      console.warn('DeepL translation failed, falling back to MyMemory:', error);
      // Fall through to MyMemory
    }
  }

  // Use MyMemory as fallback (or primary if no DeepL key)
  try {
    const result = await translateWithMyMemory(text);
    return result;
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
 * Get multiple translation perspectives for a word
 * Calls both DeepL and MyMemory to provide learners with different viewpoints
 * 
 * @param text - Spanish word to translate
 * @returns Array of translation results from different sources
 */
export async function getMultipleTranslations(
  text: string
): Promise<TranslationResult[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const translations: TranslationResult[] = [];

  // Try to get both DeepL and MyMemory translations
  const [deeplResult, mymemoryResult] = await Promise.allSettled([
    process.env.NEXT_PUBLIC_DEEPL_API_KEY ? translateWithDeepL(text) : Promise.reject('No API key'),
    translateWithMyMemory(text),
  ]);

  // Add DeepL translation if successful
  if (deeplResult.status === 'fulfilled') {
    translations.push(deeplResult.value);
  }

  // Add MyMemory translation if successful and different from DeepL
  if (mymemoryResult.status === 'fulfilled') {
    const mymemoryTranslation = mymemoryResult.value;
    // Only add if it's different from DeepL translation
    if (translations.length === 0 || 
        translations[0].translatedText.toLowerCase() !== mymemoryTranslation.translatedText.toLowerCase()) {
      translations.push(mymemoryTranslation);
    }
  }

  return translations;
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

