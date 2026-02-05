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
import { Loader2, Check, AlertCircle, WifiOff } from 'lucide-react';
import { useLookupVocabulary, useAddVocabulary } from '@/lib/hooks/use-vocabulary';
import { checkSpanishSpelling } from '@/lib/services/spellcheck';
import { useOnlineStatusOnly } from '@/lib/hooks/use-online-status';
import { getOfflineQueueService } from '@/lib/services/offline-queue';
import type { VocabularyWord, Gender, PartOfSpeech, ExampleSentence } from '@/lib/types/vocabulary';

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
  initialWord?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VocabularyEntryFormEnhanced({ initialWord, onSuccess, onCancel }: Props) {
  const [lookupData, setLookupData] = useState<{
    translation?: string;
    alternativeTranslations?: string[];
    gender?: Gender;
    partOfSpeech?: PartOfSpeech;
    examples?: ExampleSentence[];
    errors?: { translation?: boolean };
    fromCache?: boolean;
    cacheMetadata?: any;
    crossValidation?: {
      hasDisagreement: boolean;
      agreementLevel: number;
      recommendation: 'accept' | 'review' | 'manual';
      explanation: string;
      sources: Array<{ source: string; translation: string }>;
      disagreements: Array<{ source1: string; source2: string; translation1: string; translation2: string }>;
    };
  } | null>(null);
  const [spellCheckResult, setSpellCheckResult] = useState<{
    isCorrect: boolean;
    suggestions: string[];
    message?: string;
  } | null>(null);
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  const [lastLookedUpWord, setLastLookedUpWord] = useState<string>('');
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════
  // 📝 EDIT TRACKING (Phase 16.4.1)
  // Track which fields user edits vs API suggestions
  // ═══════════════════════════════════════════════════════════════════
  const [originalApiData, setOriginalApiData] = useState<any>(null);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  
  const isOnline = useOnlineStatusOnly();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VocabularyFormData>();
  const lookupMutation = useLookupVocabulary();
  const addMutation = useAddVocabulary();

  const spanishWord = watch('spanishWord');
  const englishTranslation = watch('englishTranslation');
  const notes = watch('notes');

  // Auto-focus input field when component mounts and populate initial word if provided
  useEffect(() => {
    if (hasAutoTriggered) return; // Prevent running again
    
    const timer = setTimeout(() => {
      const input = document.getElementById('spanishWord') as HTMLInputElement;
      if (input) {
        if (initialWord && initialWord.trim().length > 0) {
          setValue('spanishWord', initialWord.trim());
          setHasAutoTriggered(true);
          
          // Blur input to keep mobile keyboard closed
          input.blur();
          
          // Only trigger lookup if online
          if (isOnline) {
            // Trigger lookup after setting the value
            setTimeout(async () => {
              const cleanWord = initialWord.trim();
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
                console.log('[Form] Received lookup data:', {
                  translation: data.translation,
                  alternativeTranslations: data.alternativeTranslations,
                  alternativesCount: data.alternativeTranslations?.length || 0
                });
                setLookupData(data);
                setLastLookedUpWord(cleanWord);
                
                // 📝 Store original API data for edit tracking
                setOriginalApiData({
                  translation: data.translation,
                  gender: data.gender,
                  partOfSpeech: data.partOfSpeech,
                  exampleSpanish: data.examples?.[0]?.spanish,
                  exampleEnglish: data.examples?.[0]?.english,
                  alternativeTranslations: data.alternativeTranslations,
                });
                
                // Reset edited fields for new lookup
                setEditedFields(new Set());
                
                // Auto-fill form fields
                setValue('englishTranslation', data.translation);
                setValue('gender', data.gender);
                setValue('partOfSpeech', data.partOfSpeech);
                
                // Update example sentence fields if new examples are available
                if (data.examples && data.examples.length > 0) {
                  setValue('exampleSpanish', data.examples[0].spanish);
                  setValue('exampleEnglish', data.examples[0].english);
                }
                
                // Keep keyboard closed after auto-fill
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              } catch (error) {
                console.error('Auto-lookup error:', error);
              }
            }, 300);
          } else {
            // Offline: Show offline banner and skip auto-lookup
            setOfflineMode(true);
            console.log('[VocabForm] Offline - skipping auto-lookup');
          }
        } else {
          // Only auto-focus Spanish word field when opening blank form (no initialWord)
          input.focus();
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [initialWord, setValue, hasAutoTriggered, lookupMutation, isOnline]);

  const handleLookup = async (wordOverride?: string) => {
    // Check if online before attempting lookup
    if (!isOnline) {
      console.log('[VocabForm] Cannot lookup while offline');
      return;
    }

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
      
      // 📝 Store original API data for edit tracking
      setOriginalApiData({
        translation: data.translation,
        gender: data.gender,
        partOfSpeech: data.partOfSpeech,
        exampleSpanish: data.examples?.[0]?.spanish,
        exampleEnglish: data.examples?.[0]?.english,
        alternativeTranslations: data.alternativeTranslations,
      });
      
      // Reset edited fields for new lookup
      setEditedFields(new Set());
      
      // Auto-fill form fields
      setValue('englishTranslation', data.translation);
      setValue('gender', data.gender);
      setValue('partOfSpeech', data.partOfSpeech);
      
      // Update example sentence fields if new examples are available
      if (data.examples && data.examples.length > 0) {
        setValue('exampleSpanish', data.examples[0].spanish);
        setValue('exampleEnglish', data.examples[0].english);
      }
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
      const englishTranslation = watch('englishTranslation');
      const hasValidLookup = hasLookupData && 
                            englishTranslation && 
                            currentWord === lastLookedUpWord;
      
      if (hasValidLookup) {
        handleSubmit(onSubmit)();
      } else {
        handleLookup();
      }
    }
  };

  /**
   * 📝 EDIT TRACKING (Phase 16.4.1)
   * Detects which fields user edited vs API suggestions
   * Used for verification tracking and confidence scoring
   */
  const detectEditedFields = (formData: VocabularyFormData): string[] => {
    if (!originalApiData) return []; // No API data to compare
    
    const edited: string[] = [];
    
    // Check translation
    if (formData.englishTranslation?.trim().toLowerCase() !== originalApiData.translation?.toLowerCase()) {
      edited.push('englishTranslation');
    }
    
    // Check gender
    if (formData.gender !== originalApiData.gender) {
      edited.push('gender');
    }
    
    // Check part of speech
    if (formData.partOfSpeech !== originalApiData.partOfSpeech) {
      edited.push('partOfSpeech');
    }
    
    // Check example Spanish
    if (formData.exampleSpanish?.trim() !== originalApiData.exampleSpanish?.trim()) {
      edited.push('exampleSpanish');
    }
    
    // Check example English
    if (formData.exampleEnglish?.trim() !== originalApiData.exampleEnglish?.trim()) {
      edited.push('exampleEnglish');
    }
    
    // Check alternative translations (if user changed selection)
    const originalAlts = originalApiData.alternativeTranslations || [];
    if (JSON.stringify(selectedAlternatives.sort()) !== JSON.stringify(originalAlts.sort())) {
      edited.push('alternativeTranslations');
    }
    
    return edited;
  };


  const onSubmit = async (data: VocabularyFormData) => {
    try {
      // 📝 Detect which fields user edited (Phase 16.4.1)
      const edited = detectEditedFields(data);
      console.log('[Form] User edited fields:', edited.length > 0 ? edited : 'none');
      
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
      
      const vocabularyWord: Omit<VocabularyWord, 'id' | 'createdAt' | 'updatedAt'> & {
        editedFields?: string[];
        originalApiData?: any;
      } = {
        spanishWord: data.spanishWord.trim(),
        englishTranslation: data.englishTranslation.trim().toLowerCase(),
        alternativeTranslations: selectedAlternatives.length > 0 ? selectedAlternatives : undefined,
        gender: data.gender,
        partOfSpeech: data.partOfSpeech,
        examples: examplesArray,
        status: 'new',
        
        // 📝 Include edit tracking data (Phase 16.4.1)
        editedFields: edited,
        originalApiData: originalApiData,
        audioUrl: '',
        notes: data.notes || '',
        tags: [],
      };

      // Add to local database
      const addedWord = await addMutation.mutateAsync(vocabularyWord);
      
      // Queue for sync if offline
      if (!isOnline) {
        try {
          const queueService = getOfflineQueueService();
          await queueService.enqueue('add_vocabulary', addedWord);
          setOfflineMode(true);
          console.log('📴 Offline - queued vocabulary for sync');
        } catch (queueError) {
          console.error('Failed to queue vocabulary:', queueError);
        }
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Save error:', error);
      // Even if save to server fails, try to queue it
      if (!isOnline) {
        setOfflineMode(true);
      }
    }
  };

  const isLoading = lookupMutation.isPending || isCheckingSpelling;
  const hasLookupData = lookupData !== null;
  const canSave = watch('spanishWord') && watch('englishTranslation');
  const hasSpellingError = spellCheckResult && !spellCheckResult.isCorrect;

  // Global Enter key handler - works even when no specific field is focused
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return;
      
      // Don't handle if user is typing in textarea (notes field)
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      
      // Don't handle if already loading
      if (isLoading || addMutation.isPending) return;
      
      const currentWord = spanishWord?.trim();
      if (!currentWord) return;
      
      const hasValidLookup = hasLookupData && 
                            englishTranslation && 
                            currentWord === lastLookedUpWord;
      
      if (hasValidLookup) {
        e.preventDefault();
        handleSubmit(onSubmit)();
      } else if (currentWord) {
        e.preventDefault();
        handleLookup();
      }
    };
    
    // Attach to document to catch Enter anywhere in the form
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [spanishWord, englishTranslation, hasLookupData, lastLookedUpWord, isLoading, addMutation.isPending, handleSubmit, onSubmit]);

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
            autoFocus={!initialWord}
            aria-required="true"
            aria-invalid={!!errors.spanishWord}
          />
          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={!spanishWord || isLoading || !isOnline}
            className="flex-shrink-0 px-3 sm:px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[80px] sm:min-w-[100px]"
            title={!isOnline ? 'Lookup requires internet connection' : 'Lookup word details'}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm sm:text-base">...</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm sm:text-base font-medium hidden sm:inline">Offline</span>
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

      {/* 🔍 CROSS-VALIDATION WARNING (Phase 16.1 Task 2) */}
      {/* Show warning when translation sources disagree */}
      {lookupData?.crossValidation?.hasDisagreement && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border mb-4 transition-all duration-300 ${
          lookupData.crossValidation.recommendation === 'manual'
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
            : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900'
        }`}>
          <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
            lookupData.crossValidation.recommendation === 'manual'
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`} />
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              lookupData.crossValidation.recommendation === 'manual'
                ? 'text-red-800 dark:text-red-200'
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {lookupData.crossValidation.recommendation === 'manual' ? 'Multiple translations found' : 'Translation sources disagree'}
            </p>
            <p className={`text-xs mt-1 ${
              lookupData.crossValidation.recommendation === 'manual'
                ? 'text-red-700 dark:text-red-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {lookupData.crossValidation.explanation}
            </p>
            
            {/* Show alternative translations from each source */}
            {lookupData.crossValidation.disagreements.length > 0 && (
              <div className="mt-2 space-y-1">
                {lookupData.crossValidation.sources.map((source, index) => (
                  <div key={index} className="text-xs flex items-center gap-2">
                    <span className={`font-medium ${
                      lookupData.crossValidation?.recommendation === 'manual'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {source.source.toUpperCase()}:
                    </span>
                    <span className={`${
                      lookupData.crossValidation?.recommendation === 'manual'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {source.translation}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <p className={`text-xs mt-2 font-medium ${
              lookupData.crossValidation.recommendation === 'manual'
                ? 'text-red-800 dark:text-red-200'
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {lookupData.crossValidation.recommendation === 'manual'
                ? '⚠️ Please verify the translation manually'
                : '💡 Review suggested translations carefully'
              }
            </p>
          </div>
        </div>
      )}

      {/* 🍎 VERIFIED TRANSLATION INDICATOR (Phase 16.4.2) */}
      {/* Apple-inspired: Clean, minimal, non-technical */}
      {lookupData?.fromCache && lookupData.cacheMetadata && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 mb-4 transition-all duration-300">
          {/* Simple checkmark - no clutter */}
          <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          
          {/* Clear, human language - no technical jargon */}
          <p className="text-sm text-green-800 dark:text-green-200 flex-1">
            <span className="font-medium">Verified translation</span>
            {lookupData.cacheMetadata.verificationCount > 1 && (
              <span className="text-green-600 dark:text-green-400 ml-1">
                · {lookupData.cacheMetadata.verificationCount} users
              </span>
            )}
          </p>
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
              className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-accent focus:border-transparent text-base lowercase"
              placeholder="dog"
            />
            
            {/* Selected Alternative Translations - Show as badges with X */}
            {selectedAlternatives.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedAlternatives.map((alt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedAlternatives(prev => prev.filter(a => a !== alt));
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Click to remove"
                  >
                    <span>{alt}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold">×</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Unselected Alternative Translations - Click to add */}
            {lookupData.alternativeTranslations && lookupData.alternativeTranslations.length > 0 && (
              <div className="mt-3">
                {lookupData.alternativeTranslations.filter(alt => !selectedAlternatives.includes(alt)).length > 0 && (
                  <>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Other meanings (click to add)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {lookupData.alternativeTranslations
                        .filter(alt => !selectedAlternatives.includes(alt))
                        .map((alt, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSelectedAlternatives(prev => [...prev, alt]);
                            }}
                            className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-accent hover:bg-accent/10 transition-all"
                            title="Click to add to translation"
                          >
                            {alt}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
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

      {/* Offline Mode Notice */}
      {!isOnline && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <WifiOff className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300">
                Offline Mode
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Word will be saved locally and synced when you're back online. 
                Lookup is unavailable - please enter details manually.
              </p>
            </div>
          </div>
        </div>
      )}

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

