/**
 * Cross-Validation Service
 * 
 * Compares translation results from multiple APIs and flags discrepancies.
 * Phase 16.1 Task 2 - Translation Quality & Cross-Validation
 * 
 * Helps ensure translation quality by detecting when different sources disagree.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TranslationSource {
  source: 'deepl' | 'mymemory' | 'wiktionary' | 'verified-cache' | 'dictionary';
  translation: string;
  confidence?: number;
  alternatives?: string[];
}

export interface CrossValidationResult {
  hasDisagreement: boolean;
  agreementLevel: number; // 0.0 to 1.0 (1.0 = perfect agreement)
  sources: TranslationSource[];
  primaryTranslation: string; // Most agreed-upon translation
  disagreements: DisagreementDetail[];
  recommendation: 'accept' | 'review' | 'manual';
}

export interface DisagreementDetail {
  source1: string;
  source2: string;
  translation1: string;
  translation2: string;
  similarityScore: number;
  reason: 'different_word' | 'synonym' | 'spelling_variant' | 'unknown';
}

// ============================================================================
// SYNONYM SETS
// ============================================================================

/**
 * Common synonym groups for Spanish-English translations
 * Words in the same group are considered equivalent
 */
const SYNONYM_GROUPS = [
  // Animals
  ['dog', 'hound', 'canine'],
  ['cat', 'feline', 'kitty'],
  ['horse', 'steed', 'equine'],
  
  // Common words
  ['hello', 'hi', 'greetings'],
  ['goodbye', 'bye', 'farewell'],
  ['yes', 'yeah', 'yep'],
  ['no', 'nope', 'nah'],
  
  // Actions
  ['eat', 'consume', 'dine'],
  ['drink', 'beverage', 'imbibe'],
  ['walk', 'stroll', 'ambulate'],
  ['run', 'sprint', 'jog'],
  ['sleep', 'rest', 'slumber'],
  
  // Descriptors
  ['big', 'large', 'huge'],
  ['small', 'little', 'tiny'],
  ['good', 'nice', 'fine'],
  ['bad', 'poor', 'terrible'],
  
  // Time
  ['morning', 'dawn', 'daybreak'],
  ['night', 'evening', 'nighttime'],
  ['day', 'daytime'],
  
  // Food
  ['food', 'meal', 'dish'],
  ['water', 'liquid', 'beverage'],
  ['bread', 'loaf'],
  
  // People
  ['man', 'guy', 'male'],
  ['woman', 'lady', 'female'],
  ['child', 'kid', 'youngster'],
  ['person', 'individual', 'human'],
  
  // Places
  ['house', 'home', 'residence'],
  ['street', 'road', 'avenue'],
  ['city', 'town', 'urban area'],
  
  // Objects
  ['book', 'volume', 'tome'],
  ['car', 'automobile', 'vehicle'],
  ['phone', 'telephone', 'cell'],
  
  // Verbs (common variations)
  ['make', 'create', 'build'],
  ['do', 'perform', 'execute'],
  ['have', 'possess', 'own'],
  ['be', 'exist'],
  ['go', 'travel', 'move'],
  ['come', 'arrive', 'approach'],
  ['see', 'view', 'observe'],
  ['know', 'understand', 'comprehend'],
  ['think', 'believe', 'consider'],
  ['want', 'desire', 'wish'],
  ['give', 'provide', 'offer'],
  ['take', 'grab', 'seize'],
  ['say', 'speak', 'tell'],
  ['find', 'discover', 'locate'],
  ['get', 'obtain', 'acquire'],
  ['put', 'place', 'set'],
  ['leave', 'depart', 'exit'],
  ['work', 'labor', 'toil'],
  ['call', 'summon', 'invoke'],
  ['try', 'attempt', 'endeavor'],
  ['ask', 'inquire', 'question'],
  ['need', 'require', 'necessitate'],
  ['feel', 'sense', 'experience'],
  ['become', 'turn into', 'transform'],
  ['use', 'utilize', 'employ'],
  ['start', 'begin', 'commence'],
  ['show', 'display', 'exhibit'],
  ['hear', 'listen', 'perceive'],
  ['play', 'perform', 'compete'],
  ['move', 'relocate', 'shift'],
  ['live', 'reside', 'dwell'],
  ['believe', 'think', 'suppose'],
  ['hold', 'grasp', 'clutch'],
  ['bring', 'carry', 'transport'],
  ['happen', 'occur', 'transpire'],
  ['write', 'compose', 'author'],
  ['sit', 'be seated', 'rest'],
  ['stand', 'be upright', 'rise'],
  ['lose', 'misplace', 'forfeit'],
  ['pay', 'compensate', 'remunerate'],
  ['meet', 'encounter', 'greet'],
  ['include', 'contain', 'comprise'],
  ['continue', 'proceed', 'persist'],
  ['set', 'place', 'position'],
  ['learn', 'study', 'master'],
  ['change', 'alter', 'modify'],
  ['lead', 'guide', 'direct'],
  ['understand', 'comprehend', 'grasp'],
  ['watch', 'observe', 'view'],
  ['follow', 'pursue', 'trail'],
  ['stop', 'cease', 'halt'],
  ['create', 'make', 'generate'],
  ['speak', 'talk', 'converse'],
  ['read', 'peruse', 'study'],
  ['allow', 'permit', 'enable'],
  ['add', 'append', 'include'],
  ['spend', 'expend', 'disburse'],
  ['grow', 'expand', 'increase'],
  ['open', 'unlock', 'unseal'],
  ['win', 'triumph', 'succeed'],
  ['offer', 'propose', 'suggest'],
  ['remember', 'recall', 'recollect'],
  ['consider', 'contemplate', 'ponder'],
  ['appear', 'seem', 'look'],
  ['buy', 'purchase', 'acquire'],
  ['wait', 'pause', 'hold'],
  ['serve', 'attend', 'assist'],
  ['die', 'perish', 'expire'],
  ['send', 'dispatch', 'transmit'],
  ['expect', 'anticipate', 'await'],
  ['build', 'construct', 'erect'],
  ['stay', 'remain', 'abide'],
  ['fall', 'drop', 'descend'],
  ['cut', 'slice', 'sever'],
  ['reach', 'attain', 'achieve'],
  ['kill', 'slay', 'eliminate'],
  ['raise', 'elevate', 'lift'],
  ['pass', 'proceed', 'advance'],
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits needed to change one word into another)
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
 * Calculate similarity score between two strings (0.0 to 1.0)
 * Uses normalized Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1.0 - (distance / maxLength);
}

