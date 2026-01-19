/**
 * Import/Export utilities for vocabulary data
 * Supports CSV format and full database backup/restore
 */

import type {
  VocabularyWord,
  ReviewRecord,
  ReviewSession,
  DailyStats,
} from '@/lib/types';
import { getDB } from '@/lib/db/schema';
import { DB_CONFIG } from '@/lib/constants/app';
import {
  getAllVocabularyWords,
  createVocabularyWord,
} from '@/lib/db/vocabulary';
import { createReviewRecord, getAllReviews } from '@/lib/db/reviews';
import { getAllSessions } from '@/lib/db/sessions';
import { getAllStats } from '@/lib/db/stats';

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Include example sentences */
  includeExamples?: boolean;
  
  /** Include tags */
  includeTags?: boolean;
  
  /** Include notes */
  includeNotes?: boolean;
  
  /** Include metadata (dates, status) */
  includeMetadata?: boolean;
  
  /** Custom delimiter (default: comma) */
  delimiter?: string;
}

/**
 * CSV import result
 */
export interface CSVImportResult {
  /** Number of words successfully imported */
  successCount: number;
  
  /** Number of words that failed */
  failureCount: number;
  
  /** Number of words skipped (duplicates) */
  skippedCount: number;
  
  /** Errors encountered during import */
  errors: Array<{ row: number; error: string }>;
  
  /** IDs of imported words */
  importedIds: string[];
}

/**
 * Full database backup structure
 */
export interface DatabaseBackup {
  /** Backup metadata */
  metadata: {
    version: string;
    timestamp: number;
    wordCount: number;
    reviewCount: number;
  };
  
  /** Vocabulary words */
  vocabulary: VocabularyWord[];
  
  /** Review records */
  reviews: ReviewRecord[];
  
  /** Review sessions */
  sessions: ReviewSession[];
  
  /** Daily statistics */
  stats: DailyStats[];
}

/**
 * Exports vocabulary words to CSV format
 * 
 * @param words - Array of words to export
 * @param options - Export options
 * @returns CSV string
 */
export function exportToCSV(
  words: VocabularyWord[],
  options: CSVExportOptions = {}
): string {
  const {
    includeExamples = true,
    includeTags = true,
    includeNotes = true,
    includeMetadata = true,
    delimiter = ',',
  } = options;
  
  // Build CSV header
  const headers = [
    'Spanish Word',
    'English Translation',
    'Part of Speech',
    'Gender',
  ];
  
  if (includeExamples) {
    headers.push('Example Spanish', 'Example English');
  }
  
  if (includeTags) {
    headers.push('Tags');
  }
  
  if (includeNotes) {
    headers.push('Notes');
  }
  
  if (includeMetadata) {
    headers.push('Status', 'Created Date', 'Updated Date');
  }
  
  // Build CSV rows
  const rows = words.map((word) => {
    const row: string[] = [
      escapeCSV(word.spanishWord, delimiter),
      escapeCSV(word.englishTranslation, delimiter),
      escapeCSV(word.partOfSpeech || '', delimiter),
      escapeCSV(word.gender || '', delimiter),
    ];
    
    if (includeExamples) {
      const firstExample = word.examples[0];
      row.push(
        escapeCSV(firstExample?.spanish || '', delimiter),
        escapeCSV(firstExample?.english || '', delimiter)
      );
    }
    
    if (includeTags) {
      row.push(escapeCSV((word.tags || []).join('; '), delimiter));
    }
    
    if (includeNotes) {
      row.push(escapeCSV(word.notes || '', delimiter));
    }
    
    if (includeMetadata) {
      row.push(
        escapeCSV(word.status, delimiter),
        new Date(word.createdAt).toISOString(),
        new Date(word.updatedAt).toISOString()
      );
    }
    
    return row.join(delimiter);
  });
  
  // Combine header and rows
  return [headers.join(delimiter), ...rows].join('\n');
}

/**
 * Escapes a CSV field value
 * Wraps in quotes if contains delimiter, newline, or quotes
 * 
 * @param value - Value to escape
 * @param delimiter - CSV delimiter
 * @returns Escaped value
 */
function escapeCSV(value: string, delimiter: string): string {
  if (!value) return '';
  
  // Check if value needs escaping
  if (
    value.includes(delimiter) ||
    value.includes('\n') ||
    value.includes('"')
  ) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
}

/**
 * Parses a CSV field value
 * Handles quoted values and escaped quotes
 * 
 * @param value - Value to parse
 * @returns Unescaped value
 */
function unescapeCSV(value: string): string {
  if (!value) return '';
  
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
    // Unescape doubled quotes
    value = value.replace(/""/g, '"');
  }
  
  return value;
}

