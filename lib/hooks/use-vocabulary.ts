/**
 * Vocabulary Hooks
 * 
 * Custom React hooks for vocabulary CRUD operations using TanStack Query
 * and IndexedDB storage.
 * 
 * @module lib/hooks/use-vocabulary
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { VocabularyWord } from '@/lib/types/vocabulary';
import {
  getAllVocabularyWords,
  getVocabularyWord,
  createVocabularyWord,
  updateVocabularyWord,
  deleteVocabularyWord,
  searchVocabulary,
} from '@/lib/db/vocabulary';

/**
 * Hook to fetch all vocabulary words
 */
export function useVocabulary() {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      const words = await getAllVocabularyWords();
      return words;
    },
  });
}

/**
 * Hook to fetch a single vocabulary word by ID
 */
export function useVocabularyWord(id: string) {
  return useQuery({
    queryKey: ['vocabulary', id],
    queryFn: () => getVocabularyWord(id),
    enabled: !!id,
  });
}

/**
 * Hook to search vocabulary words
 */
export function useSearchVocabulary(searchTerm: string) {
  return useQuery({
    queryKey: ['vocabulary', 'search', searchTerm],
    queryFn: () => searchVocabulary(searchTerm),
    enabled: searchTerm.length > 0,
  });
}

/**
 * Hook to add a new vocabulary word
 */
export function useAddVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now();
      const newWord: VocabularyWord = {
        ...word,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      
      return createVocabularyWord(newWord);
    },
    onSuccess: async () => {
      // Invalidate and refetch vocabulary list
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      
      // Trigger immediate sync to prevent data loss in incognito mode
      // IndexedDB can be cleared when browser closes in private browsing
      try {
        const { getSyncService } = await import('@/lib/services/sync');
        const syncService = getSyncService();
        // Trigger sync without awaiting to avoid blocking UI
        syncService.sync('incremental').catch((error) => {
          console.warn('Background sync after vocabulary creation failed:', error);
        });
      } catch (error) {
        console.warn('Failed to trigger sync after vocabulary creation:', error);
      }
    },
  });
}

/**
 * Hook to update an existing vocabulary word
 */
export function useUpdateVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<VocabularyWord>;
    }) => {
      const existingWord = await getVocabularyWord(id);
      if (!existingWord) {
        throw new Error('Word not found');
      }
      
      const updatedWord: VocabularyWord = {
        ...existingWord,
        ...updates,
        updatedAt: Date.now(),
      };
      
      return updateVocabularyWord(updatedWord);
    },
    onSuccess: async (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({ queryKey: ['vocabulary', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      
      // Trigger immediate sync to prevent data loss
      try {
        const { getSyncService } = await import('@/lib/services/sync');
        const syncService = getSyncService();
        
        // Trigger sync without awaiting to avoid blocking UI
        syncService.sync('incremental').catch((error) => {
          console.warn('Background sync after vocabulary update failed:', error);
        });
      } catch (error) {
        console.warn('Failed to trigger sync after vocabulary update:', error);
      }
    },
  });
}

/**
 * Hook to delete a vocabulary word
 */
export function useDeleteVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteVocabularyWord(id);
    },
    onSuccess: async (_, deletedId) => {
      // Invalidate vocabulary list to immediately update UI
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      
      // Trigger background sync without blocking UI
      try {
        const { getSyncService } = await import('@/lib/services/sync');
        const syncService = getSyncService();
        
        // Trigger sync without awaiting to avoid blocking UI
        syncService.sync('incremental').catch((error) => {
          console.error('Background sync after vocabulary deletion failed:', error);
        });
      } catch (error) {
        console.warn('Failed to trigger sync after vocabulary deletion:', error);
      }
    },
  });
}

/**
 * Hook to lookup vocabulary from API
 */
export function useLookupVocabulary() {
  return useMutation({
    mutationFn: async (word: string) => {
      const response = await fetch('/api/vocabulary/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        throw new Error('Failed to lookup vocabulary');
      }

      return response.json();
    },
  });
}

/**
 * Hook to get vocabulary statistics
 */
export function useVocabularyStats() {
  return useQuery({
    queryKey: ['vocabulary', 'stats'],
    queryFn: async () => {
      const all = await getAllVocabularyWords();
      
      const stats = {
        total: all.length,
        new: all.filter(w => w.status === 'new').length,
        learning: all.filter(w => w.status === 'learning').length,
        mastered: all.filter(w => w.status === 'mastered').length,
      };
      
      return stats;
    },
  });
}

