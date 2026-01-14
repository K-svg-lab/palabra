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

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Check, Edit2, AlertCircle } from 'lucide-react';
import { useLookupVocabulary, useAddVocabulary } from '@/lib/hooks/use-vocabulary';
import { checkSpanishSpelling } from '@/lib/services/spellcheck';
import { uploadCustomImage } from '@/lib/services/images';
import type { VocabularyWord, Gender, PartOfSpeech, WordRelationships, VerbConjugation, VisualAssociation, ExampleSentence } from '@/lib/types/vocabulary';
import { AudioPlayerEnhanced } from './audio-player-enhanced';
import { WordRelationshipsDisplay } from './word-relationships';
import { ExamplesCarousel } from './examples-carousel';
import { ImagesGallery } from './images-gallery';
import { RichTextEditor } from '../shared/rich-text-editor';

interface VocabularyFormData {
  spanishWord: string;
  englishTranslation: string;
  gender?: Gender;
  partOfSpeech?: PartOfSpeech;
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
    relationships?: WordRelationships;
    conjugation?: VerbConjugation;
    images?: VisualAssociation[];
    errors?: { translation?: boolean };
  } | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [spellCheckResult, setSpellCheckResult] = useState<{
    isCorrect: boolean;
    suggestions: string[];
    message?: string;
  } | null>(null);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [lastLookedUpWord, setLastLookedUpWord] = useState<string>('');
  const [customImages, setCustomImages] = useState<VisualAssociation[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VocabularyFormData>();
  const lookupMutation = useLookupVocabulary();
  const addMutation = useAddVocabulary();
  const inputRef = useRef<HTMLInputElement>(null);

  const spanishWord = watch('spanishWord');
  const notes = watch('notes');

  // Auto-focus input field when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    handleLookup();
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

  const handleImageUpload = async (file: File) => {
    const image = await uploadCustomImage(file);
    if (image) {
      setCustomImages([...customImages, image]);
    }
  };

  const handleImageRemove = (index: number) => {
    const allImages = [...(lookupData?.images || []), ...customImages];
    const removedImage = allImages[index];
    
    // If it's a custom image, remove from customImages
    if (removedImage.source === 'upload') {
      setCustomImages(customImages.filter(img => img !== removedImage));
    }
  };

  const onSubmit = async (data: VocabularyFormData) => {
    try {
      const allImages = [...(lookupData?.images || []), ...customImages];
      
      const vocabularyWord: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'> = {
        spanishWord: data.spanishWord.trim(),
        englishTranslation: data.englishTranslation.trim(),
        gender: data.gender,
        partOfSpeech: data.partOfSpeech,
        examples: lookupData?.examples || [],
        relationships: lookupData?.relationships,
        conjugation: lookupData?.conjugation,
        images: allImages.length > 0 ? allImages : undefined,
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
  const allImages = [...(lookupData?.images || []), ...customImages];

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
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="perro"
            autoComplete="off"
            autoFocus
            aria-required="true"
            aria-invalid={!!errors.spanishWord}
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
          <p className="text-sm text-error" role="alert">{errors.spanishWord.message}</p>
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
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">Did you mean:</p>
                  <div className="flex flex-wrap gap-2">
                    {spellCheckResult.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={(e) => handleUseSuggestion(e, suggestion)}
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
              Fetching translation, examples, pronunciations, and more...
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
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Lock Fields
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>

          {/* Translation */}
          <div className="space-y-1">
            <label htmlFor="englishTranslation" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Translation *
            </label>
            <div className="flex items-center gap-2">
              {!lookupData.errors?.translation && <Check className="w-4 h-4 text-success flex-shrink-0" />}
              <input
                id="englishTranslation"
                type="text"
                {...register('englishTranslation', { required: 'Translation is required' })}
                readOnly={!isEditing}
                className={`flex-1 px-3 py-2 rounded-md border ${
                  isEditing
                    ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black'
                    : 'border-transparent bg-transparent'
                }`}
              />
            </div>
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
                disabled={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${
                  isEditing
                    ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black'
                    : 'border-transparent bg-transparent'
                }`}
              >
                <option value="">Not specified</option>
                <option value="masculine">Masculine</option>
                <option value="feminine">Feminine</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="partOfSpeech" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Part of Speech
              </label>
              <select
                id="partOfSpeech"
                {...register('partOfSpeech')}
                disabled={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${
                  isEditing
                    ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black'
                    : 'border-transparent bg-transparent'
                }`}
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

          {/* Enhanced Audio Player */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Pronunciation
            </label>
            <AudioPlayerEnhanced
              text={spanishWord}
              showSpeedControl={true}
              showAccentSelector={true}
            />
          </div>

          {/* Example Sentences Carousel */}
          {lookupData.examples && lookupData.examples.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Example Sentences
              </label>
              <ExamplesCarousel examples={lookupData.examples} showContext={true} />
            </div>
          )}

          {/* Word Relationships & Conjugations */}
          {(lookupData.relationships || lookupData.conjugation) && (
            <WordRelationshipsDisplay
              relationships={lookupData.relationships}
              conjugation={lookupData.conjugation}
            />
          )}

          {/* Images Gallery */}
          {(lookupData.images || customImages.length > 0) && (
            <ImagesGallery
              images={allImages}
              allowUpload={true}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          )}
        </div>
      )}

      {/* Rich Text Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Personal Notes & Mnemonics (Optional)
        </label>
        <RichTextEditor
          value={notes}
          onChange={(value) => setValue('notes', value)}
          placeholder="Add personal notes, mnemonics, or memory aids..."
          maxLength={500}
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

