import React from 'react';
import {Pause, Play, Square, Volume2} from 'lucide-react';
import {useApp} from '../context/AppContext';

interface SpeakButtonProps {
  id: string;
  label: string;
  text: string;
  compact?: boolean;
  className?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  id,
  label,
  text,
  compact = false,
  className = '',
}) => {
  const {
    activeSpeechId,
    playbackState,
    speakSection,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  } = useApp();

  const isThisActive = activeSpeechId === id && playbackState !== 'idle';
  const isPlaying = activeSpeechId === id && playbackState === 'playing';
  const isPaused = activeSpeechId === id && playbackState === 'paused';

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      pauseSpeech();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      speakSection(id, label, text);
    }
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={handleTap}
          aria-label={isPlaying ? `Pause ${label}` : isPaused ? `Resume ${label}` : `Listen to ${label}`}
          aria-pressed={isThisActive}
          className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
            isThisActive
              ? 'bg-[#16803C] border-[#16803C] text-white'
              : 'bg-[#F3F8F0] border-[#183B2B]/15 text-[#16803C] hover:bg-[#DDEFE0]'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" aria-hidden="true" />
          ) : isPaused ? (
            <Play className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        {isThisActive && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stopSpeech();
            }}
            aria-label={`Stop ${label}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          >
            <Square className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleTap}
        aria-pressed={isThisActive}
        className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
          isThisActive
            ? 'bg-[#16803C] border-[#16803C] text-white'
            : 'bg-[#F3F8F0] border-[#183B2B]/15 text-[#183B2B] hover:bg-[#DDEFE0]'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-4 h-4" aria-hidden="true" />
            <span>Pause Audio</span>
          </>
        ) : isPaused ? (
          <>
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Resume Audio</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-[#16803C]" aria-hidden="true" />
            <span>Listen</span>
          </>
        )}
      </button>
      {isThisActive && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            stopSpeech();
          }}
          aria-label="Stop reading aloud"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <Square className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </span>
  );
};