/**
 * Check if two words are synonyms
 */
function areSynonyms(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase().trim();
  const w2 = word2.toLowerCase().trim();
  
  if (w1 === w2) return true;
  
  // Check if both words are in the same synonym group
  for (const group of SYNONYM_GROUPS) {
    if (group.includes(w1) && group.includes(w2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if two translations are spelling variants
 * (e.g., "color" vs "colour", "traveled" vs "travelled")
 */
function areSpellingVariants(word1: string, word2: string): number {
  const similarity = calculateSimilarity(word1, word2);
  
  // If very similar (>90%) and differ by 1-2 characters, likely spelling variant
  if (similarity > 0.90) {
    const distance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase());
    if (distance <= 2) {
      return similarity;
    }
  }
  
  return 0;
}

/**
 * Normalize translation for comparison
 * Removes articles, extra spaces, etc.
 */
function normalizeTranslation(translation: string): string {
  let normalized = translation.toLowerCase().trim();
  
  // Remove leading articles (a, an, the, to)
  normalized = normalized.replace(/^(a|an|the|to)\s+/, '');
  
  // Remove punctuation
  normalized = normalized.replace(/[.,!?;:]/g, '');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// ============================================================================
// CORE CROSS-VALIDATION FUNCTIONS
// ============================================================================

/**
 * Compare two translation sources and determine disagreement
 */
function compareTranslations(
  source1: TranslationSource,
  source2: TranslationSource
): DisagreementDetail | null {
  const t1 = normalizeTranslation(source1.translation);
  const t2 = normalizeTranslation(source2.translation);
  
  // Check if they're the same
  if (t1 === t2) {
    return null; // No disagreement
  }
  
  // Check if they're synonyms
  if (areSynonyms(t1, t2)) {
    return {
      source1: source1.source,
      source2: source2.source,
      translation1: source1.translation,
      translation2: source2.translation,
      similarityScore: 0.95, // High similarity for synonyms
      reason: 'synonym',
    };
  }
  
  // Check if they're spelling variants
  const variantSimilarity = areSpellingVariants(t1, t2);
  if (variantSimilarity > 0) {
    return {
      source1: source1.source,
      source2: source2.source,
      translation1: source1.translation,
      translation2: source2.translation,
      similarityScore: variantSimilarity,
      reason: 'spelling_variant',
    };
  }
  
  // Calculate similarity
  const similarity = calculateSimilarity(t1, t2);
  
  // If very different (< 60% similar), it's a disagreement
  if (similarity < 0.60) {
    return {
      source1: source1.source,
      source2: source2.source,
      translation1: source1.translation,
      translation2: source2.translation,
      similarityScore: similarity,
      reason: 'different_word',
    };
  }
  
  // Otherwise, it's unknown (possibly related but not synonyms)
  return {
    source1: source1.source,
    source2: source2.source,
    translation1: source1.translation,
    translation2: source2.translation,
    similarityScore: similarity,
    reason: 'unknown',
  };
}

/**
 * Find the most agreed-upon translation
 * Uses majority voting and confidence scores
 */
function findPrimaryTranslation(sources: TranslationSource[]): string {
  if (sources.length === 0) return '';
  if (sources.length === 1) return sources[0].translation;
  
  // Normalize all translations
  const translationCounts = new Map<string, { count: number; confidence: number; original: string }>();
  
  for (const source of sources) {
    const normalized = normalizeTranslation(source.translation);
    const existing = translationCounts.get(normalized);
    
    if (existing) {
      existing.count++;
      existing.confidence += source.confidence || 0.5;
    } else {
      translationCounts.set(normalized, {
        count: 1,
        confidence: source.confidence || 0.5,
        original: source.translation,
      });
    }
  }
  
  // Find translation with highest vote count + confidence
  let bestTranslation = sources[0].translation;
  let bestScore = 0;
  
  for (const [normalized, data] of translationCounts.entries()) {
    // Score = vote count + confidence average
    const score = data.count + (data.confidence / data.count);
    
    if (score > bestScore) {
      bestScore = score;
      bestTranslation = data.original;
    }
  }
  
  return bestTranslation;
}

/**
 * Main cross-validation function
 * Compares multiple translation sources and flags disagreements
 */
export function crossValidateTranslations(
  sources: TranslationSource[]
): CrossValidationResult {
  // Need at least 2 sources to compare
  if (sources.length < 2) {
    return {
      hasDisagreement: false,
      agreementLevel: 1.0,
      sources,
      primaryTranslation: sources[0]?.translation || '',
      disagreements: [],
      recommendation: 'accept',
    };
  }
  
  // Compare all pairs of sources
  const disagreements: DisagreementDetail[] = [];
  
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const disagreement = compareTranslations(sources[i], sources[j]);
      
      if (disagreement) {
        // Only add significant disagreements (not synonyms or spelling variants)
        if (disagreement.reason === 'different_word') {
          disagreements.push(disagreement);
        }
      }
    }
  }
  
  // Calculate agreement level
  const totalComparisons = (sources.length * (sources.length - 1)) / 2;
  const significantDisagreements = disagreements.filter(d => d.reason === 'different_word').length;
  const agreementLevel = 1.0 - (significantDisagreements / totalComparisons);
  
  // Determine if there's a disagreement
  const hasDisagreement = significantDisagreements > 0;
  
  // Find primary translation (most agreed-upon)
  const primaryTranslation = findPrimaryTranslation(sources);
  
  // Make recommendation
  let recommendation: 'accept' | 'review' | 'manual';
  
  if (agreementLevel >= 0.80) {
    recommendation = 'accept'; // High agreement
  } else if (agreementLevel >= 0.50) {
    recommendation = 'review'; // Moderate agreement - user should review
  } else {
    recommendation = 'manual'; // Low agreement - manual review required
  }
  
  return {
    hasDisagreement,
    agreementLevel,
    sources,
    primaryTranslation,
    disagreements,
    recommendation,
  };
}

/**
 * Get a human-readable explanation of the cross-validation result
 */
export function getCrossValidationExplanation(result: CrossValidationResult): string {
  if (!result.hasDisagreement) {
    return 'All sources agree on this translation.';
  }
  
  if (result.disagreements.length === 1) {
    const d = result.disagreements[0];
    return `${d.source1} suggests "${d.translation1}" while ${d.source2} suggests "${d.translation2}".`;
  }
  
  return `${result.disagreements.length} translation sources disagree. Review recommended.`;
}

/**
 * Calculate confidence penalty based on disagreement level
 * Returns a multiplier (0.5 to 1.0) to apply to confidence scores
 */
export function getConfidencePenalty(agreementLevel: number): number {
  if (agreementLevel >= 0.90) return 1.0;  // No penalty
  if (agreementLevel >= 0.70) return 0.90; // Small penalty
  if (agreementLevel >= 0.50) return 0.75; // Moderate penalty
  return 0.50; // Significant penalty
}
