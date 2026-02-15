/**
 * Vocabulary Edit Modal Component
 * 
 * Modal dialog for editing existing vocabulary words.
 * 
 * @module components/features/vocabulary-edit-modal
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Check, Volume2 } from 'lucide-react';
import { useUpdateVocabulary } from '@/lib/hooks/use-vocabulary';
import { playAudio } from '@/lib/services/audio';
import type { VocabularyWord, Gender, PartOfSpeech } from '@/lib/types/vocabulary';

interface Props {
  word: VocabularyWord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  spanishWord: string;
  englishTranslation: string;
  gender?: Gender;
  partOfSpeech?: PartOfSpeech;
  exampleSpanish?: string;
  exampleEnglish?: string;
  notes?: string;
}

export function VocabularyEditModal({ word, isOpen, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      spanishWord: word.spanishWord,
      englishTranslation: word.englishTranslation,
      gender: word.gender,
      partOfSpeech: word.partOfSpeech,
      exampleSpanish: word.examples[0]?.spanish || '',
      exampleEnglish: word.examples[0]?.english || '',
      notes: word.notes || '',
    },
  });

  const updateMutation = useUpdateVocabulary();

  // Reset form when word changes
  useEffect(() => {
    reset({
      spanishWord: word.spanishWord,
      englishTranslation: word.englishTranslation,
      gender: word.gender,
      partOfSpeech: word.partOfSpeech,
      exampleSpanish: word.examples[0]?.spanish || '',
      exampleEnglish: word.examples[0]?.english || '',
      notes: word.notes || '',
    });
  }, [word, reset]);

  const handlePlayAudio = () => {
    playAudio(word.audioUrl || '', word.spanishWord);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const updates: Partial<VocabularyWord> = {
        spanishWord: data.spanishWord.trim(),
        englishTranslation: data.englishTranslation.trim(),
        gender: data.gender,
        partOfSpeech: data.partOfSpeech,
        examples: data.exampleSpanish && data.exampleEnglish ? [
          {
            spanish: data.exampleSpanish,
            english: data.exampleEnglish,
          },
        ] : [],
        notes: data.notes || '',
      };

      await updateMutation.mutateAsync({ id: word.id, updates });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[calc(100dvh-80px)] sm:max-h-[85dvh] mb-16 sm:mb-0 overflow-hidden flex flex-col shadow-xl animate-slideIn">
        {/* Header - Fixed with safe area support */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between safe-top">
          <h2 className="text-xl font-semibold">Edit Vocabulary Word</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-150"
            aria-label="Close"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable with safe area support */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-8 safe-bottom space-y-6">
          {/* Spanish Word */}
          <div className="space-y-2">
            <label htmlFor="edit-spanishWord" className="block text-sm font-medium">
              Spanish Word *
            </label>
            <div className="flex gap-2">
              <input
                id="edit-spanishWord"
                type="text"
                {...register('spanishWord', { required: 'Spanish word is required' })}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                type="button"
                onClick={handlePlayAudio}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Play pronunciation"
              >
                <Volume2 className="w-5 h-5 text-accent" />
              </button>
            </div>
            {errors.spanishWord && (
              <p className="text-sm text-error">{errors.spanishWord.message}</p>
            )}
          </div>

          {/* English Translation */}
          <div className="space-y-2">
            <label htmlFor="edit-englishTranslation" className="block text-sm font-medium">
              English Translation *
            </label>
            <input
              id="edit-englishTranslation"
              type="text"
              {...register('englishTranslation', { required: 'Translation is required' })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {errors.englishTranslation && (
              <p className="text-sm text-error">{errors.englishTranslation.message}</p>
            )}
          </div>

          {/* Gender and Part of Speech */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-gender" className="block text-sm font-medium">
                Gender
              </label>
              <select
                id="edit-gender"
                {...register('gender')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="">Not specified</option>
                <option value="masculine">Masculine</option>
                <option value="feminine">Feminine</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-partOfSpeech" className="block text-sm font-medium">
                Part of Speech
              </label>
              <select
                id="edit-partOfSpeech"
                {...register('partOfSpeech')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="">Not specified</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="preposition">Preposition</option>
                <option value="pronoun">Pronoun</option>
                <option value="conjunction">Conjunction</option>
                <option value="interjection">Interjection</option>
              </select>
            </div>
          </div>

          {/* Example Sentences */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Example Sentence (Optional)
            </label>
            <input
              type="text"
              {...register('exampleSpanish')}
              placeholder="Spanish example"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <input
              type="text"
              {...register('exampleEnglish')}
              placeholder="English translation"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="edit-notes" className="block text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              id="edit-notes"
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Add personal notes or mnemonics..."
            />
          </div>

          {/* Action Buttons - Phase 17: Generous whitespace (24px bottom padding) */}
          <div className="flex gap-3 pt-4 pb-6">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '44px' }}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

