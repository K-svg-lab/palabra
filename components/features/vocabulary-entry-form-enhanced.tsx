/**
 * Enhanced Vocabulary Entry Form Component
 * 
 * Enhanced version with Phase 7 features:
 * - Multiple example sentences with context
 * - Enhanced audio with speed control
 * - Word relationships and conjugations
 * - Rich text notes
 * - Visual associations (images)
 * 
 * @module components/features/vocabulary-entry-form-enhanced
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useLookupVocabulary, useAddVocabulary } from '@/lib/hooks/use-vocabulary';
import { checkSpanishSpelling } from '@/lib/services/spellcheck';
import type { VocabularyWord, Gender, PartOfSpeech, ExampleSentence } from '@/lib/types/vocabulary';
import { AudioPlayerEnhanced } from './audio-player-enhanced';

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

export function VocabularyEntryFormEnhanced({ onSuccess, onCancel }: Props) {
  const [lookupData, setLookupData] = useState<{
    translation?: string;
    gender?: Gender;
    partOfSpeech?: PartOfSpeech;
    examples?: ExampleSentence[];
    errors?: { translation?: boolean };
  } | null>(null);
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
  const notes = watch('notes');

  // Auto-focus input field when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('spanishWord') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLookup = async (wordOverride?: string) => {
    const wordToUse = wordOverride || spanishWord;
    if (!wordToUse || wordToUse.trim().length === 0) return;

    const cleanWord = wordToUse.trim();

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
      setLastLookedUpWord(cleanWord);
      
      // Auto-fill form fields
      setValue('englishTranslation', data.translation);
      setValue('gender', data.gender);
      setValue('partOfSpeech', data.partOfSpeech);
    } catch (error) {
      console.error('Lookup error:', error);
    }
  };

  const handleUseSuggestion = (e: React.MouseEvent, suggestion: string) => {
    e.preventDefault();
    e.stopPropagation();
    setValue('spanishWord', suggestion);
    setSpellCheckResult(null);
    // Trigger lookup immediately with the corrected word
    handleLookup(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && spanishWord && spanishWord.trim().length > 0) {
      e.preventDefault();
      
      const currentWord = spanishWord.trim();
      const hasValidLookup = hasLookupData && 
                            watch('englishTranslation') && 
                            currentWord === lastLookedUpWord;
      
      if (hasValidLookup) {
        handleSubmit(onSubmit)();
      } else {
        handleLookup();
      }
    }
  };


  const onSubmit = async (data: VocabularyFormData) => {
    try {
      // Use custom example if provided, otherwise fall back to lookup data examples
      let examplesArray: ExampleSentence[] = [];
      if (data.exampleSpanish && data.exampleEnglish) {
        // User provided or edited example
        examplesArray = [{
          spanish: data.exampleSpanish.trim(),
          english: data.exampleEnglish.trim(),
          context: 'neutral',
        }];
      } else if (lookupData?.examples && lookupData.examples.length > 0) {
        // Use lookup data examples
        examplesArray = lookupData.examples;
      }
      
      const vocabularyWord: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'> = {
        spanishWord: data.spanishWord.trim(),
        englishTranslation: data.englishTranslation.trim(),
        gender: data.gender,
        partOfSpeech: data.partOfSpeech,
        examples: examplesArray,
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
      className="space-y-4"
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
            className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent text-base"
            placeholder="perro"
            autoComplete="off"
            autoFocus
            aria-required="true"
            aria-invalid={!!errors.spanishWord}
          />
          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={!spanishWord || isLoading}
            className="flex-shrink-0 px-3 sm:px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[80px] sm:min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm sm:text-base">...</span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-medium">Lookup</span>
            )}
          </button>
        </div>
        {errors.spanishWord && (
          <p className="text-sm text-error" role="alert">{errors.spanishWord.message}</p>
        )}
      </div>

      {/* Spell Check Warning - Compact */}
      {hasSpellingError && spellCheckResult && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1.5">
                {spellCheckResult.message || 'Possible spelling error'}
              </p>
              {spellCheckResult.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {spellCheckResult.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={(e) => handleUseSuggestion(e, suggestion)}
                      className="px-2.5 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSpellCheckResult(null);
                  handleLookup();
                }}
                className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-400 hover:underline"
              >
                Ignore and continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show loading state - Compact */}
      {isLoading && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Fetching translation and details...
            </span>
          </div>
        </div>
      )}

      {/* Show results after lookup - Simplified */}
      {hasLookupData && !isLoading && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Translation */}
          <div className="pb-3">
            <label htmlFor="englishTranslation" className="block text-sm font-medium mb-2">
              Translation <span className="text-error">*</span>
            </label>
            <input
              id="englishTranslation"
              type="text"
              {...register('englishTranslation', { required: 'Translation is required' })}
              className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent text-base"
              placeholder="Dog"
            />
          </div>

          {/* Gender and Part of Speech - Compact */}
          <div className="py-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-2">
                <label htmlFor="gender" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Gender
                </label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="w-full px-2 sm:px-3 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">—</option>
                  <option value="masculine">Masculine</option>
                  <option value="feminine">Feminine</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="partOfSpeech" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Part of Speech
                </label>
                <select
                  id="partOfSpeech"
                  {...register('partOfSpeech')}
                  className="w-full px-2 sm:px-3 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">—</option>
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
          </div>

          {/* Simple Audio Player - Centered */}
          <div className="py-3 flex justify-center">
            <AudioPlayerEnhanced
              text={spanishWord}
              showSpeedControl={false}
              showAccentSelector={false}
            />
          </div>

          {/* Example Sentence - Editable on click, Centered */}
          {lookupData.examples && lookupData.examples.length > 0 && (
            <div className="pt-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-2">
                Example Sentence
              </label>
              <div className="space-y-2 text-center">
                <input
                  type="text"
                  {...register('exampleSpanish')}
                  defaultValue={lookupData.examples[0].spanish}
                  placeholder="Spanish example"
                  className="w-full px-3 py-2 text-sm sm:text-base text-center italic text-gray-700 dark:text-gray-300 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-accent focus:bg-white dark:focus:bg-black rounded-lg focus:ring-2 focus:ring-accent focus:ring-opacity-20 transition-colors"
                />
                <input
                  type="text"
                  {...register('exampleEnglish')}
                  defaultValue={lookupData.examples[0].english}
                  placeholder="English translation"
                  className="w-full px-3 py-2 text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-accent focus:bg-white dark:focus:bg-black rounded-lg focus:ring-2 focus:ring-accent focus:ring-opacity-20 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simple Notes */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          placeholder="Add notes or memory aids..."
          rows={2}
          maxLength={500}
          className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent text-sm resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sm:gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSave || addMutation.isPending}
          className="flex-1 px-4 py-2.5 sm:py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
        >
          {addMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 text-sm sm:text-base"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

