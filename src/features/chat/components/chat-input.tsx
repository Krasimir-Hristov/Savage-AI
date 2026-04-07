'use client';

import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { CHARACTERS } from '@/features/characters/data';
import { cn } from '@/lib/utils';

const CHARACTER_UI: Record<string, { emoji: string; colorClass: string; placeholder: string }> = {
  'angry-grandpa': {
    emoji: '👴',
    colorClass: 'text-character-grandpa',
    placeholder: "Ask the old man something... if you dare.",
  },
  'balkan-dad': {
    emoji: '👨',
    colorClass: 'text-character-dad',
    placeholder: "Ask your Balkan dad... he'll compare you to someone better.",
  },
};

const FALLBACK_UI = CHARACTER_UI['angry-grandpa'];

interface ChatInputProps {
  onSend: (content: string) => void;
  isStreaming: boolean;
  characterId: string;
  disabled?: boolean;
  className?: string;
}

export const ChatInput = ({
  onSend,
  isStreaming,
  characterId,
  disabled = false,
  className,
}: ChatInputProps): React.JSX.Element => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ui = CHARACTER_UI[characterId] ?? FALLBACK_UI;
  const characterName = CHARACTERS[characterId]?.name ?? 'Unknown';
  const isDisabled = disabled || isStreaming;
  const canSend = value.trim().length > 0 && !isDisabled;

  const handleSend = (): void => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
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
      {/* Character indicator */}
      <div className='flex items-center gap-1.5 px-1'>
        <span className='text-sm'>{ui.emoji}</span>
        <span className={cn('text-xs font-medium', ui.colorClass)}>{characterName}</span>
        {isStreaming && (
          <span className='text-xs text-muted-foreground ml-auto animate-pulse'>typing...</span>
        )}
      </div>

      {/* Input row */}
      <div className='flex items-end gap-2'>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Wait for response...' : ui.placeholder}
          disabled={isDisabled}
          rows={1}
          className='max-h-40 resize-none overflow-y-auto'
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size='icon'
          aria-label='Send message'
          className='shrink-0 mb-0.5'
        >
          <Send size={16} />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className='text-xs text-muted-foreground px-1'>
        <kbd className='font-mono'>Enter</kbd> to send &middot;{' '}
        <kbd className='font-mono'>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
};