/**
 * Imports vocabulary words from CSV format
 * Validates and creates new words, skipping duplicates
 * 
 * @param csvContent - CSV string content
 * @param skipDuplicates - Skip words with duplicate Spanish words
 * @returns Promise resolving to import result
 */
export async function importFromCSV(
  csvContent: string,
  skipDuplicates = true
): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    errors: [],
    importedIds: [],
  };
  
  // Get existing words for duplicate checking
  const existingWords = skipDuplicates ? await getAllVocabularyWords() : [];
  const existingWordsSet = new Set(
    existingWords.map((w) => w.spanishWord.toLowerCase().trim())
  );
  
  // Parse CSV
  const lines = csvContent.split('\n').filter((line) => line.trim());
  
  if (lines.length < 2) {
    result.errors.push({ row: 0, error: 'CSV file is empty or has no data' });
    return result;
  }
  
  // Parse header (first line)
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Find required column indexes
  const spanishIdx = headers.findIndex((h) =>
    h.toLowerCase().includes('spanish')
  );
  const englishIdx = headers.findIndex((h) =>
    h.toLowerCase().includes('english') && h.toLowerCase().includes('translation')
  );
  
  if (spanishIdx === -1 || englishIdx === -1) {
    result.errors.push({
      row: 0,
      error: 'CSV must have "Spanish Word" and "English Translation" columns',
    });
    return result;
  }
  
  // Find optional column indexes
  const posIdx = headers.findIndex((h) =>
    h.toLowerCase().includes('part of speech')
  );
  const genderIdx = headers.findIndex((h) => h.toLowerCase().includes('gender'));
  const exampleSpanishIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('example') && h.toLowerCase().includes('spanish')
  );
  const exampleEnglishIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('example') && h.toLowerCase().includes('english')
  );
  const tagsIdx = headers.findIndex((h) => h.toLowerCase().includes('tags'));
  const notesIdx = headers.findIndex((h) => h.toLowerCase().includes('notes'));
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = i + 1; // Row number for error reporting (1-indexed, including header)
    
    try {
      const fields = parseCSVLine(line);
      
      // Get required fields
      const spanishWord = unescapeCSV(fields[spanishIdx] || '').trim();
      const englishTranslation = unescapeCSV(fields[englishIdx] || '').trim();
      
      if (!spanishWord || !englishTranslation) {
        throw new Error('Spanish word and English translation are required');
      }
      
      // Check for duplicates
      if (
        skipDuplicates &&
        existingWordsSet.has(spanishWord.toLowerCase())
      ) {
        result.skippedCount++;
        continue;
      }
      
      // Get optional fields
      const partOfSpeech =
        posIdx !== -1 ? unescapeCSV(fields[posIdx] || '').trim() : undefined;
      const gender =
        genderIdx !== -1
          ? unescapeCSV(fields[genderIdx] || '').trim()
          : undefined;
      const exampleSpanish =
        exampleSpanishIdx !== -1
          ? unescapeCSV(fields[exampleSpanishIdx] || '').trim()
          : undefined;
      const exampleEnglish =
        exampleEnglishIdx !== -1
          ? unescapeCSV(fields[exampleEnglishIdx] || '').trim()
          : undefined;
      const tagsStr =
        tagsIdx !== -1 ? unescapeCSV(fields[tagsIdx] || '').trim() : '';
      const notes =
        notesIdx !== -1 ? unescapeCSV(fields[notesIdx] || '').trim() : undefined;
      
      // Parse tags
      const tags = tagsStr
        ? tagsStr.split(';').map((t) => t.trim()).filter((t) => t)
        : [];
      
      // Build examples array
      const examples =
        exampleSpanish && exampleEnglish
          ? [{ spanish: exampleSpanish, english: exampleEnglish }]
          : [];
      
      // Create vocabulary word
      const newWord: VocabularyWord = {
        id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        spanishWord,
        englishTranslation,
        partOfSpeech: partOfSpeech as any,
        gender: gender as any,
        examples,
        tags,
        notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'new',
      };
      
      // Save to database
      await createVocabularyWord(newWord);
      
      result.successCount++;
      result.importedIds.push(newWord.id);
      existingWordsSet.add(spanishWord.toLowerCase());
    } catch (error) {
      result.failureCount++;
      result.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

/**
 * Parses a single CSV line into fields
 * Handles quoted fields and embedded delimiters
 * 
 * @param line - CSV line to parse
 * @param delimiter - CSV delimiter
 * @returns Array of field values
 */
function parseCSVLine(line: string, delimiter = ','): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Creates a full backup of the database
 * Includes all vocabulary, reviews, sessions, and stats
 * 
 * @returns Promise resolving to backup object
 */
export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  const vocabulary = await getAllVocabularyWords();
  const reviews = await getAllReviews();
  const sessions = await getAllSessions();
  const stats = await getAllStats();
  
  return {
    metadata: {
      version: '1.0',
      timestamp: Date.now(),
      wordCount: vocabulary.length,
      reviewCount: reviews.length,
    },
    vocabulary,
    reviews,
    sessions,
    stats,
  };
}

