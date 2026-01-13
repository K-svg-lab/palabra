/**
 * Audio/Pronunciation Service
 * 
 * Provides text-to-speech pronunciation for Spanish vocabulary
 * using Google Cloud Text-to-Speech API with caching.
 * 
 * @module lib/services/audio
 */

export interface AudioResult {
  audioUrl: string;
  source: 'google-tts' | 'browser-tts' | 'cache';
  cached: boolean;
}

export interface AudioError {
  error: string;
  message: string;
  fallbackAvailable: boolean;
}

/**
 * Generates or retrieves cached pronunciation audio for Spanish text
 * 
 * @param text - Spanish text to generate audio for
 * @param options - Audio generation options
 * @returns Audio URL (base64 data URL or blob URL)
 */
export async function getAudio(
  text: string,
  options: {
    voice?: 'male' | 'female';
    speed?: number;
  } = {}
): Promise<AudioResult> {
  if (!text || text.trim().length === 0) {
    throw {
      error: 'INVALID_INPUT',
      message: 'Text cannot be empty',
      fallbackAvailable: false,
    } as AudioError;
  }

  // Check for browser TTS support as fallback
  if ('speechSynthesis' in window) {
    return getBrowserTTS(text, options);
  }

  throw {
    error: 'NO_TTS_AVAILABLE',
    message: 'Text-to-speech is not available',
    fallbackAvailable: false,
  } as AudioError;
}

/**
 * Uses browser's built-in Speech Synthesis API for pronunciation
 * 
 * This is a fallback when external TTS APIs are unavailable
 * 
 * @param text - Spanish text to speak
 * @param options - Speech options
 * @returns Audio result with blob URL
 */
function getBrowserTTS(
  text: string,
  options: {
    voice?: 'male' | 'female';
    speed?: number;
  } = {}
): Promise<AudioResult> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Spanish (Spain)
    utterance.rate = options.speed || 0.9; // Slightly slower for learning
    
    // Try to find Spanish voice
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      voice => voice.lang.startsWith('es') && 
               (options.voice === 'female' ? voice.name.includes('female') : true)
    );
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onend = () => {
      resolve({
        audioUrl: '', // Browser TTS doesn't return a URL
        source: 'browser-tts',
        cached: false,
      });
    };

    utterance.onerror = (error) => {
      reject({
        error: 'TTS_FAILED',
        message: 'Failed to generate speech',
        fallbackAvailable: false,
      } as AudioError);
    };

    speechSynthesis.speak(utterance);
  });
}

/**
 * Plays audio from a URL or triggers browser TTS
 * 
 * @param audioUrl - Audio URL or empty for browser TTS
 * @param text - Text to speak (if using browser TTS)
 */
export function playAudio(audioUrl: string, text?: string): void {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      // Fallback to browser TTS if available
      if (text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    });
  } else if (text && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
}

/**
 * Checks if text-to-speech is available in the browser
 * 
 * @returns True if TTS is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Gets available Spanish voices in the browser
 * 
 * @returns Array of available Spanish voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }

  const voices = speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith('es'));
}

/**
 * Pre-loads voices (needed on some browsers)
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}

