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
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Vocabulary</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredWords.length} of {vocabulary.length} {vocabulary.length === 1 ? 'word' : 'words'}
            </p>
          </div>
          
          {/* User Icon */}
          {!userLoading && (
            <Link
              href={user ? "/settings" : "/signin"}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
              title={user ? `Signed in as ${user.name || user.email}` : 'Sign in to sync across devices'}
            >
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {user.name || user.email.split('@')[0]}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Sign In</span>
                </>
              )}
            </Link>
          )}
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

