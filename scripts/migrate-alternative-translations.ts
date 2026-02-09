/**
 * Migration Script: Fix Alternative Translations
 * 
 * This script migrates vocabulary words that have comma-separated translations
 * in the englishTranslation field to properly use the alternativeTranslations array.
 * 
 * Example transformation:
 * BEFORE:
 * {
 *   englishTranslation: "dying, dying person",
 *   alternativeTranslations: undefined
 * }
 * 
 * AFTER:
 * {
 *   englishTranslation: "dying",
 *   alternativeTranslations: ["dying person"]
 * }
 * 
 * Run this script in the browser console or as a standalone page.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { VocabularyWord } from '@/lib/types/vocabulary';

const DB_NAME = 'palabra_db';
const DB_VERSION = 5;
const VOCABULARY_STORE = 'vocabulary';

interface MigrationResult {
  totalWords: number;
  wordsNeedingMigration: number;
  wordsMigrated: number;
  errors: Array<{ wordId: string; error: string }>;
  samples: Array<{
    spanishWord: string;
    before: { englishTranslation: string; alternativeTranslations?: string[] };
    after: { englishTranslation: string; alternativeTranslations: string[] };
  }>;
}

/**
 * Detects if a translation string contains multiple translations
 */
function hasMultipleTranslations(translation: string): boolean {
  // Check for comma-separated values
  if (translation.includes(',')) {
    const parts = translation.split(',').map(t => t.trim());
    // Must have at least 2 non-empty parts
    return parts.filter(p => p.length > 0).length >= 2;
  }
  return false;
}

/**
 * Splits a comma-separated translation into primary and alternatives
 */
function splitTranslations(translation: string): { primary: string; alternatives: string[] } {
  const parts = translation
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  return {
    primary: parts[0] || translation,
    alternatives: parts.slice(1),
  };
}

/**
 * Opens the IndexedDB database
 */
async function openDatabase(): Promise<IDBPDatabase> {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // This should not be called if database already exists
      console.warn('[Migration] Database upgrade triggered - database may not exist yet');
    },
  });
}

/**
 * Migrates vocabulary words with multiple translations
 */
export async function migrateAlternativeTranslations(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalWords: 0,
    wordsNeedingMigration: 0,
    wordsMigrated: 0,
    errors: [],
    samples: [],
  };

  try {
    console.log('[Migration] Starting alternative translations migration...');
    
    // Open database
    const db = await openDatabase();
    
    // Get all vocabulary words
    const tx = db.transaction(VOCABULARY_STORE, 'readwrite');
    const store = tx.objectStore(VOCABULARY_STORE);
    const allWords = await store.getAll();
    
    result.totalWords = allWords.length;
    console.log(`[Migration] Found ${result.totalWords} vocabulary words`);
    
    // Process each word
    for (const word of allWords) {
      try {
        const needsMigration = 
          hasMultipleTranslations(word.englishTranslation) &&
          (!word.alternativeTranslations || word.alternativeTranslations.length === 0);
        
        if (needsMigration) {
          result.wordsNeedingMigration++;
          
          // Split translations
          const { primary, alternatives } = splitTranslations(word.englishTranslation);
          
          // Store sample for reporting (first 10 only)
          if (result.samples.length < 10) {
            result.samples.push({
              spanishWord: word.spanishWord,
              before: {
                englishTranslation: word.englishTranslation,
                alternativeTranslations: word.alternativeTranslations,
              },
              after: {
                englishTranslation: primary,
                alternativeTranslations: alternatives,
              },
            });
          }
          
          // Update word
          const updatedWord: VocabularyWord = {
            ...word,
            englishTranslation: primary,
            alternativeTranslations: alternatives,
            updatedAt: Date.now(),
          };
          
          // Save to database
          await store.put(updatedWord);
          result.wordsMigrated++;
          
          console.log(`[Migration] ✅ Migrated "${word.spanishWord}": "${word.englishTranslation}" → "${primary}" + [${alternatives.join(', ')}]`);
        }
      } catch (error) {
        result.errors.push({
          wordId: word.id,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`[Migration] ❌ Failed to migrate word "${word.spanishWord}":`, error);
      }
    }
    
    await tx.done;
    db.close();
    
    console.log('[Migration] ✅ Migration complete!');
    console.log(`  - Total words: ${result.totalWords}`);
    console.log(`  - Words needing migration: ${result.wordsNeedingMigration}`);
    console.log(`  - Words migrated: ${result.wordsMigrated}`);
    console.log(`  - Errors: ${result.errors.length}`);
    
    return result;
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Validates the migration by checking a sample of words
 */
export async function validateMigration(): Promise<{
  isValid: boolean;
  issues: string[];
  samplesChecked: number;
}> {
  const issues: string[] = [];
  let samplesChecked = 0;
  
  try {
    const db = await openDatabase();
    const tx = db.transaction(VOCABULARY_STORE, 'readonly');
    const store = tx.objectStore(VOCABULARY_STORE);
    const allWords = await store.getAll();
    
    for (const word of allWords.slice(0, 100)) { // Check first 100 words
      samplesChecked++;
      
      // Check if any word still has comma-separated translations
      if (hasMultipleTranslations(word.englishTranslation)) {
        issues.push(`Word "${word.spanishWord}" still has comma-separated translations: "${word.englishTranslation}"`);
      }
      
      // Check if alternativeTranslations is properly structured
      if (word.alternativeTranslations && !Array.isArray(word.alternativeTranslations)) {
        issues.push(`Word "${word.spanishWord}" has invalid alternativeTranslations type: ${typeof word.alternativeTranslations}`);
      }
    }
    
    await tx.done;
    db.close();
    
    return {
      isValid: issues.length === 0,
      issues,
      samplesChecked,
    };
  } catch (error) {
    console.error('[Validation] Error:', error);
    return {
      isValid: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
      samplesChecked,
    };
  }
}

// If running as a standalone script (in browser console or dev tools)
if (typeof window !== 'undefined' && (window as any).runMigration) {
  (window as any).migrateAlternativeTranslations = migrateAlternativeTranslations;
  (window as any).validateMigration = validateMigration;
  console.log('[Migration Script] Available commands:');
  console.log('  - window.migrateAlternativeTranslations() - Run the migration');
  console.log('  - window.validateMigration() - Validate the migration');
}
