/**
 * Vocabulary list page
 * Displays all saved vocabulary words with search and filter
 * 
 * @module app/(dashboard)/vocabulary/page
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Filter as FilterIcon } from 'lucide-react';
import { VocabularyList } from '@/components/features/vocabulary-list';
import { VocabularyEntryFormEnhanced } from '@/components/features/vocabulary-entry-form-enhanced';
import { VocabularyEditModal } from '@/components/features/vocabulary-edit-modal';
import { AdvancedFilter } from '@/components/features/advanced-filter';
import { BulkOperationsPanel } from '@/components/features/bulk-operations-panel';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { filterVocabulary, type VocabularyFilterCriteria, type VocabularySortBy } from '@/lib/utils/filtering';
import { getAllTags } from '@/lib/db/tags';
import type { VocabularyWord } from '@/lib/types/vocabulary';

/**
 * Vocabulary page component
 * Shows list of all vocabulary words with add/edit functionality
 * 
 * @returns Vocabulary page
 */
export default function VocabularyPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);
  
  // Filter state
  const [filterCriteria, setFilterCriteria] = useState<VocabularyFilterCriteria>({});
  const [sortBy, setSortBy] = useState<VocabularySortBy | undefined>();
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { data: vocabulary = [], refetch } = useVocabulary();

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags);
    };
    loadTags();
  }, [vocabulary]);

  // Apply filters whenever vocabulary or filter criteria changes
  useEffect(() => {
    const applyFilters = async () => {
      if (Object.keys(filterCriteria).length === 0 && !sortBy) {
        setFilteredWords(vocabulary);
      } else {
        const filtered = await filterVocabulary(filterCriteria, sortBy);
        setFilteredWords(filtered);
      }
    };
    applyFilters();
  }, [vocabulary, filterCriteria, sortBy]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingWord(null);
    refetch();
  };
  
  const handleBulkOperationComplete = () => {
    refetch();
    setSelectedIds([]);
  };
  
  const handleResetFilters = () => {
    setFilterCriteria({});
    setSortBy(undefined);
  };
  
  const displayWords = showBulkOps ? filteredWords : filteredWords;

  // Keyboard shortcut: Shift+A to add new word
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'A' && !showAddModal && !editingWord) {
        e.preventDefault();
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, editingWord]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Vocabulary</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredWords.length} of {vocabulary.length} {vocabulary.length === 1 ? 'word' : 'words'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
              aria-label="Toggle filters"
            >
              <FilterIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkOps(!showBulkOps)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                showBulkOps
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
            >
              <span className="hidden sm:inline">Bulk</span>
              <span className="sm:hidden">📦</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors shadow-lg"
              aria-label="Add new word"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Advanced Filter */}
        {showFilters && (
          <AdvancedFilter
            availableTags={availableTags}
            criteria={filterCriteria}
            sortBy={sortBy}
            onFilterChange={setFilterCriteria}
            onSortChange={setSortBy}
            onReset={handleResetFilters}
            resultCount={filteredWords.length}
          />
        )}
        
        {/* Bulk Operations Panel */}
        {showBulkOps && (
          <BulkOperationsPanel
            words={filteredWords}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onOperationComplete={handleBulkOperationComplete}
            availableTags={availableTags}
          />
        )}
        
        {/* Vocabulary List */}
        {!showBulkOps && (
          <VocabularyList
            onAddNew={() => setShowAddModal(true)}
            onEdit={(word) => setEditingWord(word)}
          />
        )}
      </div>

      {/* Add New Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Word</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <VocabularyEntryFormEnhanced
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Word Modal */}
      {editingWord && (
        <VocabularyEditModal
          word={editingWord}
          isOpen={!!editingWord}
          onClose={() => setEditingWord(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

