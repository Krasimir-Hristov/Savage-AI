'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { VoiceCallButton } from '@/features/tts/components/VoiceCallButton';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  characterId: string;
  disabled?: boolean;
  onStartVoiceCall?: () => void;
  isVoiceCallLoading?: boolean;
  className?: string;
}

export const ChatInput = ({
  onSend,
  isStreaming,
  characterId,
  disabled = false,
  onStartVoiceCall,
  isVoiceCallLoading = false,
  className,
}: ChatInputProps): React.JSX.Element => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const character = CHARACTERS[characterId];
  const ui = character?.ui ?? CHARACTERS[DEFAULT_CHARACTER_ID]?.ui;
  const placeholder = ui?.placeholder ?? 'Type a message...';

  const isDisabled = disabled || isStreaming;
  const canSend = value.trim().length > 0 && !isDisabled;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Set new height based on scrollHeight, with max constraint
    const newHeight = Math.min(textarea.scrollHeight, 160); // 160px = max-h-40
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSend = (): void => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Input row */}
      <div className='flex items-end gap-2'>
        {onStartVoiceCall && (
          <VoiceCallButton
            onClick={onStartVoiceCall}
            disabled={isDisabled}
            isLoading={isVoiceCallLoading}
          />
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Wait for response...' : placeholder}
          disabled={isDisabled}
          className='max-h-40 resize-none overflow-y-auto'
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size='icon'
          aria-label='Send message'
          className='shrink-0 mb-0.5 cursor-pointer disabled:cursor-not-allowed'
        >
          <Send size={16} />
        </Button>
      </div>

      {/* Keyboard hint — hidden on mobile where it's irrelevant */}
      <p className='hidden sm:block text-xs text-muted-foreground px-1'>
        <kbd className='font-mono'>Enter</kbd> to send &middot;{' '}
        <kbd className='font-mono'>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};
