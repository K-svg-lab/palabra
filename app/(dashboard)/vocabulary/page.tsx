/**
 * Vocabulary list page
 * Displays all saved vocabulary words with search and filter
 * 
 * @module app/(dashboard)/vocabulary/page
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Plus, X, Filter as FilterIcon } from 'lucide-react';
import Link from 'next/link';
import { VocabularyList } from '@/components/features/vocabulary-list';
import { VocabularyEntryFormEnhanced } from '@/components/features/vocabulary-entry-form-enhanced';
import { VocabularyEditModal } from '@/components/features/vocabulary-edit-modal';
import { AdvancedFilter } from '@/components/features/advanced-filter';
import { BulkOperationsPanel } from '@/components/features/bulk-operations-panel';
import { AppHeader } from '@/components/ui/app-header';
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
  const [initialWord, setInitialWord] = useState<string | undefined>(undefined);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);
  
  // User state
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Filter state
  const [filterCriteria, setFilterCriteria] = useState<VocabularyFilterCriteria>({});
  const [sortBy, setSortBy] = useState<VocabularySortBy | undefined>();
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Ref to clear search and refocus after adding word
  const clearSearchAndFocusRef = useRef<(() => void) | null>(null);
  
  const { data: vocabulary = [], refetch } = useVocabulary() as { data: VocabularyWord[]; refetch: () => void };

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setUserLoading(false);
      }
    }
    checkAuth();
  }, []);

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

  const handleAddNew = (word?: string) => {
    setInitialWord(word);
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setInitialWord(undefined);
    refetch();
    
    // Clear search box and refocus for next word entry
    if (clearSearchAndFocusRef.current) {
      clearSearchAndFocusRef.current();
    }
  };

  const handleEditSuccess = () => {
    setEditingWord(null);
    refetch();
  };
  
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setInitialWord(undefined);
  };
  
  const handleBulkOperationComplete = async () => {
    // Refetch to update UI immediately
    refetch();
    setSelectedIds([]);
    
    // Trigger background sync to persist changes to server
    try {
      const { getSyncService } = await import('@/lib/services/sync');
      const syncService = getSyncService();
      syncService.sync('incremental').catch((error) => {
        console.warn('Background sync after bulk operation failed:', error);
      });
    } catch (error) {
      console.warn('Failed to trigger sync after bulk operation:', error);
    }
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
        handleAddNew();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, editingWord]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <AppHeader
        icon="📚"
        title="Vocabulary"
        subtitle={`${filteredWords.length} of ${vocabulary.length} ${vocabulary.length === 1 ? 'word' : 'words'}`}
        showProfile={true}
        actions={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Filter"
            >
              <FilterIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Add word"
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        }
      />

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
          <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
            <VocabularyList
              onAddNew={handleAddNew}
              onEdit={(word) => setEditingWord(word)}
              clearSearchAndFocusRef={clearSearchAndFocusRef}
            />
          </Suspense>
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
                onClick={handleCloseAddModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <VocabularyEntryFormEnhanced
                initialWord={initialWord}
                onSuccess={handleAddSuccess}
                onCancel={handleCloseAddModal}
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

