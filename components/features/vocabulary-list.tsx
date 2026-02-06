/**
 * Vocabulary List Component
 * 
 * Displays all vocabulary words with search, filter, and sort functionality.
 * 
 * @module components/features/vocabulary-list
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Plus } from 'lucide-react';
import { VocabularyCard } from './vocabulary-card';
import { VocabularyCardEnhanced } from './vocabulary-card-enhanced';
import { VocabularyCardSkeleton } from '@/components/ui/vocabulary-card-skeleton';
import { SearchBarEnhanced } from '@/components/ui/search-bar-enhanced';
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle';
import { useVocabulary, useDeleteVocabulary } from '@/lib/hooks/use-vocabulary';
import { useVoiceInput } from '@/lib/hooks/use-voice-input';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import type { VocabularyWord } from '@/lib/types/vocabulary';

interface Props {
  onAddNew?: (initialWord?: string) => void;
  onEdit?: (word: VocabularyWord) => void;
  clearSearchAndFocusRef?: React.MutableRefObject<(() => void) | null>;
}

export function VocabularyList({ onAddNew, onEdit, clearSearchAndFocusRef }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const { data: vocabulary = [], isLoading } = useVocabulary() as { data: VocabularyWord[]; isLoading: boolean };
  const deleteMutation = useDeleteVocabulary();

  // Voice input hook
  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    language: 'auto', // Auto-detect Spanish or English
    continuous: false,
    interimResults: true,
    onResult: (text, confidence) => {
      // When we get a final result, set it as search term
      console.log('Voice input result:', text, 'Confidence:', confidence);
      const cleanedText = text.toLowerCase().trim();
      setSearchTerm(cleanedText);
      
      // Check if word exists in vocabulary
      const wordExists = vocabulary.some(
        word => word.spanishWord.toLowerCase() === cleanedText || 
                word.englishTranslation.toLowerCase() === cleanedText
      );

      // Auto-trigger add word if it doesn't exist and we have high confidence
      if (!wordExists && confidence > 0.5 && onAddNew && cleanedText.length > 0) {
        setTimeout(() => {
          onAddNew(cleanedText);
        }, 300);
      } else {
        // Just focus the input if word exists or confidence is low
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    },
  });

  // Auto-focus search box when navigating from "Add New Word" buttons
  useEffect(() => {
    const shouldFocus = searchParams.get('focus') === 'search';
    if (shouldFocus && searchInputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        // Trigger keyboard on mobile
        searchInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Expose clearSearchAndFocus method to parent component
  useEffect(() => {
    if (clearSearchAndFocusRef) {
      clearSearchAndFocusRef.current = () => {
        setSearchTerm('');
        resetTranscript();
        setTimeout(() => {
          searchInputRef.current?.focus();
          // Trigger keyboard on mobile
          searchInputRef.current?.click();
        }, 100);
      };
    }
  }, [clearSearchAndFocusRef, resetTranscript]);

  // Handle voice input button click
  const handleVoiceInputClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Update search term when transcript changes (for interim results)
  useEffect(() => {
    if (transcript && isListening) {
      setSearchTerm(transcript.toLowerCase());
    }
  }, [transcript, isListening]);

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      if (onAddNew && searchTerm.trim().length > 0) {
        // Blur search input to close mobile keyboard before opening modal
        searchInputRef.current?.blur();
        setTimeout(() => {
          onAddNew(searchTerm.trim());
        }, 50);
      }
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
            ref={searchInputRef}
            type="search"
            inputMode="search"
            enterKeyHint="go"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search Spanish or English..."
            className={`w-full pl-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent ${
              isVoiceSupported ? 'pr-12' : 'pr-4'
            }`}
          />
          
          {/* Voice Input Button */}
          {isVoiceSupported && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <VoiceInputButton
                isListening={isListening}
                isSupported={isVoiceSupported}
                onClick={handleVoiceInputClick}
              />
            </div>
          )}
        </div>

        {/* Voice Input Error */}
        {voiceError && (
          <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
            {voiceError}
          </div>
        )}

        {/* Voice Input Status */}
        {isListening && (
          <div className="text-sm text-accent bg-accent/10 px-3 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
            <span>Listening... Speak now</span>
          </div>
        )}

        {/* Filters and View Toggle - Phase 16.4 Enhanced - Mobile Optimized */}
        <div className="space-y-3">
          {/* Row 1: Filter Pills (full width on mobile) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          {/* Row 2: Sort and View Controls */}
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black flex-1 min-w-0"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
            
            {/* View Toggle - Hidden on mobile, visible on tablet+ */}
            <div className="hidden sm:flex">
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
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
              onClick={() => onAddNew()}
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

      {/* Vocabulary Grid - Phase 16.4 Enhanced - Mobile Optimized */}
      {filteredVocabulary.length > 0 && (
        <div className={
          viewMode === 'grid' 
            ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full' 
            : 'space-y-4 w-full'
        }>
          {filteredVocabulary.map(word => (
            <VocabularyCardEnhanced
              key={word.id}
              word={word}
              onEdit={onEdit}
              onDelete={(word) => setShowDeleteConfirm(word.id)}
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

