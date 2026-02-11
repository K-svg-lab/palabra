/**
 * Deep Learning Card Component (Phase 18.2.2)
 * 
 * Elaborative interrogation prompt that appears every 10-15 cards.
 * Encourages deeper processing through "why/how" questions.
 * 
 * Features:
 * - Auto-skip after 3 seconds if user doesn't interact
 * - Optional response (can submit blank)
 * - Calming, inviting UI (not stressful)
 * - Research-backed effectiveness (d = 0.71)
 * 
 * @module deep-learning-card
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElaborativePrompt } from '@/lib/utils/deep-learning-client';

// ============================================================================
// TYPES
// ============================================================================

interface DeepLearningCardProps {
  word: {
    spanish: string;
    english: string;
  };
  prompt: ElaborativePrompt;
  onComplete: (response: {
    skipped: boolean;
    userResponse?: string;
    responseTime: number;
  }) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeepLearningCard({
  word,
  prompt,
  onComplete,
}: DeepLearningCardProps) {
  const [response, setResponse] = useState('');
  const [timer, setTimer] = useState(3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [shouldAutoSkip, setShouldAutoSkip] = useState(false);
  const startTimeRef = useRef(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasCompletedRef = useRef(false);

  // Auto-skip countdown (ticks every second)
  useEffect(() => {
    if (hasInteracted || hasCompletedRef.current) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          // Signal auto-skip (don't call onComplete here - setState during render error)
          setShouldAutoSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasInteracted]);

  // Handle auto-skip in separate effect (deferred from timer)
  useEffect(() => {
    if (shouldAutoSkip && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Defer to next tick to avoid setState-during-render
      setTimeout(() => {
        const responseTime = Date.now() - startTimeRef.current;
        onComplete({
          skipped: true,
          userResponse: undefined,
          responseTime,
        });
      }, 0);
    }
  }, [shouldAutoSkip, onComplete]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setTimer(999); // Stop countdown
      
      // Focus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleComplete = (skipped: boolean, userResponse: string) => {
    if (hasCompletedRef.current) return; // Prevent double-call
    hasCompletedRef.current = true;
    
    const responseTime = Date.now() - startTimeRef.current;
    onComplete({
      skipped,
      userResponse: userResponse.trim() || undefined,
      responseTime,
    });
  };

  const handleSkip = () => {
    handleComplete(true, '');
  };

  const handleContinue = () => {
    handleComplete(false, response);
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950 dark:via-pink-950 dark:to-purple-950"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 uppercase px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-4 h-4" />
            Deep Learning Moment
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Take a moment to think deeper
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Optional • This helps create stronger memories
          </p>
        </div>
        
        {/* Word Context */}
        <motion.div
          className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-3xl p-8 text-center border border-purple-200 dark:border-purple-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-5xl font-bold mb-3 text-gray-900 dark:text-white">
            {word.spanish}
          </h3>
          <p className="text-2xl text-gray-700 dark:text-gray-300">
            {word.english}
          </p>
        </motion.div>
        
        {/* Elaborative Question */}
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg leading-relaxed text-gray-900 dark:text-white flex-1">
              {prompt.question}
            </p>
          </div>
          
          {/* Optional Hints */}
          {prompt.hints && prompt.hints.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Hint:
              </p>
              {prompt.hints.map((hint, i) => (
                <p key={i} className="text-sm text-gray-600 dark:text-gray-300">
                  {hint}
                </p>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Response Area */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <textarea
            ref={textareaRef}
            value={response}
            onChange={(e) => {
              setResponse(e.target.value);
              handleInteraction();
            }}
            onClick={handleInteraction}
            onFocus={handleInteraction}
            placeholder="Your thoughts... (optional, you can skip)"
            className="w-full p-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[100px] text-base resize-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 py-6 text-base border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
              {!hasInteracted && timer < 999 && (
                <span className="ml-2 flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  {timer}s
                </span>
              )}
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-base font-semibold shadow-lg"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
        
        {/* Educational Note */}
        <motion.p
          className="text-xs text-center text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          💡 Taking time to think deeper helps you remember longer
        </motion.p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// COMPACT VERSION (for in-flow usage)
// ============================================================================

interface DeepLearningCardCompactProps {
  word: {
    spanish: string;
    english: string;
  };
  prompt: ElaborativePrompt;
  onComplete: (response: {
    skipped: boolean;
    userResponse?: string;
    responseTime: number;
  }) => void;
}

export function DeepLearningCardCompact({
  word,
  prompt,
  onComplete,
}: DeepLearningCardCompactProps) {
  const [response, setResponse] = useState('');
  const [timer, setTimer] = useState(3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Auto-skip after 3 seconds if user doesn't interact
  useEffect(() => {
    if (hasInteracted) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          handleComplete(true, '');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasInteracted]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setTimer(999);
    }
  };

  const handleComplete = (skipped: boolean, userResponse: string) => {
    const responseTime = Date.now() - startTimeRef.current;
    onComplete({
      skipped,
      userResponse: userResponse.trim() || undefined,
      responseTime,
    });
  };

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 uppercase px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <Sparkles className="w-4 h-4" />
          Think Deeper
        </span>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Quick Reflection
        </h2>
      </div>
      
      {/* Word */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-2xl p-6 text-center border border-purple-200 dark:border-purple-800">
        <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {word.spanish}
        </h3>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          {word.english}
        </p>
      </div>
      
      {/* Question */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <p className="text-base text-gray-900 dark:text-white">
          {prompt.question}
        </p>
      </div>
      
      {/* Response */}
      <div className="space-y-3">
        <textarea
          value={response}
          onChange={(e) => {
            setResponse(e.target.value);
            handleInteraction();
          }}
          onClick={handleInteraction}
          placeholder="Your thoughts... (optional)"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[80px] text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleComplete(true, '')}
            size="sm"
            className="flex-1"
          >
            Skip {!hasInteracted && `(${timer}s)`}
          </Button>
          <Button
            onClick={() => handleComplete(false, response)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
