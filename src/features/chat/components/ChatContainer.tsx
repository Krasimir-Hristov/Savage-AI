'use client';

import React, { useEffect, useRef } from 'react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { ChatMessage } from '@/features/chat/components/ChatMessage';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  isSearchingKnowledge?: boolean;
  characterId: string;
  isLoading?: boolean;
  className?: string;
}

const LoadingSkeleton = (): React.JSX.Element => (
  <div className='flex flex-col gap-4 p-4'>
    {/* Assistant bubble skeleton */}
    <div className='flex gap-3'>
      <Skeleton className='shrink-0 w-8 h-8 rounded-full' />
      <div className='flex flex-col gap-2 max-w-[70%]'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-16 w-full rounded-2xl rounded-tl-sm' />
      </div>
    </div>
    {/* User bubble skeleton */}
    <div className='flex justify-end'>
      <Skeleton className='h-10 w-[50%] rounded-2xl rounded-tr-sm' />
    </div>
    {/* Assistant bubble skeleton */}
    <div className='flex gap-3'>
      <Skeleton className='shrink-0 w-8 h-8 rounded-full' />
      <div className='flex flex-col gap-2 max-w-[70%]'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-24 w-full rounded-2xl rounded-tl-sm' />
      </div>
    </div>
  </div>
);

interface EmptyStateProps {
  characterId: string;
}

const EmptyState = ({ characterId }: EmptyStateProps): React.JSX.Element => {
  const character = CHARACTERS[characterId] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
  const ui = character.ui;

  const greetings: Record<string, string> = {
    'angry-grandpa':
      "What do you want now? Spit it out — I don't have all day. Back in my time, people knew how to get to the point.",
    'balkan-dad':
      "Hmm. So you finally decided to ask for help. The neighbor's kid would have figured it out already, but fine — go ahead.",
  };

  const greeting = greetings[character.id] ?? 'Ask me something... if you dare.';

  return (
    <div className='flex flex-col items-center justify-center h-full gap-6 px-6 py-12 text-center'>
      <div className='flex flex-col items-center gap-3'>
        <CharacterAvatar avatar={character.avatar} name={character.name} size='lg' />
        <h2 className={cn('text-xl font-semibold', ui.colorClass)}>{character.name}</h2>
        <p className='text-sm text-muted-foreground font-medium italic'>{character.personality}</p>
      </div>
      <div className='max-w-sm bg-muted/40 border border-border rounded-2xl rounded-tl-sm px-5 py-3'>
        <p className='text-sm text-foreground/80'>{greeting}</p>
      </div>
      <p className='text-xs text-muted-foreground/50'>
        Type a message below to start the conversation
      </p>
    </div>
  );
};

export const ChatContainer = ({
  messages,
  isStreaming,
  isSearchingKnowledge = false,
  characterId,
  isLoading = false,
  className,
}: ChatContainerProps): React.JSX.Element => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the container directly — never use scrollIntoView which bubbles to parent containers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      <div ref={scrollRef} className='flex-1 overflow-y-auto min-h-0'>
        {isLoading ? (
          <LoadingSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState characterId={characterId} />
        ) : (
          <div className='flex flex-col p-4'>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                characterId={characterId}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            {isSearchingKnowledge && (
              <div className='flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground animate-pulse'>
                <svg className='size-3.5 animate-spin' viewBox='0 0 24 24' fill='none'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                  />
                </svg>
                <span>Searching knowledge base…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
