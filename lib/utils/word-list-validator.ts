/**
 * Word List Validator
 * Phase 18.1.7 - Data Quality Enhancement
 * 
 * Validates Spanish word lists before processing to prevent:
 * - Conjugated verbs (50x multiplication issue)
 * - Duplicate words (wasted processing)
 * - Missing/invalid translations
 * - Rank sequence issues
 * - Invalid POS tags
 * - Invalid frequency tiers
 * - Unusually long/short words
 * 
 * Usage:
 *   import { validateWordList } from '@/lib/utils/word-list-validator';
 *   const result = validateWordList(words);
 *   if (!result.valid) { // handle errors }
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WordEntry {
  rank: number;
  word: string;
  pos: string;
  translation: string;
  frequency: string;
}

export type ValidationErrorType = 
  | 'verb_form'
  | 'duplicate'
  | 'translation'
  | 'rank'
  | 'pos'
  | 'frequency'
  | 'length';

export type ValidationSeverity = 'critical' | 'error' | 'warning';

export interface ValidationError {
  type: ValidationErrorType;
  word: string;
  rank: number;
  message: string;
  severity: ValidationSeverity;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalWords: number;
    criticalErrors: number;
    errors: number;
    warnings: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_POS_TAGS = [
  'verb',
  'noun',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'article',
  'determiner',
  'interjection',
];

const VALID_FREQUENCY_TIERS = [
  'very_high',
  'high',
  'medium',
  'low',
  'very_low',
];

const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 30;
const MIN_TRANSLATION_LENGTH = 1;
const MAX_TRANSLATION_LENGTH = 100;

// ============================================================================
// INDIVIDUAL VALIDATORS
// ============================================================================

/**
 * Validates that verbs are in infinitive form
 * 
 * Spanish infinitives end in:
 * - Regular: -ar, -er, -ir
 * - Irregular: -ír (oír, reír, sonreír)
 * - Reflexive: -arse, -erse, -irse (sentarse, vestirse)
 */
export function validateVerbForm(word: WordEntry): ValidationError | null {
  if (word.pos !== 'verb') {
    return null; // Not a verb, skip
  }

  const wordLower = word.word.toLowerCase();
  
  // Check for valid infinitive endings
  const isInfinitive = 
    wordLower.endsWith('ar') ||
    wordLower.endsWith('er') ||
    wordLower.endsWith('ir') ||
    wordLower.endsWith('ír') ||   // Irregular: oír, reír
    wordLower.endsWith('arse') || // Reflexive -ar
    wordLower.endsWith('erse') || // Reflexive -er
    wordLower.endsWith('irse');   // Reflexive -ir

  if (!isInfinitive) {
    return {
      type: 'verb_form',
      word: word.word,
      rank: word.rank,
      severity: 'critical',
      message: `Conjugated verb detected. All verbs must be in infinitive form (ending in -ar, -er, -ir).`,
      suggestion: `Run: npx tsx scripts/fix-conjugated-verbs.ts`,
    };
  }

  return null;
}

/**
 * Detects duplicate words in the list
 * 
 * Compares lowercase versions to catch case variations.
 * Reports both the first occurrence and duplicate ranks.
 */
