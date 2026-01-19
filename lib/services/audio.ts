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
 * Select the best quality Spanish voice from available voices
 * Prioritizes natural-sounding voices over robotic ones
 * 
 * @param voices - Available speech synthesis voices
 * @param preferredGender - Preferred voice gender
 * @returns Best matching voice or null
 */
export function selectBestSpanishVoice(
  voices: SpeechSynthesisVoice[],
  preferredGender?: 'male' | 'female'
): SpeechSynthesisVoice | null {
  // Filter to Spanish voices
  const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
  
  if (spanishVoices.length === 0) return null;
  
  // Priority order for voice selection (higher quality voices first)
  const priorityPatterns = [
    // Google voices (typically highest quality)
    /google.*es-ES|google.*es-MX|google.*es-US/i,
    // Microsoft/Edge natural voices
    /microsoft.*natural|edge.*natural/i,
    // Apple premium voices
    /premium|enhanced|improved/i,
    // Standard quality voices
    /es-ES|es-MX|es-US/i,
  ];
  
  for (const pattern of priorityPatterns) {
    const matchingVoices = spanishVoices.filter(voice => 
      pattern.test(voice.name) || pattern.test(voice.voiceURI)
    );
    
    if (matchingVoices.length > 0) {
      // If gender preference specified, try to match it
      if (preferredGender) {
        const genderedVoice = matchingVoices.find(voice => 
          preferredGender === 'female' 
            ? voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('mónica') || voice.name.toLowerCase().includes('paulina')
            : voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man') || voice.name.toLowerCase().includes('jorge') || voice.name.toLowerCase().includes('diego')
        );
        if (genderedVoice) return genderedVoice;
      }
      
      // Return first high-quality match
      return matchingVoices[0];
    }
  }
  
  // Fallback to first Spanish voice
  return spanishVoices[0];
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
    utterance.lang = 'es-ES'; // Spanish (Spain) - high quality default
    utterance.rate = options.speed || 0.85; // Slightly slower for learning (0.85 is clearer than 0.9)
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0; // Full volume
    
    // Select the best quality Spanish voice
    const voices = speechSynthesis.getVoices();
    const bestVoice = selectBestSpanishVoice(voices, options.voice);
    
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log(`🎙️ Selected voice: ${bestVoice.name} (${bestVoice.lang})`);
    } else {
      console.warn('⚠️ No Spanish voice found, using default');
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
 * Plays audio from a URL or triggers browser TTS with best quality voice
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
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Select best quality voice
        const voices = speechSynthesis.getVoices();
        const bestVoice = selectBestSpanishVoice(voices);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        
        speechSynthesis.speak(utterance);
      }
    });
  } else if (text && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Select best quality voice
    const voices = speechSynthesis.getVoices();
    const bestVoice = selectBestSpanishVoice(voices);
    if (bestVoice) {
      utterance.voice = bestVoice;
      console.log(`🎙️ Playing with voice: ${bestVoice.name}`);
    }
    
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

