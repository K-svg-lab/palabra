/**
 * Comparative Review Component (Phase 18.2.1)
 * 
 * Side-by-side comparison of confused words with targeted quiz
 * to resolve interference and improve retention.
 * 
 * Research: Underwood (1957) - Comparative learning resolves interference
 * 
 * @module comparative-review
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Volume2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ComparativeReviewResult } from '@/lib/services/interference-detection';

// ============================================================================
// TYPES
// ============================================================================

interface VocabularyWord {
  id: string;
  spanish: string;
  english: string;
  partOfSpeech?: string;
  examples?: Array<{
    spanish: string;
    english: string;
  }>;
  audio?: string;
}

interface ComparativeReviewProps {
  word1: VocabularyWord;
  word2: VocabularyWord;
  onComplete: (result: ComparativeReviewResult) => void;
}

interface QuizQuestion {
  type: 'sentence' | 'translation';
  sentence?: string;
  sentenceTranslation?: string;
  prompt?: string;
  correctWord: string;
  options: string[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComparativeReview({
  word1,
  word2,
  onComplete,
}: ComparativeReviewProps) {
  const [showQuiz, setShowQuiz] = useState(false);

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  if (showQuiz) {
    return (
      <ComparativeQuiz
        word1={word1}
        word2={word2}
        onComplete={onComplete}
      />
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500 uppercase px-3 py-1 bg-yellow-50 dark:bg-yellow-950 rounded-full">
          ⚠️ Commonly Confused
        </span>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Let's clarify these words
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          These words look similar but have different meanings
        </p>
      </div>
      
      {/* Side-by-Side Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Word 1 */}
        <WordCard word={word1} color="blue" />
        
        {/* Word 2 */}
        <WordCard word={word2} color="purple" />
      </div>
      
      {/* Key Differences */}
      <KeyDifferences word1={word1} word2={word2} />
      
      {/* Start Quiz Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleStartQuiz}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg font-semibold shadow-lg"
        >
          Practice with Quiz
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// WORD CARD COMPONENT
// ============================================================================

interface WordCardProps {
  word: VocabularyWord;
  color: 'blue' | 'purple' | 'green';
}

function WordCard({ word, color }: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
    },
  };

  const classes = colorClasses[color];

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word.spanish);
      utterance.lang = 'es-ES';
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`${classes.bg} rounded-2xl p-6 border-2 ${classes.border}`}>
      {/* Word */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
          {word.spanish}
        </h3>
        <button
          onClick={playAudio}
          className={`p-2 rounded-full ${classes.bg} hover:bg-opacity-80 transition-colors`}
          aria-label="Play pronunciation"
          disabled={isPlaying}
        >
          <Volume2 className={`w-5 h-5 ${classes.text} ${isPlaying ? 'animate-pulse' : ''}`} />
        </button>
      </div>
      
      {/* Translation */}
      <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
        {word.english}
      </p>
      
      {/* Part of Speech */}
      {word.partOfSpeech && (
        <span className={`inline-block text-xs font-medium ${classes.text} px-2 py-1 rounded-full ${classes.bg} mb-4`}>
          {word.partOfSpeech}
        </span>
      )}
      
      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Examples:
          </p>
          {word.examples.slice(0, 2).map((ex, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {ex.spanish}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {ex.english}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// KEY DIFFERENCES COMPONENT
// ============================================================================

interface KeyDifferencesProps {
  word1: VocabularyWord;
  word2: VocabularyWord;
}

function KeyDifferences({ word1, word2 }: KeyDifferencesProps) {
  const differences = generateKeyDifferences(word1, word2);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        Key Differences
      </h4>
      <ul className="space-y-2">
        {differences.map((diff, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
            <span>{diff}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function generateKeyDifferences(
  word1: VocabularyWord,
  word2: VocabularyWord
): string[] {
  const differences: string[] = [];

  // Spelling difference
  if (word1.spanish !== word2.spanish) {
    differences.push(
      `"${word1.spanish}" vs "${word2.spanish}" - Notice the spelling difference`
    );
  }

  // Meaning difference
  differences.push(
    `"${word1.spanish}" means "${word1.english}", while "${word2.spanish}" means "${word2.english}"`
  );

  // Part of speech difference
  if (word1.partOfSpeech && word2.partOfSpeech && word1.partOfSpeech !== word2.partOfSpeech) {
    differences.push(
      `"${word1.spanish}" is a ${word1.partOfSpeech}, "${word2.spanish}" is a ${word2.partOfSpeech}`
    );
  }

  // Add usage hints
  if (word1.examples && word1.examples.length > 0) {
    differences.push(
      `Notice how "${word1.spanish}" is used in context: "${word1.examples[0].spanish}"`
    );
  }

  return differences;
}

// ============================================================================
// COMPARATIVE QUIZ COMPONENT
// ============================================================================

interface ComparativeQuizProps {
  word1: VocabularyWord;
  word2: VocabularyWord;
  onComplete: (result: ComparativeReviewResult) => void;
}

function ComparativeQuiz({
  word1,
  word2,
  onComplete,
}: ComparativeQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const questions = generateQuestions(word1, word2);

  const handleAnswer = (selected: string) => {
    setSelectedAnswer(selected);
    setShowFeedback(true);

    const isCorrect = selected === questions[currentQuestion].correctWord;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // Wait for feedback, then move to next question
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Quiz complete
        const accuracy = correctCount / questions.length;
        onComplete({
          word1Id: word1.id,
          word2Id: word2.id,
          questionsAsked: questions.length,
          questionsCorrect: correctCount + (isCorrect ? 1 : 0),
          accuracy: isCorrect ? (correctCount + 1) / questions.length : accuracy,
          completedAt: new Date(),
        });
      }
    }, 1500);
  };

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctWord;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {correctCount} correct
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
        {question.type === 'sentence' ? (
          <div>
            <p className="text-lg mb-4 text-gray-700 dark:text-gray-300">
              Which word fits in this sentence?
            </p>
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {question.sentence}
            </p>
            {question.sentenceTranslation && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {question.sentenceTranslation}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-lg mb-4 text-gray-700 dark:text-gray-300">
              Translate to Spanish:
            </p>
            <p className="text-2xl font-medium text-gray-900 dark:text-white">
              {question.prompt}
            </p>
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {question.options.map(option => {
            const isSelected = selectedAnswer === option;
            const isThisCorrect = option === question.correctWord;
            
            let buttonClass = 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600';
            
            if (showFeedback && isSelected) {
              buttonClass = isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500'
                : 'border-red-500 bg-red-50 dark:bg-red-950 ring-2 ring-red-500';
            }
            
            if (showFeedback && !isSelected && isThisCorrect) {
              buttonClass = 'border-green-500 bg-green-50 dark:bg-green-950';
            }

            return (
              <motion.button
                key={option}
                onClick={() => !showFeedback && handleAnswer(option)}
                disabled={showFeedback}
                className={`py-8 text-2xl font-medium rounded-xl border-2 transition-all duration-200 ${buttonClass}`}
                whileHover={!showFeedback ? { scale: 1.02 } : {}}
                whileTap={!showFeedback ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-center gap-2">
                  {option}
                  {showFeedback && isSelected && (
                    isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )
                  )}
                  {showFeedback && !isSelected && isThisCorrect && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl text-center ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? '✓ Correct!' : `✗ Correct answer: ${question.correctWord}`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// QUIZ GENERATION
// ============================================================================

function generateQuestions(
  word1: VocabularyWord,
  word2: VocabularyWord
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Question 1: Word 1 in sentence context
  if (word1.examples && word1.examples.length > 0) {
    const example = word1.examples[0];
    questions.push({
      type: 'sentence',
      sentence: example.spanish.replace(word1.spanish, '_____'),
      sentenceTranslation: example.english,
      correctWord: word1.spanish,
      options: shuffleArray([word1.spanish, word2.spanish]),
    });
  }

  // Question 2: Word 2 in sentence context
  if (word2.examples && word2.examples.length > 0) {
    const example = word2.examples[0];
    questions.push({
      type: 'sentence',
      sentence: example.spanish.replace(word2.spanish, '_____'),
      sentenceTranslation: example.english,
      correctWord: word2.spanish,
      options: shuffleArray([word1.spanish, word2.spanish]),
    });
  }

  // Question 3: Translate word 1
  questions.push({
    type: 'translation',
    prompt: word1.english,
    correctWord: word1.spanish,
    options: shuffleArray([word1.spanish, word2.spanish]),
  });

  // Question 4: Translate word 2
  questions.push({
    type: 'translation',
    prompt: word2.english,
    correctWord: word2.spanish,
    options: shuffleArray([word1.spanish, word2.spanish]),
  });

  return questions;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
