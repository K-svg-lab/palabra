/**
 * Answer Checker - Recall Mode Utilities
 * 
 * Provides fuzzy matching and similarity scoring for user-typed answers
 * Used in recall mode to determine if answers are correct or partially correct
 */

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits required to change one word into another
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Normalize a string for comparison
 * - Converts to lowercase
 * - Removes accents/diacritics
 * - Trims whitespace
 * - Removes punctuation
 * 
 * @param str - Input string
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Calculate similarity score between two strings
 * Uses normalized Levenshtein distance
 * 
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @returns Similarity score (0-1, where 1 is perfect match)
 */
export function calculateSimilarity(userAnswer: string, correctAnswer: string): number {
  const normalizedUser = normalizeString(userAnswer);
  const normalizedCorrect = normalizeString(correctAnswer);
  
  // Exact match after normalization
  if (normalizedUser === normalizedCorrect) {
    return 1.0;
  }
  
  // Empty answer
  if (normalizedUser.length === 0) {
    return 0.0;
  }
  
  // Calculate edit distance
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  
  // Normalize to 0-1 range
  const similarity = 1 - (distance / maxLength);
  
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Check if an answer is correct with configurable thresholds
 * 
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param strictMode - Whether to use strict matching (default: false)
 * @param isListeningMode - Whether this is for listening mode (more lenient)
 * @returns Object with isCorrect flag and similarity score
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  strictMode: boolean = false,
  isListeningMode: boolean = false
): { isCorrect: boolean; similarity: number; feedback: string } {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  // Thresholds - much more lenient for listening mode since spelling from audio is very difficult
  const PERFECT_THRESHOLD = 1.0;
  const CORRECT_THRESHOLD = isListeningMode 
    ? (strictMode ? 0.85 : 0.70)  // Very forgiving for listening - accept 70% similarity
    : (strictMode ? 0.95 : 0.85);
  const CLOSE_THRESHOLD = isListeningMode ? 0.55 : 0.70;
  
  let isCorrect = false;
  let feedback = '';
  
  if (similarity >= PERFECT_THRESHOLD) {
    isCorrect = true;
    feedback = '✅ Perfect!';
  } else if (similarity >= CORRECT_THRESHOLD) {
    isCorrect = true;
    feedback = '✅ Correct! (Minor spelling difference)';
  } else if (similarity >= CLOSE_THRESHOLD) {
    isCorrect = false;
    feedback = '⚠️ Close, but not quite right';
  } else {
    isCorrect = false;
    feedback = '❌ Incorrect';
  }
  
  return { isCorrect, similarity, feedback };
}

/**
 * Check answer against multiple acceptable answers
 * Useful for words with multiple translations
 * 
 * @param userAnswer - User's answer
 * @param correctAnswers - Array of acceptable answers
 * @param strictMode - Whether to use strict matching
 * @param isListeningMode - Whether this is for listening mode (more lenient)
 * @returns Best match result
 */
export function checkAnswerMultiple(
  userAnswer: string,
  correctAnswers: string[],
  strictMode: boolean = false,
  isListeningMode: boolean = false
): { isCorrect: boolean; similarity: number; feedback: string; matchedAnswer: string } {
  let bestResult = {
    isCorrect: false,
    similarity: 0,
    feedback: '❌ Incorrect',
    matchedAnswer: correctAnswers[0] || '',
  };
  
  for (const correctAnswer of correctAnswers) {
    const result = checkAnswer(userAnswer, correctAnswer, strictMode, isListeningMode);
    
    if (result.similarity > bestResult.similarity) {
      bestResult = {
        ...result,
        matchedAnswer: correctAnswer,
      };
    }
    
    // Early exit if perfect match
    if (result.similarity >= 1.0) {
      break;
    }
  }
  
  return bestResult;
}

/**
 * Extract article from Spanish word (el/la/un/una)
 * 
 * @param word - Spanish word (possibly with article)
 * @returns Object with article and word separated
 */
