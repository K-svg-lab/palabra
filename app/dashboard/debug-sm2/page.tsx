'use client';

import { useState, useEffect } from 'react';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { getAllReviews } from '@/lib/db/reviews';
import type { ReviewRecord, VocabularyWord, DifficultyRating } from '@/lib/types/vocabulary';
import {
  updateReviewRecord,
  calculateNextInterval,
  formatInterval,
  formatNextReviewDate,
  determineVocabularyStatus,
  calculateAccuracy,
} from '@/lib/utils/spaced-repetition';
import { updateVocabularyWord } from '@/lib/db/vocabulary';
import { updateReviewRecord as saveReviewRecord } from '@/lib/db/reviews';

interface WordReviewData {
  word: VocabularyWord;
  review: ReviewRecord | null;
}

export default function DebugSM2Page() {
  const { data: vocabulary, isLoading } = useVocabulary();
  const [wordReviews, setWordReviews] = useState<WordReviewData[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [timeSimulation, setTimeSimulation] = useState(0); // Days to simulate forward
  const [refreshKey, setRefreshKey] = useState(0);

  // Load review data
  useEffect(() => {
    async function loadReviews() {
      const reviews = await getAllReviews();
      const reviewMap = new Map(reviews.map((r: ReviewRecord) => [r.vocabId, r]));
      
      const data: WordReviewData[] = (vocabulary || []).map((word: VocabularyWord) => ({
        word,
        review: reviewMap.get(word.id) || null,
      }));
      
      setWordReviews(data);
    }
    
    if (!isLoading && vocabulary && vocabulary.length > 0) {
      loadReviews();
    }
  }, [vocabulary, isLoading, refreshKey]);

  const simulatedNow = Date.now() + (timeSimulation * 24 * 60 * 60 * 1000);

  const handleTestReview = async (wordId: string, rating: DifficultyRating) => {
    const data = wordReviews.find(wr => wr.word.id === wordId);
    if (!data || !data.review) return;

    // Apply SM-2 algorithm
    const updatedReview = updateReviewRecord(data.review, rating, simulatedNow);
    const newStatus = determineVocabularyStatus(updatedReview);

    // Save to database
    await saveReviewRecord(updatedReview);
    await updateVocabularyWord({
      ...data.word,
      status: newStatus,
      updatedAt: simulatedNow,
    });

    // Refresh data
    setRefreshKey(prev => prev + 1);
  };

  const getSchedulePreview = (review: ReviewRecord | null, currentRating: DifficultyRating) => {
    if (!review) return null;

    const preview = updateReviewRecord(review, currentRating, simulatedNow);
    return preview;
  };

  const selectedData = wordReviews.find(wr => wr.word.id === selectedWord);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            SM-2 Algorithm Debug Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test and verify spaced repetition behavior without waiting for days
          </p>
        </div>

        {/* Time Simulation Control */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time Simulation
          </h2>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Simulate days forward:
            </label>
            <input
              type="number"
              value={timeSimulation}
              onChange={(e) => setTimeSimulation(parseInt(e.target.value) || 0)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              max="365"
            />
            <button
              onClick={() => setTimeSimulation(0)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Reset to Today
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Current simulated date: <strong>{new Date(simulatedNow).toLocaleDateString()}</strong>
            {timeSimulation > 0 && ` (+${timeSimulation} days)`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Word List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vocabulary Words ({wordReviews.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {wordReviews.map(({ word, review }) => {
                const isDue = review && review.nextReviewDate <= simulatedNow;
                const neverReviewed = !review || review.totalReviews === 0;
                const accuracy = review ? calculateAccuracy(review) : 0;

                return (
                  <button
                    key={word.id}
                    onClick={() => setSelectedWord(word.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedWord === word.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {word.spanishWord}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {word.englishTranslation}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        word.status === 'mastered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        word.status === 'learning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {word.status}
                      </span>
                    </div>
                    {review && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Reviews: {review.totalReviews}</span>
                          <span>Accuracy: {accuracy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Repetition: {review.repetition}</span>
                          <span>Interval: {formatInterval(review.interval)}</span>
                        </div>
                        <div className={`font-medium ${isDue ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {isDue ? '🔴 Due now' : `🟢 ${formatNextReviewDate(review.nextReviewDate, simulatedNow)}`}
                        </div>
                      </div>
                    )}
                    {neverReviewed && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Never reviewed • Available immediately
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Word Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {selectedData ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedData.word.spanishWord}
                </h2>

                {selectedData.review ? (
                  <div className="space-y-6">
                    {/* Current SM-2 Parameters */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Current SM-2 Parameters
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Ease Factor</div>
                          <div className="font-mono text-lg text-gray-900 dark:text-white">
                            {selectedData.review.easeFactor.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Interval</div>
                          <div className="font-mono text-lg text-gray-900 dark:text-white">
                            {formatInterval(selectedData.review.interval)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Repetition</div>
                          <div className="font-mono text-lg text-gray-900 dark:text-white">
                            {selectedData.review.repetition}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Total Reviews</div>
                          <div className="font-mono text-lg text-gray-900 dark:text-white">
                            {selectedData.review.totalReviews}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Correct</div>
                          <div className="font-mono text-lg text-green-600 dark:text-green-400">
                            {selectedData.review.correctCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Incorrect</div>
                          <div className="font-mono text-lg text-red-600 dark:text-red-400">
                            {selectedData.review.incorrectCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Preview */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Schedule Preview (What happens if you answer...)
                      </h3>
                      <div className="space-y-2">
                        {(['easy', 'good', 'hard', 'forgot'] as DifficultyRating[]).map(rating => {
                          const preview = getSchedulePreview(selectedData.review, rating);
                          if (!preview) return null;

                          return (
                            <div key={rating} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {rating}
                                </span>
                                <button
                                  onClick={() => handleTestReview(selectedData.word.id, rating)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Test This
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <div>
                                  <div>Ease:</div>
                                  <div className="font-mono text-gray-900 dark:text-white">
                                    {preview.easeFactor.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div>Interval:</div>
                                  <div className="font-mono text-gray-900 dark:text-white">
                                    {formatInterval(preview.interval)}
                                  </div>
                                </div>
                                <div>
                                  <div>Repetition:</div>
                                  <div className="font-mono text-gray-900 dark:text-white">
                                    {preview.repetition}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Next review: </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatNextReviewDate(preview.nextReviewDate, simulatedNow)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review History */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Timestamps
                      </h3>
                      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        <div>
                          <strong>Created:</strong>{' '}
                          {selectedData.word.createdAt 
                            ? new Date(selectedData.word.createdAt).toLocaleString()
                            : 'N/A'}
                        </div>
                        <div>
                          <strong>Last Review:</strong>{' '}
                          {selectedData.review.lastReviewDate
                            ? new Date(selectedData.review.lastReviewDate).toLocaleString()
                            : 'Never'}
                        </div>
                        <div>
                          <strong>Next Review:</strong>{' '}
                          {new Date(selectedData.review.nextReviewDate).toLocaleString()}
                        </div>
                        <div>
                          <strong>Days until due:</strong>{' '}
                          {Math.ceil((selectedData.review.nextReviewDate - simulatedNow) / (24 * 60 * 60 * 1000))} days
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      This word has never been reviewed
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Complete a review session to initialize SM-2 parameters
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Select a word to view details
              </div>
            )}
          </div>
        </div>

        {/* Algorithm Documentation */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            SM-2 Algorithm Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-300">
            <div>
              <h4 className="font-semibold mb-2">Interval Schedule:</h4>
              <ul className="space-y-1 text-xs">
                <li>• <strong>First review:</strong> 1 day</li>
                <li>• <strong>Second review:</strong> 6 days</li>
                <li>• <strong>Third+ review:</strong> interval × ease factor</li>
                <li>• <strong>"Forgot" answer:</strong> Resets to 1 day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Ease Factor Adjustments:</h4>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Easy:</strong> +0.15 (easier in future)</li>
                <li>• <strong>Good:</strong> No change</li>
                <li>• <strong>Hard:</strong> -0.15 (review sooner)</li>
                <li>• <strong>Forgot:</strong> -0.20 (significant penalty)</li>
                <li>• <strong>Minimum:</strong> 1.3 (floor limit)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Status Classification:</h4>
              <ul className="space-y-1 text-xs">
                <li>• <strong>New:</strong> &lt; 3 total reviews</li>
                <li>• <strong>Learning:</strong> 3+ reviews but &lt;5 repetitions or &lt;80% accuracy</li>
                <li>• <strong>Mastered:</strong> 5+ consecutive correct + 80%+ accuracy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Known Issue:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Words are available <strong>immediately</strong> after creation</li>
                <li>• Documentation suggests first review should be "day after"</li>
                <li>• This may be intentional (allows immediate practice)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
