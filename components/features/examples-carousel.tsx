/**
 * Examples Carousel Component
 * 
 * Displays multiple example sentences with context filtering
 * and carousel navigation.
 * 
 * Now includes POS validation indicators (Phase 16.1)
 * 
 * @module components/features/examples-carousel
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import type { ExampleSentence } from '@/lib/types/vocabulary';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExamplesCarouselProps {
  /** Array of example sentences */
  examples: ExampleSentence[];
  /** Show context badges */
  showContext?: boolean;
  /** Show POS validation indicators (Phase 16.1) */
  showValidation?: boolean;
}

export function ExamplesCarousel({
  examples,
  showContext = true,
  showValidation = true,
}: ExamplesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!examples || examples.length === 0) {
    return null;
  }

  const currentExample = examples[currentIndex];
  const hasMultiple = examples.length > 1;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % examples.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + examples.length) % examples.length);
  };

  const getContextBadgeColor = (context?: 'formal' | 'informal' | 'neutral') => {
    switch (context) {
      case 'formal':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'informal':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  // Get POS validation icon and tooltip
  const getPOSValidationIndicator = () => {
    const validation = currentExample.posValidation;
    
    if (!validation) {
      return null; // No validation performed
    }

    if (validation.isValid && validation.confidence >= 0.70) {
      // High confidence valid
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        tooltip: `POS verified (${Math.round(validation.confidence * 100)}% confidence)`,
      };
    } else if (validation.isValid && validation.confidence >= 0.30) {
      // Moderate confidence valid
      return {
        icon: CheckCircle2,
        color: 'text-yellow-600 dark:text-yellow-400',
        tooltip: `POS likely valid (${Math.round(validation.confidence * 100)}% confidence)`,
      };
    } else if (!validation.isValid) {
      // Invalid
      return {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        tooltip: `POS mismatch detected: ${validation.reason || 'Unknown'}`,
      };
    } else {
      // Unknown/uncertain
      return {
        icon: HelpCircle,
        color: 'text-gray-600 dark:text-gray-400',
        tooltip: 'POS verification uncertain',
      };
    }
  };

  const validationIndicator = getPOSValidationIndicator();

  return (
    <div className="space-y-3">
      {/* Example display */}
      <div className="relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Context badge */}
        {showContext && currentExample.context && (
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs rounded-full border ${getContextBadgeColor(currentExample.context)}`}
            >
              {currentExample.context}
            </span>
          </div>
        )}

        {/* Spanish */}
        <div className="flex items-start gap-2 mb-2 pr-16">
          <p className="text-sm text-gray-900 dark:text-gray-100 flex-1">
            &ldquo;{currentExample.spanish}&rdquo;
          </p>
          
          {/* POS Validation Indicator (Phase 16.1) */}
          {showValidation && validationIndicator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-shrink-0">
                    {validationIndicator.icon && (
                      <validationIndicator.icon 
                        className={`h-4 w-4 ${validationIndicator.color}`}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{validationIndicator.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* English */}
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          &ldquo;{currentExample.english}&rdquo;
        </p>
      </div>

      {/* Navigation */}
      {hasMultiple && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevious}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous example"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots indicator */}
          <div className="flex gap-1">
            {examples.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-accent'
                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                aria-label={`Go to example ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goToNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Next example"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Counter */}
      {hasMultiple && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Example {currentIndex + 1} of {examples.length}
        </p>
      )}
    </div>
  );
}

