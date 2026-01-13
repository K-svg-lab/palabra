'use client';

/**
 * Bulk operations panel component
 * Provides UI for selecting and performing bulk actions on vocabulary words
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Download,
  Copy,
  Tag,
  AlertCircle,
} from 'lucide-react';
import type { VocabularyWord, VocabularyStatus } from '@/lib/types';
import {
  bulkEditWords,
  bulkDeleteWords,
  bulkDuplicateWords,
  type BulkEditOperation,
} from '@/lib/utils/bulk-operations';
import { downloadCSV } from '@/lib/utils/import-export';

interface BulkOperationsPanelProps {
  /** All available words */
  words: VocabularyWord[];
  
  /** Currently selected word IDs */
  selectedIds: string[];
  
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;
  
  /** Callback when operation completes */
  onOperationComplete: () => void;
  
  /** Available tags for bulk editing */
  availableTags: string[];
}

type BulkAction = 'edit' | 'delete' | 'export' | 'duplicate';

export function BulkOperationsPanel({
  words,
  selectedIds,
  onSelectionChange,
  onOperationComplete,
  availableTags,
}: BulkOperationsPanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit form state
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [statusToSet, setStatusToSet] = useState<VocabularyStatus | ''>('');
  const [notesAction, setNotesAction] = useState<'none' | 'append' | 'replace' | 'clear'>('none');
  const [notesContent, setNotesContent] = useState('');
  
  const allSelected = words.length > 0 && selectedIds.length === words.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < words.length;
  
  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(words.map((w) => w.id));
    }
  };
  
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };
  
  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const operations: BulkEditOperation = {};
      
      if (tagsToAdd.length > 0) {
        operations.addTags = tagsToAdd;
      }
      
      if (tagsToRemove.length > 0) {
        operations.removeTags = tagsToRemove;
      }
      
      if (statusToSet) {
        operations.setStatus = statusToSet;
      }
      
      switch (notesAction) {
        case 'append':
          if (notesContent) operations.appendNotes = notesContent;
          break;
        case 'replace':
          operations.replaceNotes = notesContent;
          break;
        case 'clear':
          operations.clearNotes = true;
          break;
      }
      
      const result = await bulkEditWords(selectedIds, operations);
      
      if (result.failureCount > 0) {
        setError(
          `${result.successCount} words updated, ${result.failureCount} failed`
        );
      }
      
      setShowEditModal(false);
      resetEditForm();
      onOperationComplete();
      onSelectionChange([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit words');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await bulkDeleteWords(selectedIds);
      
      if (result.failureCount > 0) {
        setError(
          `${result.successCount} words deleted, ${result.failureCount} failed`
        );
      }
      
      setShowDeleteConfirm(false);
      onOperationComplete();
      onSelectionChange([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete words');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    
    const wordsToExport = words.filter((w) => selectedIds.includes(w.id));
    downloadCSV(wordsToExport, {
      includeExamples: true,
      includeTags: true,
      includeNotes: true,
      includeMetadata: true,
    });
  };
  
  const handleBulkDuplicate = async () => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await bulkDuplicateWords(selectedIds);
      
      if (result.failureCount > 0) {
        setError(
          `${result.successCount} words duplicated, ${result.failureCount} failed`
        );
      }
      
      onOperationComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate words');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetEditForm = () => {
    setTagsToAdd([]);
    setTagsToRemove([]);
    setStatusToSet('');
    setNotesAction('none');
    setNotesContent('');
  };
  
  return (
    <div className="space-y-4">
      {/* Selection Bar */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {allSelected ? (
              <CheckSquare className="h-5 w-5 text-blue-500" />
            ) : someSelected ? (
              <CheckSquare className="h-5 w-5 text-blue-300" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            {selectedIds.length === 0
              ? 'Select All'
              : `${selectedIds.length} selected`}
          </button>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={handleBulkDuplicate}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Error Message */}
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
      
      {/* Word List with Checkboxes */}
      <div className="space-y-2">
        {words.map((word) => (
          <div
            key={word.id}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-lg transition-colors ${
              selectedIds.includes(word.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <button
              onClick={() => toggleSelect(word.id)}
              className="flex-shrink-0"
            >
              {selectedIds.includes(word.id) ? (
                <CheckSquare className="h-5 w-5 text-blue-500" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {word.spanishWord}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {word.englishTranslation}
                </span>
              </div>
              {word.tags && word.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {word.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  word.status === 'new'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : word.status === 'learning'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {word.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit {selectedIds.length} Words
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
              
              {/* Add Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setTagsToAdd((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        tagsToAdd.includes(tag)
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Remove Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remove Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setTagsToRemove((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        tagsToRemove.includes(tag)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Set Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set Status
                </label>
                <select
                  value={statusToSet}
                  onChange={(e) => setStatusToSet(e.target.value as VocabularyStatus | '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No change</option>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>
              
              {/* Notes Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes Action
                </label>
                <select
                  value={notesAction}
                  onChange={(e) => setNotesAction(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2"
                >
                  <option value="none">No change</option>
                  <option value="append">Append</option>
                  <option value="replace">Replace</option>
                  <option value="clear">Clear</option>
                </select>
                
                {(notesAction === 'append' || notesAction === 'replace') && (
                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    placeholder="Enter notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEdit}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Updating...' : 'Update Words'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedIds.length} word
              {selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