/**
 * Restores database from a backup
 * WARNING: This will clear existing data!
 * 
 * @param backup - Backup object to restore
 * @param merge - If true, merge with existing data instead of replacing
 * @returns Promise resolving to restore result
 */
export async function restoreDatabaseBackup(
  backup: DatabaseBackup,
  merge = false
): Promise<{
  vocabularyRestored: number;
  reviewsRestored: number;
  sessionsRestored: number;
  statsRestored: number;
  errors: string[];
}> {
  const result = {
    vocabularyRestored: 0,
    reviewsRestored: 0,
    sessionsRestored: 0,
    statsRestored: 0,
    errors: [] as string[],
  };
  
  const db = await getDB();
  
  // Clear existing data if not merging
  if (!merge) {
    try {
      const tx = db.transaction(
        [
          DB_CONFIG.STORES.VOCABULARY,
          DB_CONFIG.STORES.REVIEWS,
          DB_CONFIG.STORES.SESSIONS,
          DB_CONFIG.STORES.STATS,
        ],
        'readwrite'
      );
      
      await tx.objectStore(DB_CONFIG.STORES.VOCABULARY).clear();
      await tx.objectStore(DB_CONFIG.STORES.REVIEWS).clear();
      await tx.objectStore(DB_CONFIG.STORES.SESSIONS).clear();
      await tx.objectStore(DB_CONFIG.STORES.STATS).clear();
      
      await tx.done;
    } catch (error) {
      result.errors.push(
        `Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }
  }
  
  // Restore vocabulary
  for (const word of backup.vocabulary) {
    try {
      if (merge) {
        // Check if word exists
        const existing = await db.get(DB_CONFIG.STORES.VOCABULARY, word.id);
        if (existing) {
          // Skip or update based on timestamp
          if (word.updatedAt > existing.updatedAt) {
            await db.put(DB_CONFIG.STORES.VOCABULARY, word);
            result.vocabularyRestored++;
          }
        } else {
          await db.add(DB_CONFIG.STORES.VOCABULARY, word);
          result.vocabularyRestored++;
        }
      } else {
        await db.add(DB_CONFIG.STORES.VOCABULARY, word);
        result.vocabularyRestored++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to restore word ${word.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  // Restore reviews
  for (const review of backup.reviews) {
    try {
      if (merge) {
        const existing = await db.get(DB_CONFIG.STORES.REVIEWS, review.id);
        if (!existing) {
          await db.add(DB_CONFIG.STORES.REVIEWS, review);
          result.reviewsRestored++;
        }
      } else {
        await db.add(DB_CONFIG.STORES.REVIEWS, review);
        result.reviewsRestored++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to restore review ${review.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  // Restore sessions
  for (const session of backup.sessions) {
    try {
      if (merge) {
        const existing = await db.get(DB_CONFIG.STORES.SESSIONS, session.id);
        if (!existing) {
          await db.add(DB_CONFIG.STORES.SESSIONS, session);
          result.sessionsRestored++;
        }
      } else {
        await db.add(DB_CONFIG.STORES.SESSIONS, session);
        result.sessionsRestored++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to restore session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  // Restore stats
  for (const stat of backup.stats) {
    try {
      if (merge) {
        const existing = await db.get(DB_CONFIG.STORES.STATS, stat.date);
        if (!existing) {
          await db.add(DB_CONFIG.STORES.STATS, stat);
          result.statsRestored++;
        }
      } else {
        await db.add(DB_CONFIG.STORES.STATS, stat);
        result.statsRestored++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to restore stats ${stat.date}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return result;
}

/**
 * Downloads a backup as a JSON file
 * 
 * @param backup - Backup object to download
 * @param filename - Optional custom filename
 */
export function downloadBackup(
  backup: DatabaseBackup,
  filename?: string
): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename || `palabra-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Downloads words as a CSV file
 * 
 * @param words - Words to export
 * @param options - Export options
 * @param filename - Optional custom filename
 */
export function downloadCSV(
  words: VocabularyWord[],
  options?: CSVExportOptions,
  filename?: string
): void {
  const csv = exportToCSV(words, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename || `palabra-vocabulary-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

