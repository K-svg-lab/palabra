/**
 * Voice Input Button Component
 * 
 * Microphone button with visual feedback for voice input
 * Shows different states: idle, listening, processing
 * 
 * @module components/ui/voice-input-button
 */

'use client';

import { Mic, MicOff } from 'lucide-react';

export interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Voice Input Button Component
 * 
 * @example
 * <VoiceInputButton
 *   isListening={isListening}
 *   isSupported={isSupported}
 *   onClick={handleVoiceInput}
 * />
 */
export function VoiceInputButton({
  isListening,
  isSupported,
  disabled = false,
  onClick,
  className = '',
}: VoiceInputButtonProps) {
  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  const isDisabled = disabled || !isSupported;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative
        w-9 h-9
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isListening 
          ? 'bg-error text-white shadow-lg scale-110 animate-pulse' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
        ${className}
      `}
      title={isListening ? 'Stop recording' : 'Start voice input'}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={isListening}
    >
      {/* Mic Icon */}
      {isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}

      {/* Listening indicator (pulsing ring) */}
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-error opacity-40 animate-ping" />
      )}
    </button>
  );
}

/**
 * Voice Input Button with Tooltip (for desktop)
 */
export function VoiceInputButtonWithTooltip(props: VoiceInputButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <VoiceInputButton {...props} />
      </div>

      {/* Tooltip */}
      {showTooltip && !props.isListening && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
          Click to speak
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

// Add React import for tooltip component
import React from 'react';
