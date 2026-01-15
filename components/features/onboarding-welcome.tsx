/**
 * Onboarding Welcome Component
 * 
 * First-time user experience that introduces the app and its features.
 * Shows on first launch and guides users through getting started.
 * 
 * @module components/features/onboarding-welcome
 */

'use client';

import { useState } from 'react';
import { ChevronRight, BookOpen, Brain, TrendingUp, X, Cloud } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

interface OnboardingWelcomeProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS = [
  {
    icon: BookOpen,
    title: 'Build Your Vocabulary',
    description: 'Add Spanish words easily. We automatically fetch translations, examples, and pronunciation for you.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Brain,
    title: 'Smart Spaced Repetition',
    description: 'Our intelligent algorithm schedules reviews at the optimal time to maximize retention.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: TrendingUp,
    title: 'Track Your Progress',
    description: 'Watch your vocabulary grow with detailed statistics, streaks, and achievement milestones.',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: Cloud,
    title: 'Sync Across Devices',
    description: 'Sign in to access your vocabulary from any device. Your progress is automatically backed up and synced.',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    isAuthStep: true,
  },
];

/**
 * Onboarding welcome screen component
 * Multi-step introduction to the app
 * 
 * @param props - Component props
 * @returns Onboarding component
 */
export function OnboardingWelcome({ onComplete, onSkip }: OnboardingWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Logo size="medium" showText />
            <div className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
              Welcome
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step Indicator */}
          <div className="flex gap-2 mb-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-accent'
                    : index < currentStep
                    ? 'bg-accent/40'
                    : 'bg-gray-200 dark:bg-gray-800'
                }`}
                role="progressbar"
                aria-valuenow={(currentStep + 1) / ONBOARDING_STEPS.length * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center space-y-6 animate-in fade-in duration-300" key={currentStep}>
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto rounded-2xl ${step.bgColor} flex items-center justify-center`}>
              <Icon className={`w-10 h-10 ${step.color}`} />
            </div>

            {/* Title */}
            <div>
              <h2 id="onboarding-title" className="text-2xl font-bold mb-3">
                {step.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Authentication Options (Last Step) */}
            {step.isAuthStep && (
              <div className="space-y-3 pt-4">
                <Link
                  href="/signup"
                  className="block w-full px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-lg shadow-accent/20"
                >
                  Create Account
                </Link>
                <Link
                  href="/signin"
                  className="block w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <button
                  onClick={onComplete}
                  className="w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm font-medium"
                >
                  Skip for now (use offline)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-0 disabled:cursor-default transition-all"
            aria-label="Previous step"
          >
            Previous
          </button>

          {/* Step Counter */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>

          {/* Next/Get Started Button - Hidden on auth step */}
          {!step.isAuthStep && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-accent/20"
              aria-label={isLastStep ? 'Complete onboarding' : 'Next step'}
            >
              {isLastStep ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

