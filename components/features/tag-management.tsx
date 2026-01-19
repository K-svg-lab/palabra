'use client';

/**
 * Tag management component
 * Provides UI for managing tags (rename, delete, merge)
 */

import React, { useState, useEffect } from 'react';
import { Tag, Edit, Trash2, GitMerge, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getAllTags,
  getTagStats,
  renameTag,
  deleteTag,
  mergeTags,
  type TagStats,
} from '@/lib/db/tags';

interface TagManagementProps {
  /** Callback when tags are modified */
  onTagsChanged: () => void;
}

export function TagManagement({ onTagsChanged }: TagManagementProps) {
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modals
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  
  // Modal state
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagsForMerge, setSelectedTagsForMerge] = useState<string[]>([]);
  const [mergeTargetTag, setMergeTargetTag] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    loadTags();
  }, []);
  
  const loadTags = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await getTagStats('count');
      setTagStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRename = async () => {
    if (!selectedTag || !newTagName.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const count = await renameTag(selectedTag, newTagName.trim());
      setSuccess(`Renamed tag in ${count} word${count === 1 ? '' : 's'}`);
      setShowRenameModal(false);
      setSelectedTag('');
      setNewTagName('');
      await loadTags();
      onTagsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename tag');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedTag) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const count = await deleteTag(selectedTag);
      setSuccess(`Removed tag from ${count} word${count === 1 ? '' : 's'}`);
      setShowDeleteModal(false);
      setSelectedTag('');
      await loadTags();
      onTagsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMerge = async () => {
    if (selectedTagsForMerge.length < 2 || !mergeTargetTag.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const count = await mergeTags(selectedTagsForMerge, mergeTargetTag.trim());
      setSuccess(
        `Merged ${selectedTagsForMerge.length} tags into "${mergeTargetTag}" (${count} word${
          count === 1 ? '' : 's'
        } updated)`
      );
      setShowMergeModal(false);
      setSelectedTagsForMerge([]);
      setMergeTargetTag('');
      await loadTags();
      onTagsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge tags');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const openRenameModal = (tag: string) => {
    setSelectedTag(tag);
    setNewTagName(tag);
    setShowRenameModal(true);
  };
  
  const openDeleteModal = (tag: string) => {
    setSelectedTag(tag);
    setShowDeleteModal(true);
  };
  
  const toggleTagForMerge = (tag: string) => {
    setSelectedTagsForMerge((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
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
      
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {tagStats.length} Tag{tagStats.length === 1 ? '' : 's'}
        </h3>
        
        <button
          onClick={() => setShowMergeModal(true)}
          disabled={tagStats.length < 2}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <GitMerge className="h-4 w-4" />
          Merge Tags
        </button>
      </div>
      
      {/* Tags List */}
      {tagStats.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No tags yet</p>
          <p className="text-sm mt-1">Tags will appear here when you add them to words</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tagStats.map((stat) => (
            <div
              key={stat.tag}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {stat.tag}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.count} word{stat.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openRenameModal(stat.tag)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Rename tag"
                >
                  <Edit className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => openDeleteModal(stat.tag)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete tag"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Rename Tag
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Name
                </label>
                <input
                  type="text"
                  value={selectedTag}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Name
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter new tag name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setSelectedTag('');
                  setNewTagName('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={isProcessing || !newTagName.trim() || newTagName === selectedTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Tag
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the tag "{selectedTag}"? This will remove
              it from all words. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTag('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Merge Tags
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select tags to merge (minimum 2)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                  {tagStats.map((stat) => (
                    <button
                      key={stat.tag}
                      onClick={() => toggleTagForMerge(stat.tag)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        selectedTagsForMerge.includes(stat.tag)
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {stat.tag} ({stat.count})
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target tag name
                </label>
                <input
                  type="text"
                  value={mergeTargetTag}
                  onChange={(e) => setMergeTargetTag(e.target.value)}
                  placeholder="Enter target tag name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All selected tags will be merged into this tag
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setSelectedTagsForMerge([]);
                  setMergeTargetTag('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                disabled={
                  isProcessing ||
                  selectedTagsForMerge.length < 2 ||
                  !mergeTargetTag.trim()
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Merging...' : 'Merge Tags'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

