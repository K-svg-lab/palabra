/**
 * Word Relationships Component
 * 
 * Displays synonyms, antonyms, related words, and verb conjugations.
 * 
 * @module components/features/word-relationships
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { WordRelationships, VerbConjugation } from '@/lib/types/vocabulary';

interface WordRelationshipsProps {
  /** Word relationships data */
  relationships?: WordRelationships;
  /** Verb conjugation data */
  conjugation?: VerbConjugation;
  /** Whether to show expanded by default */
  defaultExpanded?: boolean;
}

export function WordRelationshipsDisplay({
  relationships,
  conjugation,
  defaultExpanded = false,
}: WordRelationshipsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Check if there's any data to display
  const hasRelationships = relationships && (
    (relationships.synonyms && relationships.synonyms.length > 0) ||
    (relationships.antonyms && relationships.antonyms.length > 0) ||
    (relationships.related && relationships.related.length > 0)
  );

  const hasConjugation = conjugation && (
    conjugation.present || conjugation.preterite || conjugation.future
  );

  if (!hasRelationships && !hasConjugation) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-medium">Word Relationships & Conjugations</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-black">
          {/* Synonyms */}
          {relationships?.synonyms && relationships.synonyms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Synonyms
              </h4>
              <div className="flex flex-wrap gap-2">
                {relationships.synonyms.map((synonym, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800"
                  >
                    {synonym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Antonyms */}
          {relationships?.antonyms && relationships.antonyms.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Antonyms
              </h4>
              <div className="flex flex-wrap gap-2">
                {relationships.antonyms.map((antonym, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800"
                  >
                    {antonym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Words */}
          {relationships?.related && relationships.related.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Related Words
              </h4>
              <div className="flex flex-wrap gap-2">
                {relationships.related.map((related, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800"
                  >
                    {related}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verb Conjugation */}
          {hasConjugation && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Verb Conjugations
              </h4>

              {/* Present Tense */}
              {conjugation?.present && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Present
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {conjugation.present.yo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">yo:</span>
                        <span className="font-medium">{conjugation.present.yo}</span>
                      </div>
                    )}
                    {conjugation.present.tu && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">tú:</span>
                        <span className="font-medium">{conjugation.present.tu}</span>
                      </div>
                    )}
                    {conjugation.present.el && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">él/ella:</span>
                        <span className="font-medium">{conjugation.present.el}</span>
                      </div>
                    )}
                    {conjugation.present.nosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">nosotros:</span>
                        <span className="font-medium">{conjugation.present.nosotros}</span>
                      </div>
                    )}
                    {conjugation.present.vosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">vosotros:</span>
                        <span className="font-medium">{conjugation.present.vosotros}</span>
                      </div>
                    )}
                    {conjugation.present.ellos && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ellos:</span>
                        <span className="font-medium">{conjugation.present.ellos}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preterite Tense */}
              {conjugation?.preterite && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Preterite (Past)
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {conjugation.preterite.yo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">yo:</span>
                        <span className="font-medium">{conjugation.preterite.yo}</span>
                      </div>
                    )}
                    {conjugation.preterite.tu && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">tú:</span>
                        <span className="font-medium">{conjugation.preterite.tu}</span>
                      </div>
                    )}
                    {conjugation.preterite.el && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">él/ella:</span>
                        <span className="font-medium">{conjugation.preterite.el}</span>
                      </div>
                    )}
                    {conjugation.preterite.nosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">nosotros:</span>
                        <span className="font-medium">{conjugation.preterite.nosotros}</span>
                      </div>
                    )}
                    {conjugation.preterite.vosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">vosotros:</span>
                        <span className="font-medium">{conjugation.preterite.vosotros}</span>
                      </div>
                    )}
                    {conjugation.preterite.ellos && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ellos:</span>
                        <span className="font-medium">{conjugation.preterite.ellos}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Future Tense */}
              {conjugation?.future && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Future
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {conjugation.future.yo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">yo:</span>
                        <span className="font-medium">{conjugation.future.yo}</span>
                      </div>
                    )}
                    {conjugation.future.tu && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">tú:</span>
                        <span className="font-medium">{conjugation.future.tu}</span>
                      </div>
                    )}
                    {conjugation.future.el && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">él/ella:</span>
                        <span className="font-medium">{conjugation.future.el}</span>
                      </div>
                    )}
                    {conjugation.future.nosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">nosotros:</span>
                        <span className="font-medium">{conjugation.future.nosotros}</span>
                      </div>
                    )}
                    {conjugation.future.vosotros && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">vosotros:</span>
                        <span className="font-medium">{conjugation.future.vosotros}</span>
                      </div>
                    )}
                    {conjugation.future.ellos && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ellos:</span>
                        <span className="font-medium">{conjugation.future.ellos}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

