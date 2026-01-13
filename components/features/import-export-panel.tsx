'use client';

/**
 * Import/Export panel component
 * Provides UI for importing/exporting vocabulary data and backups
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  Database,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import {
  importFromCSV,
  createDatabaseBackup,
  restoreDatabaseBackup,
  downloadBackup,
  downloadCSV,
  type DatabaseBackup,
  type CSVImportResult,
} from '@/lib/utils/import-export';
import { getAllVocabularyWords } from '@/lib/db/vocabulary';

interface ImportExportPanelProps {
  /** Callback when import/restore completes */
  onDataChanged: () => void;
}

export function ImportExportPanel({ onDataChanged }: ImportExportPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setImportResult(null);
    
    try {
      const text = await file.text();
      const result = await importFromCSV(text, true);
      
      setImportResult(result);
      
      if (result.successCount > 0) {
        setSuccess(
          `Successfully imported ${result.successCount} word${
            result.successCount === 1 ? '' : 's'
          }${
            result.skippedCount > 0
              ? ` (${result.skippedCount} duplicate${
                  result.skippedCount === 1 ? '' : 's'
                } skipped)`
              : ''
          }`
        );
        onDataChanged();
      }
      
      if (result.failureCount > 0) {
        setError(
          `${result.failureCount} row${
            result.failureCount === 1 ? '' : 's'
          } failed to import. Check the console for details.`
        );
        console.error('Import errors:', result.errors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setIsProcessing(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };
  
  const handleCSVExport = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const words = await getAllVocabularyWords();
      
      if (words.length === 0) {
        setError('No vocabulary words to export');
        return;
      }
      
      downloadCSV(words, {
        includeExamples: true,
        includeTags: true,
        includeNotes: true,
        includeMetadata: true,
      });
      
      setSuccess(`Exported ${words.length} word${words.length === 1 ? '' : 's'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBackupCreate = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const backup = await createDatabaseBackup();
      downloadBackup(backup);
      
      setSuccess(
        `Backup created with ${backup.metadata.wordCount} word${
          backup.metadata.wordCount === 1 ? '' : 's'
        } and ${backup.metadata.reviewCount} review${
          backup.metadata.reviewCount === 1 ? '' : 's'
        }`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBackupRestore = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Confirm before restoring
    const confirmed = window.confirm(
      'This will replace all your current vocabulary data with the backup. Are you sure?'
    );
    
    if (!confirmed) {
      if (backupInputRef.current) {
        backupInputRef.current.value = '';
      }
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const text = await file.text();
      const backup: DatabaseBackup = JSON.parse(text);
      
      const result = await restoreDatabaseBackup(backup, false);
      
      if (result.errors.length > 0) {
        setError(
          `Restored with errors. ${result.vocabularyRestored} words restored. Check console for details.`
        );
        console.error('Restore errors:', result.errors);
      } else {
        setSuccess(
          `Successfully restored ${result.vocabularyRestored} word${
            result.vocabularyRestored === 1 ? '' : 's'
          }, ${result.reviewsRestored} review${
            result.reviewsRestored === 1 ? '' : 's'
          }, and ${result.sessionsRestored} session${
            result.sessionsRestored === 1 ? '' : 's'
          }`
        );
      }
      
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsProcessing(false);
      if (backupInputRef.current) {
        backupInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Import Result Details */}
      {importResult && importResult.errors.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Import Errors
              </h3>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 max-h-40 overflow-y-auto">
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <div key={i}>
                    Row {err.row}: {err.error}
                  </div>
                ))}
                {importResult.errors.length > 10 && (
                  <div className="font-medium">
                    ... and {importResult.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CSV Import/Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CSV Import/Export
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import vocabulary from a CSV file or export your current vocabulary to CSV
          format for backup or use in other applications.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          
          <button
            onClick={handleCSVExport}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
        
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVImport}
          className="hidden"
        />
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>CSV Format:</strong> Your CSV should have columns for "Spanish
            Word" and "English Translation" (required), plus optional columns for
            "Part of Speech", "Gender", "Example Spanish", "Example English", "Tags",
            and "Notes".
          </p>
        </div>
      </div>
      
      {/* Database Backup/Restore Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Full Database Backup
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Create a complete backup of all your vocabulary, review history, sessions,
          and statistics. This backup can be used to restore your data completely.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBackupCreate}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Create Backup
          </button>
          
          <button
            onClick={() => backupInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            Restore Backup
          </button>
        </div>
        
        <input
          ref={backupInputRef}
          type="file"
          accept=".json"
          onChange={handleBackupRestore}
          className="hidden"
        />
        
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300">
            <strong>Warning:</strong> Restoring a backup will replace ALL your current
            data. Make sure to create a backup of your current data before restoring.
          </p>
        </div>
      </div>
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-gray-900 dark:text-white font-medium">
                Processing...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

