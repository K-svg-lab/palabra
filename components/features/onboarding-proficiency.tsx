/**
 * Proficiency Onboarding Component (Phase 18.1.1)
 * 
 * Collects user proficiency level and language preferences during onboarding.
 * This is a separate component that can be integrated into the main onboarding flow.
 * 
 * @module components/features/onboarding-proficiency
 */

'use client';

import { useState } from 'react';
import { ChevronRight, Languages, GraduationCap } from 'lucide-react';
import { type CEFRLevel, CEFR_LEVELS, getLevelDescription } from '@/lib/types/proficiency';

interface OnboardingProficiencyProps {
  onComplete: (data: ProficiencyData) => void;
  onSkip: () => void;
}

export interface ProficiencyData {
  languageLevel: CEFRLevel;
  nativeLanguage: string;
  targetLanguage: string;
  dailyGoal: number;
}

const CEFR_OPTIONS = [
  {
    level: 'A1' as CEFRLevel,
    title: 'Beginner (A1-A2)',
    description: 'Just starting, know basic words',
    icon: '🌱',
  },
  {
    level: 'B1' as CEFRLevel,
    title: 'Intermediate (B1-B2)',
    description: 'Can hold conversations, building vocabulary',
    icon: '🌿',
    recommended: true,
  },
  {
    level: 'C1' as CEFRLevel,
    title: 'Advanced (C1-C2)',
    description: 'Fluent, refining vocabulary',
    icon: '🌳',
  },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

const DAILY_GOAL_OPTIONS = [
  { value: 5, label: '5 words/day', description: 'Relaxed pace' },
  { value: 10, label: '10 words/day', description: 'Steady progress', recommended: true },
  { value: 20, label: '20 words/day', description: 'Ambitious' },
  { value: 30, label: '30 words/day', description: 'Intensive' },
];

/**
 * Proficiency onboarding screen component
 * Collects language level, native/target language, and daily goal
 */
export function OnboardingProficiency({ onComplete, onSkip }: OnboardingProficiencyProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B1');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [dailyGoal, setDailyGoal] = useState(10);

  const handleNext = () => {
    if (step === 3) {
      onComplete({
        languageLevel: selectedLevel,
        nativeLanguage,
        targetLanguage,
        dailyGoal,
      });
    } else {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proficiency-onboarding-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 my-auto max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="proficiency-onboarding-title" className="text-lg sm:text-xl font-bold">
                Personalize Your Learning
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0 px-2"
          >
            Skip
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  s === step
                    ? 'bg-accent'
                    : s < step
                    ? 'bg-accent/40'
                    : 'bg-gray-200 dark:bg-gray-800'
                }`}
                role="progressbar"
                aria-valuenow={step === s ? 100 : step > s ? 100 : 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10 overflow-y-auto flex-1" key={step}>
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Languages className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold">Choose Your Languages</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  What languages are you working with?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    I speak
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setNativeLanguage(lang.code)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          nativeLanguage === lang.code
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{lang.flag}</div>
                        <div className="font-medium">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    I want to learn
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setTargetLanguage(lang.code)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          targetLanguage === lang.code
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{lang.flag}</div>
                        <div className="font-medium">{lang.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold">What's your Spanish level?</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  Don't worry! We'll adjust as you learn.
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {CEFR_OPTIONS.map((option) => (
                  <button
                    key={option.level}
                    onClick={() => setSelectedLevel(option.level)}
                    className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all text-left relative min-h-[44px] ${
                      selectedLevel === option.level
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {option.recommended && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-3xl sm:text-4xl flex-shrink-0">{option.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg mb-1">{option.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs sm:text-sm">
                <p className="flex items-start gap-2 text-blue-900 dark:text-blue-100">
                  <span className="flex-shrink-0">💡</span>
                  <span>
                    <strong>Tip:</strong> We'll adjust your level automatically based on your performance. If you're unsure, B1 (Intermediate) is a great starting point!
                  </span>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <div className="text-4xl sm:text-5xl">🎯</div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold">Set Your Daily Goal</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  How many new words do you want to learn each day?
                </p>
              </div>

              <div className="space-y-3">
                {DAILY_GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDailyGoal(option.value)}
                    className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all text-left relative min-h-[44px] ${
                      dailyGoal === option.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    {option.recommended && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                    <div className="font-semibold text-base sm:text-lg mb-1">
                      {option.label}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-xs sm:text-sm">
                <p className="flex items-start gap-2 text-green-900 dark:text-green-100">
                  <span className="flex-shrink-0">✨</span>
                  <span>
                    <strong>You can always change this later</strong> in your settings. Start with what feels comfortable and adjust as you go!
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-0 disabled:cursor-default transition-all min-h-[44px]"
            aria-label="Previous step"
          >
            Previous
          </button>

          {/* Step Counter */}
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {step} of 3
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="px-4 sm:px-6 py-2 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-accent/20 min-h-[44px] text-sm sm:text-base"
            aria-label={step === 3 ? 'Complete setup' : 'Next step'}
          >
            {step === 3 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
