'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ChatMessage } from '@/features/chat/components/chat-message';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
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
        <span className='text-6xl'>{ui.emoji}</span>
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
  characterId,
  isLoading = false,
  className,
}: ChatContainerProps): React.JSX.Element => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      <ScrollArea className='h-full'>
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
            {/* Bottom sentinel for auto-scroll */}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
