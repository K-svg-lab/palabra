/**
 * Loading Components
 * 
 * Reusable loading states for different UI contexts
 * 
 * @module components/shared/loading
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Full page loading spinner
 * 
 * @returns Full page loading component
 */
export function LoadingPage({ message = 'Loading...' }: { message?: string }): React.ReactElement {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Card loading skeleton
 * 
 * @returns Card skeleton component
 */
export function LoadingCard(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * List loading skeleton
 * 
 * @returns List skeleton component
 */
export function LoadingList({ count = 3 }: { count?: number }): React.ReactElement {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline loading spinner
 * 
 * @returns Inline spinner component
 */
export function LoadingSpinner({ 
  size = 'md',
  className = '',
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}): React.ReactElement {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={`${sizeClasses[size]} text-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Button loading state
 * 
 * @returns Button loading component
 */
export function LoadingButton({ 
  children,
  isLoading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
}): React.ReactElement {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`relative ${props.className || ''}`}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : ''}>
        {children}
      </span>
    </button>
  );
}

