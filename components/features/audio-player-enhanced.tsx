/**
 * Enhanced Audio Player Component
 * 
 * Audio player with speed control, multiple accents, and recording features.
 * 
 * @module components/features/audio-player-enhanced
 */

'use client';

import { useState } from 'react';
import { Volume2, Pause, Mic, Gauge, Info } from 'lucide-react';
import { playEnhancedAudio, stopAudio, type SpanishAccent, type AudioSpeed } from '@/lib/services/audio-enhanced';
import { VoiceSelector } from './voice-selector';

interface AudioPlayerEnhancedProps {
  /** Spanish text to pronounce */
  text: string;
  /** Show speed control */
  showSpeedControl?: boolean;
  /** Show accent selector */
  showAccentSelector?: boolean;
  /** Show recording button */
  showRecording?: boolean;
  /** Callback when recording completes */
  onRecordingComplete?: (audioUrl: string) => void;
}

export function AudioPlayerEnhanced({
  text,
  showSpeedControl = true,
  showAccentSelector = false,
  showRecording = false,
  onRecordingComplete,
}: AudioPlayerEnhancedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<AudioSpeed>(1.0);
  const [accent, setAccent] = useState<SpanishAccent>('spain');
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);

  const speeds: AudioSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];
  const accents: Array<{ value: SpanishAccent; label: string }> = [
    { value: 'spain', label: '🇪🇸 Spain' },
    { value: 'mexico', label: '🇲🇽 Mexico' },
    { value: 'argentina', label: '🇦🇷 Argentina' },
    { value: 'colombia', label: '🇨🇴 Colombia' },
  ];

  const handlePlay = async () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      await playEnhancedAudio(text, {
        speed,
        accent,
        onEnd: () => setIsPlaying(false),
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (newSpeed: AudioSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    }
  };

  const handleAccentChange = (newAccent: SpanishAccent) => {
    setAccent(newAccent);
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="text-sm font-medium">Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-medium">Play</span>
            </>
          )}
        </button>

        {/* Speed indicator */}
        {showSpeedControl && (
          <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            <Gauge className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <span className="font-medium">{speed}x</span>
          </div>
        )}

        {/* Recording button */}
        {showRecording && (
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label="Record pronunciation"
            title="Record your pronunciation"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Speed control */}
      {showSpeedControl && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
            Playback Speed
          </label>
          <div className="flex gap-1">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s)}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  speed === s
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accent selector */}
      {showAccentSelector && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Accent/Region
            </label>
            <button
              type="button"
              onClick={() => setShowVoiceInfo(!showVoiceInfo)}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {showVoiceInfo ? 'Hide' : 'Show'} Available Voices
            </button>
          </div>
          
          {!showVoiceInfo ? (
            <div className="grid grid-cols-2 gap-1">
              {accents.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => handleAccentChange(a.value)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    accent === a.value
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2">
              <VoiceSelector testText={text} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

