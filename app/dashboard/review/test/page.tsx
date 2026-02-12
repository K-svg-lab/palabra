/**
 * Review Question Test Interface
 *
 * Generate flashcards by type and step through them without starting a full
 * practice session. Use this to verify each question type works correctly.
 *
 * Route: /review/test
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import type { VocabularyWord } from '@/lib/types/vocabulary';
import type { ReviewMethodType, ReviewMethodResult } from '@/lib/types/review-methods';
import { REVIEW_METHOD_METADATA } from '@/lib/types/review-methods';
import {
  TraditionalReview,
  FillBlankReview,
  MultipleChoiceReview,
  AudioRecognitionReview,
  ContextSelectionReview,
} from '@/components/features/review-methods';
import { AppHeader } from '@/components/ui/app-header';

type Direction = 'spanish-to-english' | 'english-to-spanish';

interface TestCard {
  word: VocabularyWord;
  method: ReviewMethodType;
  direction: Direction;
}

const METHOD_TYPES: ReviewMethodType[] = [
  'traditional',
  'fill-blank',
  'multiple-choice',
  'audio-recognition',
  'context-selection',
];

export default function ReviewTestPage() {
  const { data: allWords = [], isLoading } = useVocabulary();
  const [selectedMethods, setSelectedMethods] = useState<Set<ReviewMethodType>>(new Set(METHOD_TYPES));
  const [direction, setDirection] = useState<'spanish-to-english' | 'english-to-spanish' | 'mixed'>('mixed');
  const [wordsPerMethod, setWordsPerMethod] = useState(3);
  const [deck, setDeck] = useState<TestCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const currentCard = deck[currentIndex];
  const totalCards = deck.length;

  const toggleMethod = (method: ReviewMethodType) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  };

  const buildDeck = () => {
    if (!allWords.length || selectedMethods.size === 0) return;
    const words = [...allWords].sort(() => Math.random() - 0.5);
    const cards: TestCard[] = [];
    const dirs: Direction[] = direction === 'mixed' ? ['spanish-to-english', 'english-to-spanish'] : [direction];
    let wordIndex = 0;
    for (const method of Array.from(selectedMethods)) {
      for (let i = 0; i < wordsPerMethod; i++) {
        const word = words[wordIndex % words.length];
        wordIndex++;
        cards.push({
          word,
          method,
          direction: dirs[i % dirs.length],
        });
      }
    }
    // Shuffle deck
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setDeck(cards);
    setCurrentIndex(0);
    setLastResult(null);
  };

  const handleComplete = (result: ReviewMethodResult) => {
    const msg = result.isCorrect
      ? 'Correct'
      : `Incorrect${result.userAnswer != null ? ` (got: ${result.userAnswer})` : ''}`;
    setLastResult(msg);
  };

  const goPrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
    setLastResult(null);
  };

  const goNext = () => {
    setCurrentIndex((i) => Math.min(deck.length - 1, i + 1));
    setLastResult(null);
  };

  const currentDirection: Direction = currentCard?.direction ?? 'spanish-to-english';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading vocabulary...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
      <AppHeader
        icon="🧪"
        title="Review test"
        subtitle="Test question types without starting practice"
        transparent={false}
        showProfile={false}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Link
          href="/dashboard/review"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review
        </Link>

        {/* Setup */}
        <section className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Select question types</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {METHOD_TYPES.map((method) => {
              const meta = REVIEW_METHOD_METADATA[method];
              const checked = selectedMethods.has(method);
              return (
                <label
                  key={method}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMethod(method)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {meta.icon} {meta.name}
                  </span>
                </label>
              );
            })}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Direction</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['spanish-to-english', 'english-to-spanish', 'mixed'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  direction === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {d === 'spanish-to-english' ? 'ES → EN' : d === 'english-to-spanish' ? 'EN → ES' : 'Mixed'}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Words per type</h2>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="number"
              min={1}
              max={20}
              value={wordsPerMethod}
              onChange={(e) => setWordsPerMethod(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">cards per method</span>
          </div>

          <button
            type="button"
            onClick={buildDeck}
            disabled={!allWords.length || selectedMethods.size === 0}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play className="w-5 h-5" />
            Generate test deck
          </button>
          {!allWords.length && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Add vocabulary first to generate cards.</p>
          )}
        </section>

        {/* Deck navigation & card */}
        {totalCards > 0 && currentCard && (
          <section className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Card {currentIndex + 1} of {totalCards}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {REVIEW_METHOD_METADATA[currentCard.method].icon} {REVIEW_METHOD_METADATA[currentCard.method].name}
                  {' · '}
                  {currentCard.direction === 'spanish-to-english' ? 'ES→EN' : 'EN→ES'}
                </p>
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex === totalCards - 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Next card"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {lastResult && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Last result: {lastResult}
              </p>
            )}

            <div className="min-h-[280px] flex flex-col items-center justify-center">
              {currentCard.method === 'traditional' && (
                <TraditionalReview
                  key={`${currentCard.word.id}-traditional`}
                  word={currentCard.word}
                  direction={currentDirection}
                  cardNumber={`${currentIndex + 1} of ${totalCards}`}
                  onComplete={handleComplete}
                />
              )}
              {currentCard.method === 'fill-blank' && (
                <FillBlankReview
                  key={`${currentCard.word.id}-fill-blank`}
                  word={currentCard.word}
                  direction={currentDirection}
                  cardNumber={`${currentIndex + 1} of ${totalCards}`}
                  onComplete={handleComplete}
                />
              )}
              {currentCard.method === 'multiple-choice' && (
                <MultipleChoiceReview
                  key={`${currentCard.word.id}-multiple-choice`}
                  word={currentCard.word}
                  allWords={allWords}
                  direction={currentDirection}
                  cardNumber={`${currentIndex + 1} of ${totalCards}`}
                  onComplete={handleComplete}
                />
              )}
              {currentCard.method === 'audio-recognition' && (
                <AudioRecognitionReview
                  key={`${currentCard.word.id}-audio`}
                  word={currentCard.word}
                  cardNumber={`${currentIndex + 1} of ${totalCards}`}
                  onComplete={handleComplete}
                />
              )}
              {currentCard.method === 'context-selection' && (
                <ContextSelectionReview
                  key={`${currentCard.word.id}-context`}
                  word={currentCard.word}
                  allWords={allWords}
                  direction={currentDirection}
                  cardNumber={`${currentIndex + 1} of ${totalCards}`}
                  onComplete={handleComplete}
                />
              )}
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={buildDeck}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4" />
                New deck
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
