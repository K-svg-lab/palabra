/**
 * Vocabulary List Component
 * 
 * Displays all vocabulary words with search, filter, and sort functionality.
 * 
 * @module components/features/vocabulary-list
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { VocabularyCard } from './vocabulary-card';
import { useVocabulary, useDeleteVocabulary } from '@/lib/hooks/use-vocabulary';
import type { VocabularyWord } from '@/lib/types/vocabulary';

interface Props {
  onAddNew?: () => void;
  onEdit?: (word: VocabularyWord) => void;
}

export function VocabularyList({ onAddNew, onEdit }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { data: vocabulary = [], isLoading } = useVocabulary();
  const deleteMutation = useDeleteVocabulary();

  // Filter and sort vocabulary
  const filteredVocabulary = useMemo(() => {
    let filtered = [...vocabulary];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        word =>
          word.spanishWord.toLowerCase().includes(search) ||
          word.englishTranslation.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(word => word.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.spanishWord.localeCompare(b.spanishWord);
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

    return filtered;
  }, [vocabulary, searchTerm, filterStatus, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Spanish or English..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('new')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
              filterStatus === 'new'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('learning')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
              filterStatus === 'learning'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Learning
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('mastered')}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
              filterStatus === 'mastered'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Mastered
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredVocabulary.length} {filteredVocabulary.length === 1 ? 'word' : 'words'}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Empty State */}
      {filteredVocabulary.length === 0 && !searchTerm && vocabulary.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No vocabulary yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start building your Spanish vocabulary by adding your first word.
          </p>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
            >
              Add First Word
            </button>
          )}
        </div>
      )}

      {/* No Search Results */}
      {filteredVocabulary.length === 0 && (searchTerm || filterStatus !== 'all') && vocabulary.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No words match your search or filter criteria.
          </p>
        </div>
      )}

      {/* Vocabulary Grid */}
      {filteredVocabulary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredVocabulary.map(word => (
            <VocabularyCard
              key={word.id}
              word={word}
              onEdit={onEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Word?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this word? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

