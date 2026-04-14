'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react';

import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceCallOverlayProps {
  signedUrl: string;
  promptOverride: string;
  character: Character;
  onEnd: (transcript: TranscriptEntry[]) => void;
}

// Waveform bar animation — 5 bars with independent delays
const WaveformBars = ({ active }: { active: boolean }): React.JSX.Element => (
  <div className='flex items-center gap-0.75 h-8' aria-hidden='true'>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={cn(
          'w-1 rounded-full bg-primary transition-all duration-150',
          active ? 'animate-bounce' : 'h-1 opacity-40'
        )}
        style={
          active
            ? {
                animationDelay: `${i * 80}ms`,
                animationDuration: `${600 + i * 80}ms`,
                height: `${12 + ((i * 7) % 24)}px`,
              }
            : undefined
        }
      />
    ))}
  </div>
);

// Inner component — must be inside ConversationProvider
const VoiceCallInner = ({
  signedUrl,
  character,
  onEnd,
}: {
  signedUrl: string;
  character: Character;
  onEnd: (transcript: TranscriptEntry[]) => void;
}): React.JSX.Element => {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();

  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const [avatarError, setAvatarError] = useState(false);

  // Start the voice session immediately on mount
  useEffect(() => {
    let cancelled = false;

    const connect = async (): Promise<void> => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!cancelled) {
          await startSession({ signedUrl });
        }
      } catch (err) {
        console.error('[VoiceCallOverlay] Failed to start session:', err);
        if (!cancelled) onEnd([]);
      }
    };

    void connect();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = useCallback(async (): Promise<void> => {
    await endSession();
    onEnd(transcriptRef.current);
  }, [endSession, onEnd]);

  const statusLabel =
    status === 'connecting'
      ? 'Connecting...'
      : isSpeaking
        ? 'Speaking...'
        : status === 'connected'
          ? 'Listening...'
          : 'Ended';

  return (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm'>
      {/* Character avatar */}
      <div className='relative mb-6'>
        <div
          className={cn(
            'rounded-full overflow-hidden border-4 transition-all duration-300',
            isSpeaking ? 'border-primary shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'border-border'
          )}
          style={{ width: 160, height: 160 }}
        >
          {!avatarError && character.avatar ? (
            <Image
              src={character.avatar}
              alt={character.name}
              width={160}
              height={160}
              className='object-cover w-full h-full'
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-muted text-5xl'>
              {character.ui.emoji}
            </div>
          )}
        </div>

        {/* Pulsing ring when speaking */}
        {isSpeaking && (
          <div className='absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30' />
        )}
      </div>

      {/* Character name */}
      <h2 className='text-xl font-bold mb-1'>{character.name}</h2>

      {/* Status label */}
      <p className='text-sm text-muted-foreground mb-6'>{statusLabel}</p>

      {/* Waveform */}
      <div className='mb-8'>
        <WaveformBars active={isSpeaking} />
      </div>

      {/* Controls */}
      <div className='flex items-center gap-4'>
        {/* Mute toggle */}
        <Button
          onClick={() => setMuted(!isMuted)}
          variant='outline'
          size='icon'
          className='w-12 h-12 rounded-full'
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>

        {/* End call */}
        <Button
          onClick={handleEnd}
          size='icon'
          className='w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          aria-label='End voice call'
        >
          <PhoneOff size={24} />
        </Button>
      </div>
    </div>
  );
};

export const VoiceCallOverlay = ({
  signedUrl,
  promptOverride,
  character,
  onEnd,
}: VoiceCallOverlayProps): React.JSX.Element => (
  <ConversationProvider
    overrides={{
      agent: {
        prompt: { prompt: promptOverride },
      },
    }}
  >
    <VoiceCallInner signedUrl={signedUrl} character={character} onEnd={onEnd} />
  </ConversationProvider>
);
