'use client';

/**
 * Advanced filtering UI component
 * Provides comprehensive vocabulary filtering with multiple criteria
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import type {
  VocabularyFilterCriteria,
  VocabularySortBy,
} from '@/lib/utils/filtering';
import type { VocabularyStatus } from '@/lib/types';

interface AdvancedFilterProps {
  /** Available tags for filtering */
  availableTags: string[];
  
  /** Current filter criteria */
  criteria: VocabularyFilterCriteria;
  
  /** Current sort order */
  sortBy?: VocabularySortBy;
  
  /** Callback when filters change */
  onFilterChange: (criteria: VocabularyFilterCriteria) => void;
  
  /** Callback when sort changes */
  onSortChange: (sortBy: VocabularySortBy) => void;
  
  /** Callback to reset filters */
  onReset: () => void;
  
  /** Number of results matching current filters */
  resultCount?: number;
}

export function AdvancedFilter({
  availableTags,
  criteria,
  sortBy,
  onFilterChange,
  onSortChange,
  onReset,
  resultCount,
}: AdvancedFilterProps) {
  const [searchQuery, setSearchQuery] = useState(criteria.searchQuery || '');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Update search query when criteria changes externally
  useEffect(() => {
    setSearchQuery(criteria.searchQuery || '');
  }, [criteria.searchQuery]);
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange({ ...criteria, searchQuery: value });
  };
  
  const toggleStatus = (status: VocabularyStatus) => {
    const currentStatuses = criteria.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    
    onFilterChange({
      ...criteria,
      statuses: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };
  
  const toggleTag = (tag: string) => {
    const currentTags = criteria.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    
    onFilterChange({
      ...criteria,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };
  
  const toggleTagMode = () => {
    onFilterChange({
      ...criteria,
      requireAllTags: !criteria.requireAllTags,
    });
  };
  
  const handleDateRangeChange = (
    type: 'created' | 'updated',
    bound: 'start' | 'end',
    value: string
  ) => {
    const date = value ? new Date(value) : undefined;
    
    if (type === 'created') {
      const dateRange = criteria.dateRange || {};
      onFilterChange({
        ...criteria,
        dateRange: {
          ...dateRange,
          [bound]: date,
        },
      });
    } else {
      const updatedRange = criteria.updatedRange || {};
      onFilterChange({
        ...criteria,
        updatedRange: {
          ...updatedRange,
          [bound]: date,
        },
      });
    }
  };
  
  const toggleContentFilter = (
    filter: 'hasNotes' | 'hasExamples' | 'hasImages' | 'hasAudio'
  ) => {
    const currentValue = criteria[filter];
    onFilterChange({
      ...criteria,
      [filter]: currentValue === undefined ? true : currentValue ? false : undefined,
    });
  };
  
  const handleAccuracyThreshold = (bound: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) / 100 : undefined;
    const accuracyThreshold = criteria.accuracyThreshold || {};
    
    onFilterChange({
      ...criteria,
      accuracyThreshold: {
        ...accuracyThreshold,
        [bound]: numValue,
      },
    });
  };
  
  const activeFilterCount = [
    criteria.searchQuery,
    criteria.statuses?.length,
    criteria.tags?.length,
    criteria.dateRange?.start || criteria.dateRange?.end,
    criteria.updatedRange?.start || criteria.updatedRange?.end,
    criteria.hasNotes !== undefined,
    criteria.hasExamples !== undefined,
    criteria.hasImages !== undefined,
    criteria.hasAudio !== undefined,
    criteria.accuracyThreshold?.min || criteria.accuracyThreshold?.max,
  ].filter(Boolean).length;
  
  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by Spanish or English word, notes, examples..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {resultCount} {resultCount === 1 ? 'word' : 'words'} found
        </div>
      )}
      
      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['new', 'learning', 'mastered'] as VocabularyStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      criteria.statuses?.includes(status)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
          
          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                {criteria.tags && criteria.tags.length > 0 && (
                  <button
                    onClick={toggleTagMode}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Match {criteria.requireAllTags ? 'ALL' : 'ANY'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      criteria.tags?.includes(tag)
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Created Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={
                    criteria.dateRange?.start
                      ? new Date(criteria.dateRange.start).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    handleDateRangeChange('created', 'start', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={
                    criteria.dateRange?.end
                      ? new Date(criteria.dateRange.end).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    handleDateRangeChange('created', 'end', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="End date"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Updated Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={
                    criteria.updatedRange?.start
                      ? new Date(criteria.updatedRange.start)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    handleDateRangeChange('updated', 'start', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={
                    criteria.updatedRange?.end
                      ? new Date(criteria.updatedRange.end)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    handleDateRangeChange('updated', 'end', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
          
          {/* Content Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hasNotes' as const, label: 'Has Notes' },
                { key: 'hasExamples' as const, label: 'Has Examples' },
                { key: 'hasImages' as const, label: 'Has Images' },
                { key: 'hasAudio' as const, label: 'Has Audio' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleContentFilter(key)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    criteria[key] === true
                      ? 'bg-green-500 text-white border-green-500'
                      : criteria[key] === false
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                  {criteria[key] === false && ' (Missing)'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Accuracy Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Accuracy (%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    criteria.accuracyThreshold?.min
                      ? Math.round(criteria.accuracyThreshold.min * 100)
                      : ''
                  }
                  onChange={(e) =>
                    handleAccuracyThreshold('min', e.target.value)
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    criteria.accuracyThreshold?.max
                      ? Math.round(criteria.accuracyThreshold.max * 100)
                      : ''
                  }
                  onChange={(e) =>
                    handleAccuracyThreshold('max', e.target.value)
                  }
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy || ''}
              onChange={(e) =>
                onSortChange(e.target.value as VocabularySortBy)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Default</option>
              <option value="word-asc">Spanish Word (A-Z)</option>
              <option value="word-desc">Spanish Word (Z-A)</option>
              <option value="translation-asc">English Translation (A-Z)</option>
              <option value="translation-desc">English Translation (Z-A)</option>
              <option value="created-newest">Newest First</option>
              <option value="created-oldest">Oldest First</option>
              <option value="updated-newest">Recently Updated</option>
              <option value="updated-oldest">Least Recently Updated</option>
              <option value="status-asc">Status (New → Mastered)</option>
              <option value="status-desc">Status (Mastered → New)</option>
              <option value="accuracy-lowest">Accuracy (Lowest First)</option>
              <option value="accuracy-highest">Accuracy (Highest First)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

