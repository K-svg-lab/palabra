/**
 * Vocabulary Card Component
 * 
 * Displays a single vocabulary word with all its details,
 * including translation, examples, and actions.
 * 
 * @module components/features/vocabulary-card
 */

'use client';

import { useState } from 'react';
import { Volume2, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { playAudio } from '@/lib/services/audio';
import { ExamplesCarousel } from './examples-carousel';
import { ImagesGallery } from './images-gallery';
import { WordRelationshipsDisplay } from './word-relationships';
import { AudioPlayerEnhanced } from './audio-player-enhanced';
import type { VocabularyWord } from '@/lib/types/vocabulary';

interface Props {
  word: VocabularyWord;
  onEdit?: (word: VocabularyWord) => void;
  onDelete?: (id: string) => void;
}

export function VocabularyCard({ word, onEdit, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handlePlayAudio = () => {
    playAudio(word.audioUrl || '', word.spanishWord);
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    learning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    mastered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  const genderAbbrev = {
    masculine: 'm.',
    feminine: 'f.',
    neutral: 'n.',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {word.spanishWord}
            </h3>
            {word.gender && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {genderAbbrev[word.gender]}
              </span>
            )}
            <button
              type="button"
              onClick={handlePlayAudio}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Play pronunciation"
            >
              <Volume2 className="w-4 h-4 text-accent" />
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {word.englishTranslation}
          </p>
          {/* Alternative Translations - Comma Separated */}
          {word.alternativeTranslations && word.alternativeTranslations.length > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
              {word.alternativeTranslations.join(', ')}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="More actions"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[120px]">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(word);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(word.id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-error hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[word.status]}`}>
          {word.status.charAt(0).toUpperCase() + word.status.slice(1)}
        </span>
        {word.partOfSpeech && (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {word.partOfSpeech}
          </span>
        )}
        {word.tags?.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Quick Preview (first example) */}
      {word.examples.length > 0 && !showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-1">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              &ldquo;{word.examples[0].spanish}&rdquo;
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &ldquo;{word.examples[0].english}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Show/Hide Details Button */}
      {(word.examples.length > 1 || word.images || word.relationships || word.conjugation || word.notes) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-accent hover:underline py-2"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All Features
              </>
            )}
          </button>
        </div>
      )}

      {/* Expanded Details - Phase 7 Features */}
      {showDetails && (
        <div className="mt-4 space-y-4">
          {/* Enhanced Audio Player */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Pronunciation
            </h4>
            <AudioPlayerEnhanced
              text={word.spanishWord}
              showSpeedControl={true}
              showAccentSelector={true}
            />
          </div>

          {/* Multiple Examples Carousel */}
          {word.examples.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Example Sentences ({word.examples.length})
              </h4>
              <ExamplesCarousel examples={word.examples} showContext={true} />
            </div>
          )}

          {/* Word Relationships & Conjugations */}
          {(word.relationships || word.conjugation) && (
            <WordRelationshipsDisplay
              relationships={word.relationships}
              conjugation={word.conjugation}
            />
          )}

          {/* Images Gallery */}
          {word.images && word.images.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <ImagesGallery images={word.images} allowUpload={false} />
            </div>
          )}

          {/* Notes */}
          {word.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Personal Notes
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {word.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

