/**
 * Voice Input Hook
 * 
 * Uses Web Speech API for voice recognition
 * Supports Spanish and English language detection
 * 
 * @module lib/hooks/use-voice-input
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceInputLanguage = 'es' | 'en' | 'auto';

export interface UseVoiceInputOptions {
  language?: VoiceInputLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Custom hook for voice input using Web Speech API
 * 
 * @example
 * const { isListening, transcript, startListening, stopListening } = useVoiceInput({
 *   language: 'es',
 *   onResult: (text) => console.log('Heard:', text)
 * });
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'auto',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onError,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
    } else {
      setIsSupported(false);
      setError('Voice input not supported in this browser');
    }
  }, []);

  // Configure recognition instance
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    // Set language
    if (language === 'auto') {
      // Try to detect language, default to Spanish
      recognition.lang = 'es-ES';
    } else if (language === 'es') {
      recognition.lang = 'es-ES'; // Spanish (Spain) - works for all Spanish dialects
    } else {
      recognition.lang = 'en-US'; // English
    }

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const alternative = lastResult[0];
      
      const newTranscript = alternative.transcript.trim();
      const newConfidence = alternative.confidence;

      setTranscript(newTranscript);
      setConfidence(newConfidence);
      setError(null);

      // Only call onResult for final results
      if (lastResult.isFinal && onResult) {
        onResult(newTranscript, newConfidence);
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Voice input error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or permission denied.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Voice input was cancelled.';
          break;
        default:
          errorMessage = `Voice input error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
      if (onEnd) {
        onEnd();
      }
    };

    // Handle start
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

  }, [language, continuous, interimResults, maxAlternatives, onResult, onError, onEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Voice input not supported');
      return;
    }

    try {
      // Reset state
      setTranscript('');
      setConfidence(0);
      setError(null);
      
      // Start recognition
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting voice input:', err);
      setError('Failed to start voice input');
      setIsListening(false);
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping voice input:', err);
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