export function detectDuplicates(words: WordEntry[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const wordMap = new Map<string, number>(); // word -> first rank

  for (const entry of words) {
    const wordLower = entry.word.toLowerCase();
    
    if (wordMap.has(wordLower)) {
      const firstRank = wordMap.get(wordLower)!;
      errors.push({
        type: 'duplicate',
        word: entry.word,
        rank: entry.rank,
        severity: 'critical',
        message: `Duplicate word detected. Already exists at rank ${firstRank}.`,
        suggestion: `Remove duplicate or verify if they are truly different words.`,
      });
    } else {
      wordMap.set(wordLower, entry.rank);
    }
  }

  return errors;
}

/**
 * Validates translation field
 * 
 * Checks for:
 * - Missing or empty translations
 * - Placeholder values (undefined, null, TBD)
 * - Unreasonably long translations
 */
export function validateTranslation(word: WordEntry): ValidationError | null {
  // Check if translation exists and is non-empty
  if (!word.translation || word.translation.trim().length === 0) {
    return {
      type: 'translation',
      word: word.word,
      rank: word.rank,
      severity: 'critical',
      message: `Missing or empty translation.`,
      suggestion: `Add English translation for this word.`,
    };
  }

  const translation = word.translation.trim();

  // Check for placeholder values
  const placeholders = ['undefined', 'null', 'tbd', 'todo', 'fixme', '???'];
  if (placeholders.some(p => translation.toLowerCase().includes(p))) {
    return {
      type: 'translation',
      word: word.word,
      rank: word.rank,
      severity: 'critical',
      message: `Invalid translation contains placeholder: "${translation}".`,
      suggestion: `Replace with actual English translation.`,
    };
  }

  // Check length bounds
  if (translation.length < MIN_TRANSLATION_LENGTH) {
    return {
      type: 'translation',
      word: word.word,
      rank: word.rank,
      severity: 'critical',
      message: `Translation is too short (${translation.length} chars).`,
      suggestion: `Provide a more complete translation.`,
    };
  }

  if (translation.length > MAX_TRANSLATION_LENGTH) {
    return {
      type: 'translation',
      word: word.word,
      rank: word.rank,
      severity: 'warning',
      message: `Translation is unusually long (${translation.length} chars). Consider simplifying.`,
    };
  }

  return null;
}

/**
 * Validates rank sequence
 * 
 * Ensures:
 * - Ranks start at 1
 * - Ranks are sequential (no gaps)
 * - No duplicate ranks
 */
export function validateRankSequence(words: WordEntry[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const rankSet = new Set<number>();

  // Check for duplicate ranks
  for (const word of words) {
    if (rankSet.has(word.rank)) {
      errors.push({
        type: 'rank',
        word: word.word,
        rank: word.rank,
        severity: 'critical',
        message: `Duplicate rank ${word.rank} detected.`,
        suggestion: `Ensure each word has a unique rank.`,
      });
    }
    rankSet.add(word.rank);
  }

  // Check sequential order
  const sortedWords = [...words].sort((a, b) => a.rank - b.rank);
  
  for (let i = 0; i < sortedWords.length; i++) {
    const expectedRank = i + 1;
    const actualRank = sortedWords[i].rank;
    
    if (actualRank !== expectedRank) {
      errors.push({
        type: 'rank',
        word: sortedWords[i].word,
        rank: actualRank,
        severity: 'critical',
        message: `Rank sequence broken. Expected rank ${expectedRank}, got ${actualRank}.`,
        suggestion: `Re-rank words sequentially starting from 1.`,
      });
    }
  }

  return errors;
}

/**
 * Validates Part of Speech (POS) tag
 * 
 * Checks against known valid POS tags.
 */
export function validatePOS(word: WordEntry): ValidationError | null {
  if (!word.pos || word.pos.trim().length === 0) {
    return {
      type: 'pos',
      word: word.word,
      rank: word.rank,
      severity: 'error',
      message: `Missing part of speech (POS) tag.`,
      suggestion: `Add POS tag (e.g., verb, noun, adjective).`,
    };
  }

  const posLower = word.pos.toLowerCase().trim();
  
  if (!VALID_POS_TAGS.includes(posLower)) {
    return {
      type: 'pos',
      word: word.word,
      rank: word.rank,
      severity: 'error',
      message: `Invalid POS tag: "${word.pos}". Valid tags: ${VALID_POS_TAGS.join(', ')}.`,
      suggestion: `Use one of the standard POS tags.`,
    };
  }

  return null;
}

/**
 * Validates frequency tier
 * 
 * Checks against known valid frequency tiers.
 */
export function validateFrequency(word: WordEntry): ValidationError | null {
  if (!word.frequency || word.frequency.trim().length === 0) {
    return {
      type: 'frequency',
      word: word.word,
      rank: word.rank,
      severity: 'error',
      message: `Missing frequency tier.`,
      suggestion: `Add frequency tier (e.g., very_high, high, medium, low).`,
    };
  }

  const frequencyLower = word.frequency.toLowerCase().trim();
  
  if (!VALID_FREQUENCY_TIERS.includes(frequencyLower)) {
    return {
      type: 'frequency',
      word: word.word,
      rank: word.rank,
      severity: 'error',
      message: `Invalid frequency tier: "${word.frequency}". Valid tiers: ${VALID_FREQUENCY_TIERS.join(', ')}.`,
      suggestion: `Use one of the standard frequency tiers.`,
    };
  }

  return null;
}

/**
 * Validates word length
 * 
 * Checks for unusually short or long words that may be errors.
 */
export function validateWordLength(word: WordEntry): ValidationError | null {
  const wordLength = word.word.trim().length;

  if (wordLength < MIN_WORD_LENGTH) {
    return {
      type: 'length',
      word: word.word,
      rank: word.rank,
      severity: 'warning',
      message: `Word is unusually short (${wordLength} chars). May be an abbreviation or error.`,
    };
  }

  if (wordLength > MAX_WORD_LENGTH) {
    return {
      type: 'length',
      word: word.word,
      rank: word.rank,
      severity: 'warning',
      message: `Word is unusually long (${wordLength} chars). May be a phrase or compound word.`,
    };
  }

  return null;
}

// ============================================================================
// AGGREGATE VALIDATOR
// ============================================================================

/**
 * Validates entire word list
 * 
 * Runs all individual validators and aggregates results.
 * Returns structured result with errors categorized by severity.
 */
export function validateWordList(words: WordEntry[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Run individual word validators
  for (const word of words) {
    const verbError = validateVerbForm(word);
    const translationError = validateTranslation(word);
    const posError = validatePOS(word);
    const frequencyError = validateFrequency(word);
    const lengthError = validateWordLength(word);

    if (verbError) allErrors.push(verbError);
    if (translationError) allErrors.push(translationError);
    if (posError) allErrors.push(posError);
    if (frequencyError) allErrors.push(frequencyError);
    if (lengthError) allErrors.push(lengthError);
  }

  // Run list-level validators
  const duplicateErrors = detectDuplicates(words);
  const rankErrors = validateRankSequence(words);

  allErrors.push(...duplicateErrors);
  allErrors.push(...rankErrors);

  // Categorize by severity
  const criticalErrors = allErrors.filter(e => e.severity === 'critical');
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  return {
    valid: criticalErrors.length === 0,
    errors: [...criticalErrors, ...errors],
    warnings,
    summary: {
      totalWords: words.length,
      criticalErrors: criticalErrors.length,
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats validation result as human-readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('📊 WORD LIST VALIDATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════\n');

  lines.push(`Total words: ${result.summary.totalWords}`);
  lines.push(`Critical errors: ${result.summary.criticalErrors}`);
  lines.push(`Errors: ${result.summary.errors}`);
  lines.push(`Warnings: ${result.summary.warnings}\n`);

  if (result.valid) {
    lines.push('✅ Validation PASSED');
    lines.push('   All critical checks passed. Word list is ready for processing.\n');
  } else {
    lines.push('❌ Validation FAILED');
    lines.push('   Critical errors detected. Please fix before proceeding.\n');
  }

  if (result.errors.length > 0) {
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('❌ ERRORS');
    lines.push('═══════════════════════════════════════════════════════════\n');

    result.errors.forEach((err, i) => {
      lines.push(`${i + 1}. [${err.severity.toUpperCase()}] ${err.type}: "${err.word}" (rank ${err.rank})`);
      lines.push(`   ${err.message}`);
      if (err.suggestion) {
        lines.push(`   💡 Suggestion: ${err.suggestion}`);
      }
      lines.push('');
    });
  }

  if (result.warnings.length > 0) {
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('⚠️  WARNINGS');
    lines.push('═══════════════════════════════════════════════════════════\n');

    result.warnings.forEach((warn, i) => {
      lines.push(`${i + 1}. [WARNING] ${warn.type}: "${warn.word}" (rank ${warn.rank})`);
      lines.push(`   ${warn.message}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}
