/**
 * Enhanced Audio/Pronunciation Service
 * 
 * Provides text-to-speech pronunciation with multiple accents, speed control,
 * and recording capabilities for Spanish vocabulary.
 * 
 * @module lib/services/audio-enhanced
 */

import type { AudioPronunciation } from '@/lib/types/vocabulary';

/**
 * Spanish accent/region options
 */
export type SpanishAccent = 'spain' | 'mexico' | 'argentina' | 'colombia' | 'neutral';

/**
 * Audio speed options
 */
export type AudioSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5;

/**
 * Gets multiple audio pronunciations for a Spanish word
 * with different accents and speeds
 * 
 * @param text - Spanish text to generate audio for
 * @param options - Audio generation options
 * @returns Array of audio pronunciations
 */
export async function getEnhancedAudio(
  text: string,
  options: {
    accents?: SpanishAccent[];
    speeds?: AudioSpeed[];
  } = {}
): Promise<AudioPronunciation[]> {
  const { accents = ['spain'], speeds = [1.0] } = options;
  const pronunciations: AudioPronunciation[] = [];
  
  // Generate pronunciations for each accent
  for (const accent of accents) {
    for (const speed of speeds) {
      try {
        const pronunciation = await generatePronunciation(text, accent, speed);
        if (pronunciation) {
          pronunciations.push(pronunciation);
        }
      } catch (error) {
        console.error(`Failed to generate pronunciation for ${accent} at ${speed}x:`, error);
      }
    }
  }
  
  return pronunciations;
}

/**
 * Generates a single pronunciation using browser TTS
 * 
 * @param text - Spanish text
 * @param accent - Spanish accent/region
 * @param speed - Playback speed
 * @returns Audio pronunciation data
 */
async function generatePronunciation(
  text: string,
  accent: SpanishAccent,
  speed: AudioSpeed
): Promise<AudioPronunciation | null> {
  if (!('speechSynthesis' in window)) {
    return null;
  }
  
  // Wait for voices to load
  await loadVoices();
  
  const voices = speechSynthesis.getVoices();
  const voice = selectVoiceForAccent(voices, accent);
  
  if (!voice) {
    return null;
  }
  
  // Return pronunciation metadata (actual audio is played on demand)
  return {
    url: '', // Browser TTS doesn't provide a URL
    source: 'tts',
    accent: accent,
    speed: speed,
  };
}

/**
 * Selects the best voice for a given Spanish accent
 * 
 * @param voices - Available speech synthesis voices
 * @param accent - Desired Spanish accent
 * @returns Selected voice or null
 */
function selectVoiceForAccent(
  voices: SpeechSynthesisVoice[],
  accent: SpanishAccent
): SpeechSynthesisVoice | null {
  // Map accents to language codes
  const accentMap: Record<SpanishAccent, string[]> = {
    'spain': ['es-ES', 'es_ES'],
    'mexico': ['es-MX', 'es_MX', 'es-419'],
    'argentina': ['es-AR', 'es_AR', 'es-419'],
    'colombia': ['es-CO', 'es_CO', 'es-419'],
    'neutral': ['es', 'es-ES', 'es-MX'],
  };
  
  const langCodes = accentMap[accent];
  
  // Try to find exact match
  for (const code of langCodes) {
    const voice = voices.find(v => v.lang === code);
    if (voice) return voice;
  }
  
  // Fallback to any Spanish voice
  return voices.find(v => v.lang.startsWith('es')) || null;
}

/**
 * Loads and waits for speech synthesis voices
 * 
 * @returns Promise that resolves when voices are loaded
 */
function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve();
      };
      
      // Timeout after 2 seconds
      setTimeout(() => resolve(), 2000);
    }
  });
}

/**
 * Plays audio with enhanced options (speed, accent)
 * 
 * @param text - Spanish text to speak
 * @param options - Playback options
 * @returns Promise that resolves when speech ends
 */
export async function playEnhancedAudio(
  text: string,
  options: {
    accent?: SpanishAccent;
    speed?: AudioSpeed;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
): Promise<void> {
  const { accent = 'spain', speed = 1.0, onStart, onEnd } = options;
  
  if (!('speechSynthesis' in window)) {
    throw new Error('Speech synthesis not available');
  }
  
  try {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Wait a bit for cancellation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await loadVoices();
    
    const voices = speechSynthesis.getVoices();
    const voice = selectVoiceForAccent(voices, accent);
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = speed;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        onStart?.();
      };
      
      utterance.onend = () => {
        onEnd?.();
        resolve();
      };
      
      utterance.onerror = (event) => {
        // Suppress error 0 (common browser quirk) but log others
        if ((event as any).error !== 0) {
          console.warn('Speech synthesis error:', event);
        }
        onEnd?.();
        resolve(); // Resolve instead of reject to prevent UI breaking
      };
      
      speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('Error playing audio:', error);
    onEnd?.();
    throw error;
  }
}

/**
 * Stops any currently playing audio
 */
export function stopAudio(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

/**
 * Gets available Spanish voices with their metadata
 * 
 * @returns Array of voice information
 */
export async function getAvailableSpanishVoices(): Promise<{
  name: string;
  lang: string;
  accent: SpanishAccent;
  default: boolean;
}[]> {
  await loadVoices();
  
  const voices = speechSynthesis.getVoices();
  const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
  
  return spanishVoices.map(voice => ({
    name: voice.name,
    lang: voice.lang,
    accent: detectAccentFromLang(voice.lang),
    default: voice.default,
  }));
}

/**
 * Detects accent from language code
 * 
 * @param lang - Language code (e.g., 'es-ES', 'es-MX')
 * @returns Detected accent
 */
function detectAccentFromLang(lang: string): SpanishAccent {
  if (lang.includes('ES')) return 'spain';
  if (lang.includes('MX')) return 'mexico';
  if (lang.includes('AR')) return 'argentina';
  if (lang.includes('CO')) return 'colombia';
  return 'neutral';
}

/**
 * Records user pronunciation (requires microphone permission)
 * 
 * @returns Promise that resolves with recorded audio data
 */
export async function recordUserPronunciation(): Promise<AudioPronunciation | null> {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        resolve({
          url: audioUrl,
          source: 'user',
          speed: 1.0,
        });
      };
      
      mediaRecorder.onerror = (error) => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        reject(error);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Recording error:', error);
    return null;
  }
}

/**
 * Plays recorded audio from a URL
 * 
 * @param audioUrl - Audio URL (blob URL or data URL)
 */
export function playRecordedAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    audio.onended = () => resolve();
    audio.onerror = (error) => reject(error);
    
    audio.play().catch(reject);
  });
}

/**
 * Checks if audio recording is available
 * 
 * @returns True if recording is supported
 */
export function isRecordingAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Checks if text-to-speech is available
 * 
 * @returns True if TTS is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

