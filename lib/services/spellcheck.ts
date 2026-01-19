/**
 * Spell Check Service
 * 
 * Validates Spanish spelling using LanguageTool API
 * 
 * @module lib/services/spellcheck
 */

export interface SpellCheckResult {
  isCorrect: boolean;
  suggestions: string[];
  message?: string;
}

export interface SpellCheckError {
  error: string;
  message: string;
}

/**
 * Checks if a word is a Spanish verb infinitive
 */
function isSpanishInfinitive(word: string): boolean {
  return word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir');
}

/**
 * Filters suggestions to only include infinitive forms for verbs
 * and removes conjugated forms
 */
function filterSuggestions(suggestions: string[], originalWord: string): string[] {
  // If the original word is an infinitive, only suggest infinitives
  if (isSpanishInfinitive(originalWord)) {
    return suggestions.filter(s => isSpanishInfinitive(s));
  }
  
  // For non-verbs, return all suggestions but limit to 5
  return suggestions.slice(0, 5);
}

/**
 * Checks if a Spanish word is spelled correctly
 * Uses LanguageTool API (free tier: 20 requests/minute)
 * 
 * @param word - Spanish word to check
 * @returns Spell check result with suggestions if incorrect
 */
export async function checkSpanishSpelling(
  word: string
): Promise<SpellCheckResult> {
  if (!word || word.trim().length === 0) {
    return {
      isCorrect: false,
      suggestions: [],
      message: 'Word cannot be empty',
    };
  }

  const trimmedWord = word.trim();

  try {
    // Use LanguageTool public API
    const apiUrl = 'https://api.languagetool.org/v2/check';
    
    const params = new URLSearchParams({
      text: trimmedWord,
      language: 'es',
      enabledOnly: 'false',
      // Request English error messages
      motherTongue: 'en',
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API returned ${response.status}`);
    }

    const data = await response.json();

    // Only check for actual misspellings, not grammar issues
    const spellingErrors = data.matches.filter(
      (match: any) => 
        match.rule.issueType === 'misspelling' ||
        match.rule.category.id === 'TYPOS'
    );

    if (spellingErrors.length === 0) {
      return {
        isCorrect: true,
        suggestions: [],
      };
    }

    // Get suggestions from the first error
    const firstError = spellingErrors[0];
    const rawSuggestions = firstError.replacements
      .map((r: any) => r.value)
      .filter((s: string) => s && s.trim().length > 0);

    // Filter suggestions based on word type
    const filteredSuggestions = filterSuggestions(rawSuggestions, trimmedWord);

    // If no suggestions remain after filtering, the word is probably correct
    if (filteredSuggestions.length === 0) {
      return {
        isCorrect: true,
        suggestions: [],
      };
    }

    return {
      isCorrect: false,
      suggestions: filteredSuggestions.slice(0, 5),
      message: 'Possible spelling error detected',
    };
  } catch (error) {
    console.error('Spell check error:', error);
    
    // If spell check fails, assume word is correct (don't block user)
    return {
      isCorrect: true,
      suggestions: [],
      message: 'Spell check unavailable',
    };
  }
}

/**
 * Validates a Spanish word and returns suggestions if misspelled
 * 
 * @param word - Spanish word to validate
 * @returns Validation result with suggestions
 */
export async function validateSpanishWord(
  word: string
): Promise<{ valid: boolean; suggestions: string[]; message?: string }> {
  const result = await checkSpanishSpelling(word);
  
  return {
    valid: result.isCorrect,
    suggestions: result.suggestions,
    message: result.message,
  };
}

