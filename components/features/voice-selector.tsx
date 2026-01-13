/**
 * Voice Selector Component
 * 
 * Shows available Spanish voices on the user's system
 * and allows direct voice selection.
 * 
 * @module components/features/voice-selector
 */

'use client';

import { useState, useEffect } from 'react';
import { Volume2, AlertCircle } from 'lucide-react';

interface VoiceInfo {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

interface VoiceSelectorProps {
  /** Currently selected voice name */
  selectedVoice?: string;
  /** Callback when voice is selected */
  onVoiceSelect?: (voice: SpeechSynthesisVoice) => void;
  /** Test text for preview */
  testText?: string;
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceSelect,
  testText = "Hola, ¿cómo estás?" 
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const spanishVoices = allVoices.filter(v => v.lang.startsWith('es'));
      
      setAvailableVoices(spanishVoices);
      setVoices(spanishVoices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService,
      })));
    };

    loadVoices();
    
    // Voices might load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleTest = (voice: SpeechSynthesisVoice) => {
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancellation completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.voice = voice;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (event) => {
          console.warn('Speech synthesis error:', event);
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
      }, 100);
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsPlaying(false);
    }
  };

  const getVoiceLabel = (lang: string) => {
    const labels: Record<string, string> = {
      'es-ES': '🇪🇸 Spain',
      'es-MX': '🇲🇽 Mexico',
      'es-AR': '🇦🇷 Argentina',
      'es-CO': '🇨🇴 Colombia',
      'es-US': '🇺🇸 US Spanish',
      'es-CL': '🇨🇱 Chile',
      'es-PE': '🇵🇪 Peru',
      'es': '🌎 Spanish',
    };
    return labels[lang] || `🌎 ${lang}`;
  };

  if (voices.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
              No Spanish voices found
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Your system doesn't have Spanish voices installed. Audio will use the default system voice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with info toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Available Voices ({voices.length})</h4>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs text-accent hover:underline"
        >
          {showInfo ? 'Hide' : 'Show'} Info
        </button>
      </div>

      {/* Info message */}
      {showInfo && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-2">
          <p>
            <strong>Note:</strong> Accent options depend on voices installed on your system.
          </p>
          <p>
            <strong>macOS:</strong> System Settings → Accessibility → Spoken Content → System Voices → Manage Voices
          </p>
          <p>
            <strong>Windows:</strong> Settings → Time & Language → Speech → Manage Voices
          </p>
          <p>
            Download additional Spanish voices (Paulina, Jorge, Monica, etc.) for authentic regional accents!
          </p>
        </div>
      )}

      {/* Voice list */}
      <div className="space-y-2">
        {availableVoices.map((voice, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border transition-colors ${
              selectedVoice === voice.name
                ? 'bg-accent/10 border-accent'
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {getVoiceLabel(voice.lang)}
                  </span>
                  {voice.default && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      DEFAULT
                    </span>
                  )}
                  {voice.localService && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      LOCAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {voice.name}
                </p>
              </div>

              {/* Test button */}
              <button
                type="button"
                onClick={() => handleTest(voice)}
                disabled={isPlaying}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                aria-label="Test voice"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-accent animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Single voice warning */}
      {voices.length === 1 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 <strong>Tip:</strong> Only one Spanish voice detected. Download more voices from your system settings to hear different regional accents!
          </p>
        </div>
      )}
    </div>
  );
}