export function extractArticle(word: string): { article: string | null; word: string } {
  const trimmed = word.trim();
  const articles = ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas '];
  
  for (const article of articles) {
    if (trimmed.toLowerCase().startsWith(article)) {
      return {
        article: article.trim(),
        word: trimmed.substring(article.length).trim(),
      };
    }
  }
  
  return { article: null, word: trimmed };
}

/**
 * Check Spanish answer with article awareness
 * Allows for missing or incorrect articles with partial credit
 * 
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param isListeningMode - Whether this is for listening mode (more lenient)
 * @returns Check result
 */
export function checkSpanishAnswer(
  userAnswer: string,
  correctAnswer: string,
  isListeningMode: boolean = false
): { isCorrect: boolean; similarity: number; feedback: string } {
  const userParts = extractArticle(userAnswer);
  const correctParts = extractArticle(correctAnswer);

  // Check the main word
  const wordSimilarity = calculateSimilarity(userParts.word, correctParts.word);
  
  // Check the article (if present in correct answer)
  let articleCorrect = true;
  if (correctParts.article) {
    if (!userParts.article) {
      // Missing article - acceptable in listening mode
      articleCorrect = !isListeningMode;
    } else {
      articleCorrect = normalizeString(userParts.article) === normalizeString(correctParts.article);
    }
  }
  
  // Determine overall correctness - much more lenient for listening mode
  const WORD_THRESHOLD = isListeningMode ? 0.70 : 0.85;  // Accept 70% similarity in listening
  const CLOSE_THRESHOLD = isListeningMode ? 0.55 : 0.70;
  const wordCorrect = wordSimilarity >= WORD_THRESHOLD;
  
  let isCorrect = false;
  let feedback = '';
  let finalSimilarity = wordSimilarity;
  
  if (wordCorrect && articleCorrect) {
    isCorrect = true;
    feedback = '✅ Perfect!';
  } else if (wordCorrect && !articleCorrect) {
    isCorrect = true; // Accept with warning
    if (isListeningMode) {
      feedback = '✅ Correct! (Article optional in listening mode)';
    } else {
      feedback = `✅ Correct word, but article should be "${correctParts.article}"`;
    }
    finalSimilarity *= 0.95; // Slight penalty
  } else if (wordSimilarity >= CLOSE_THRESHOLD) {
    isCorrect = false;
    feedback = '⚠️ Close, but not quite right';
    finalSimilarity = wordSimilarity * 0.8;
  } else {
    isCorrect = false;
    feedback = '❌ Incorrect';
  }
  
  return { isCorrect, similarity: finalSimilarity, feedback };
}

/**
 * Get hints for the user based on their answer
 * 
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @returns Hint string
 */
export function getHint(userAnswer: string, correctAnswer: string): string {
  const normalizedUser = normalizeString(userAnswer);
  const normalizedCorrect = normalizeString(correctAnswer);
  
  // Empty answer
  if (normalizedUser.length === 0) {
    return `Hint: The answer starts with "${correctAnswer.substring(0, 2)}..."`;
  }
  
  // Wrong length
  if (Math.abs(normalizedUser.length - normalizedCorrect.length) > 3) {
    return `Hint: The answer has ${correctAnswer.length} letters`;
  }
  
  // Wrong starting
  if (!normalizedCorrect.startsWith(normalizedUser.substring(0, 2))) {
    return `Hint: The answer starts with "${correctAnswer.substring(0, 3)}..."`;
  }
  
  return `Hint: Keep trying! The correct answer is "${correctAnswer}"`;
}

/**
 * Auto-suggest answer as user types (for practice mode)
 * 
 * @param userAnswer - User's partial answer
 * @param correctAnswer - Correct answer
 * @param minSimilarity - Minimum similarity to show suggestion
 * @returns Suggested completion or null
 */
export function autoSuggest(
  userAnswer: string,
  correctAnswer: string,
  minSimilarity: number = 0.6
): string | null {
  if (userAnswer.length < 2) {
    return null;
  }
  
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  if (similarity >= minSimilarity && userAnswer.length < correctAnswer.length) {
    return correctAnswer;
  }
  
  return null;
}

