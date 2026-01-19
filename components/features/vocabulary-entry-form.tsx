/**
 * Vocabulary Entry Form Component
 * 
 * Smart form that automatically fetches translation, examples, and pronunciation
 * when user enters a Spanish word. Supports manual editing of all fields.
 * 
 * @module components/features/vocabulary-entry-form
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Volume2, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useLookupVocabulary, useAddVocabulary } from '@/lib/hooks/use-vocabulary';
import { playAudio, isTTSAvailable } from '@/lib/services/audio';
import { checkSpanishSpelling } from '@/lib/services/spellcheck';
import type { VocabularyWord, Gender, PartOfSpeech } from '@/lib/types/vocabulary';

interface VocabularyFormData {
  spanishWord: string;
  englishTranslation: string;
  gender?: Gender;
  partOfSpeech?: PartOfSpeech;
  exampleSpanish?: string;
  exampleEnglish?: string;
  notes?: string;
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VocabularyEntryForm({ onSuccess, onCancel }: Props) {
  const [lookupData, setLookupData] = useState<{
    translation?: string;
    gender?: Gender;
    partOfSpeech?: PartOfSpeech;
    examples?: Array<{ spanish: string; english: string }>;
    errors?: { translation?: boolean };
  } | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [spellCheckResult, setSpellCheckResult] = useState<{
    isCorrect: boolean;
    suggestions: string[];
    message?: string;
  } | null>(null);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [lastLookedUpWord, setLastLookedUpWord] = useState<string>('');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VocabularyFormData>();
  const lookupMutation = useLookupVocabulary();
  const addMutation = useAddVocabulary();

  const spanishWord = watch('spanishWord');

  const handleLookup = async () => {
    if (!spanishWord || spanishWord.trim().length === 0) return;

    const cleanWord = spanishWord.trim();

    try {
      // First, check spelling
      setIsCheckingSpelling(true);
      const spellCheck = await checkSpanishSpelling(cleanWord);
      setSpellCheckResult(spellCheck);
      setIsCheckingSpelling(false);

      // If word is misspelled, show suggestions and don't proceed with lookup
      if (!spellCheck.isCorrect) {
        return;
      }

      // If spelling is correct, proceed with lookup
      const data = await lookupMutation.mutateAsync(cleanWord);
      setLookupData(data);
      setLastLookedUpWord(cleanWord); // Track the word we just looked up
      
      // Auto-fill form fields
      setValue('englishTranslation', data.translation);
      setValue('gender', data.gender);
      setValue('partOfSpeech', data.partOfSpeech);
      
      if (data.examples && data.examples.length > 0) {
        setValue('exampleSpanish', data.examples[0].spanish);
        setValue('exampleEnglish', data.examples[0].english);
      }
    } catch (error) {
      console.error('Lookup error:', error);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setValue('spanishWord', suggestion);
    setSpellCheckResult(null);
    // Automatically trigger lookup for the corrected word
    setTimeout(() => handleLookup(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && spanishWord && spanishWord.trim().length > 0) {
      e.preventDefault();
      
      const currentWord = spanishWord.trim();
      const hasValidLookup = hasLookupData && 
                            watch('englishTranslation') && 
                            currentWord === lastLookedUpWord;
      
      // If the word has changed since last lookup, trigger new lookup
      // If the word is the same and we have lookup data, save the word
      if (hasValidLookup) {
        handleSubmit(onSubmit)();
      } else {
        handleLookup();
      }
    }
  };

  const handlePlayAudio = () => {
    if (!spanishWord) return;
    
    try {
      if (isTTSAvailable()) {
        playAudio('', spanishWord);
        setAudioError(false);
      } else {
        setAudioError(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setAudioError(true);
    }
  };

  const onSubmit = async (data: VocabularyFormData) => {
    try {
      const vocabularyWord: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'> = {
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
        status: 'new',
        audioUrl: '',
        notes: data.notes || '',
        tags: [],
      };

      await addMutation.mutateAsync(vocabularyWord);
      onSuccess?.();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const isLoading = lookupMutation.isPending || isCheckingSpelling;
  const hasLookupData = lookupData !== null;
  const canSave = watch('spanishWord') && watch('englishTranslation');
  const hasSpellingError = spellCheckResult && !spellCheckResult.isCorrect;

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
      aria-label="Add vocabulary word form"
    >
      {/* Spanish Word Input */}
      <div className="space-y-2">
        <label htmlFor="spanishWord" className="block text-sm font-medium">
          Spanish Word <span className="text-error" aria-label="required">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="spanishWord"
            type="text"
            {...register('spanishWord', { required: 'Spanish word is required' })}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="perro"
            autoComplete="off"
            autoFocus
            aria-required="true"
            aria-invalid={!!errors.spanishWord}
            aria-describedby={errors.spanishWord ? 'spanish-word-error' : undefined}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!spanishWord || isLoading}
            className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </>
            ) : (
              <span>Lookup</span>
            )}
          </button>
        </div>
        {errors.spanishWord && (
          <p id="spanish-word-error" className="text-sm text-error" role="alert">
            {errors.spanishWord.message}
          </p>
        )}
      </div>

      {/* Spell Check Warning */}
      {hasSpellingError && spellCheckResult && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                {spellCheckResult.message || 'Possible spelling error'}
              </p>
              {spellCheckResult.suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                    Did you mean:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {spellCheckResult.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleUseSuggestion(suggestion)}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSpellCheckResult(null);
                  handleLookup();
                }}
                className="mt-3 text-xs text-yellow-700 dark:text-yellow-400 hover:underline"
              >
                Ignore and continue anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show loading state */}
      {isLoading && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Fetching translation, examples, and pronunciation...
            </span>
          </div>
        </div>
      )}

      {/* Show results after lookup */}
      {hasLookupData && !isLoading && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-Generated Data
            </h3>
          </div>

          {/* Translation */}
          <div className="space-y-1">
            <label htmlFor="englishTranslation" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Translation *
            </label>
            <div className="flex items-center gap-2">
              {!lookupData.errors?.translation && <Check className="w-4 h-4 text-success flex-shrink-0" />}
              {lookupData.errors?.translation && <X className="w-4 h-4 text-error flex-shrink-0" />}
              <input
                id="englishTranslation"
                type="text"
                {...register('englishTranslation', { required: 'Translation is required' })}
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            {errors.englishTranslation && (
              <p className="text-xs text-error">{errors.englishTranslation.message}</p>
            )}
          </div>

          {/* Gender and Part of Speech */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gender" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Gender
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="">Not specified</option>
                <option value="masculine">Masculine</option>
                <option value="feminine">Feminine</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="partOfSpeech" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Part of Speech
              </label>
              <select
                id="partOfSpeech"
                {...register('partOfSpeech')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
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

          {/* Example Sentence */}
          {lookupData.examples && lookupData.examples.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Example Sentence
              </label>
              <input
                type="text"
                {...register('exampleSpanish')}
                placeholder="Spanish example"
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <input
                type="text"
                {...register('exampleEnglish')}
                placeholder="English translation"
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          )}

          {/* Pronunciation */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Pronunciation
            </label>
            <button
              type="button"
              onClick={handlePlayAudio}
              className="flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded-md transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Play Audio
            </button>
            {audioError && (
              <p className="text-xs text-error">Audio not available</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="Add personal notes or mnemonics..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSave || addMutation.isPending}
          className="flex-1 px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Word
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

