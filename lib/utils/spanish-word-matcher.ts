/**
 * Spanish Word Matcher Utility
 * 
 * Handles intelligent word matching for Context Selection review method.
 * Accounts for Spanish word inflections (gender, number, verb conjugations).
 * 
 * Problem: Stored word "específico" doesn't match "específica" in sentence
 * Solution: Generate variations and try multiple matching strategies
 * 
 * @module lib/utils/spanish-word-matcher
 */

/**
 * Generate common Spanish word variations
 * Handles gender (o/a) and number (singular/plural) variations
 */
export function generateSpanishVariations(word: string): string[] {
  const variations = new Set<string>();
  variations.add(word); // Always include original

  const lower = word.toLowerCase();

  // Strategy 1: Gender variations (o ↔ a, e ↔ a)
  if (lower.endsWith('o')) {
    const stem = lower.slice(0, -1);
    variations.add(stem + 'a'); // específico → específica
    variations.add(stem + 'os'); // específico → específicos
    variations.add(stem + 'as'); // específico → específicas
  } else if (lower.endsWith('a')) {
    const stem = lower.slice(0, -1);
    variations.add(stem + 'o'); // específica → específico
    variations.add(stem + 'os'); // específica → específicos
    variations.add(stem + 'as'); // específica → específicas
  } else if (lower.endsWith('e')) {
    const stem = lower.slice(0, -1);
    variations.add(stem + 'a'); // grande → granda (less common but try)
    variations.add(stem + 'es'); // grande → grandes
    variations.add(stem + 'as'); // grande → grandas
  }

  // Strategy 2: Plural variations (add s or es)
  if (!lower.endsWith('s')) {
    variations.add(lower + 's'); // especial → especiales (will be added again below)
    if (lower.endsWith('z')) {
      variations.add(lower.slice(0, -1) + 'ces'); // feliz → felices
    } else if (!lower.match(/[aeiou]$/)) {
      variations.add(lower + 'es'); // especial → especiales
    }
  }

  // Strategy 3: Remove plural (if word ends in s, try singular)
  if (lower.endsWith('s') && lower.length > 2) {
    variations.add(lower.slice(0, -1)); // específicos → específico
    if (lower.endsWith('es') && lower.length > 3) {
      variations.add(lower.slice(0, -2)); // especiales → especial
    }
  }

  // Strategy 4: Verb conjugation patterns (common endings)
  // For verbs, try infinitive form
  if (lower.endsWith('ar') || lower.endsWith('er') || lower.endsWith('ir')) {
    // It's already an infinitive, add common conjugations
    const stem = lower.slice(0, -2);
    variations.add(stem + 'a'); // hablar → habla
    variations.add(stem + 'o'); // hablar → hablo
    variations.add(stem + 'an'); // hablar → hablan
    variations.add(stem + 'as'); // hablar → hablas
    variations.add(stem + 'ó'); // hablar → habló
    variations.add(stem + 'é'); // hablar → hablé
  }

  // Return as array, preserving case from original word
  const result: string[] = [];
  const isCapitalized = word[0] === word[0].toUpperCase();
  
  for (const variation of variations) {
    if (isCapitalized && variation !== word) {
      // Capitalize first letter to match original
      result.push(variation.charAt(0).toUpperCase() + variation.slice(1));
    } else {
      result.push(variation);
    }
  }

  return result;
}

/**
 * Find a word (or its variations) in a sentence
 * Returns the matched form and position
 */
export function findWordInSentence(
  sentence: string,
  word: string
): {
  found: boolean;
  matchedForm?: string;
  position?: number;
  strategy?: string;
} {
  // Strategy 1: Try exact match first (case-insensitive)
  const exactRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
  const exactMatch = exactRegex.exec(sentence);
  if (exactMatch) {
    return {
      found: true,
      matchedForm: exactMatch[0],
      position: exactMatch.index,
      strategy: 'exact',
    };
  }

  // Strategy 2: Try all variations
  const variations = generateSpanishVariations(word);
  for (const variation of variations) {
    if (variation === word) continue; // Already tried

    const variationRegex = new RegExp(`\\b${escapeRegex(variation)}\\b`, 'gi');
    const variationMatch = variationRegex.exec(sentence);
    if (variationMatch) {
      return {
        found: true,
        matchedForm: variationMatch[0],
        position: variationMatch.index,
        strategy: 'variation',
      };
    }
  }

  // Strategy 3: Try partial stem match (minimum 4 characters)
  if (word.length >= 4) {
    const stem = word.slice(0, -1); // Remove last character
    const stemRegex = new RegExp(`\\b${escapeRegex(stem)}[a-záéíóúñü]+\\b`, 'gi');
    const stemMatch = stemRegex.exec(sentence);
    if (stemMatch) {
      return {
        found: true,
        matchedForm: stemMatch[0],
        position: stemMatch.index,
        strategy: 'stem',
      };
    }
  }

  return { found: false };
}

/**
 * Replace a word (or its variations) with a blank in a sentence
 * Returns the modified sentence and success status
 */
export function replaceWithBlank(
  sentence: string,
  word: string,
  blank: string = '_______'
): {
  result: string;
  success: boolean;
  matchedForm?: string;
  strategy?: string;
} {
  // First, find the word
  const findResult = findWordInSentence(sentence, word);

  if (!findResult.found || !findResult.matchedForm) {
    return {
      result: sentence,
      success: false,
    };
  }

  // Replace the matched form with blank
  const regex = new RegExp(`\\b${escapeRegex(findResult.matchedForm)}\\b`, 'gi');
  const result = sentence.replace(regex, blank);

  // Verify that the blank was actually inserted
  const hasBlank = result.includes(blank);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [Word Matcher] Replace result:', {
      word,
      matchedForm: findResult.matchedForm,
      strategy: findResult.strategy,
      success: hasBlank,
      original: sentence.substring(0, 50) + '...',
      result: result.substring(0, 50) + '...',
    });
  }

  return {
    result,
    success: hasBlank,
    matchedForm: findResult.matchedForm,
    strategy: findResult.strategy,
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate that a sentence can be used for Context Selection
 * Checks if the target word (or variations) exists in the sentence
 */
export function validateSentenceForContextSelection(
  sentence: string,
  word: string
): {
  valid: boolean;
  matchedForm?: string;
  reason?: string;
} {
  if (!sentence || !word) {
    return {
      valid: false,
      reason: 'Missing sentence or word',
    };
  }

  const findResult = findWordInSentence(sentence, word);

  if (!findResult.found) {
    return {
      valid: false,
      reason: `Word "${word}" (or variations) not found in sentence`,
    };
  }

  return {
    valid: true,
    matchedForm: findResult.matchedForm,
  };
}
