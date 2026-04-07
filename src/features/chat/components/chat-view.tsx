'use client';

import React, { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import {
  createConversationAction,
  updateConversationTitleAction,
} from '@/features/chat/actions/conversation.actions';
import { ChatContainer } from '@/features/chat/components/chat-container';
import { ChatInput } from '@/features/chat/components/chat-input';
import { useChat } from '@/features/chat/hooks/use-chat';
import { DEFAULT_CHARACTER_ID, getAllCharacters } from '@/features/characters/data';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface ChatViewProps {
  /** undefined = new chat (no conversation created yet) */
  conversationId?: string;
  initialMessages?: Message[];
  characterId: string;
}

export const ChatView = ({
  conversationId,
  initialMessages,
  characterId: initialCharacterId,
}: ChatViewProps): React.JSX.Element => {
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    conversationId
  );
  const [activeCharacterId, setActiveCharacterId] = useState(
    initialCharacterId || DEFAULT_CHARACTER_ID
  );
  const [createError, setCreateError] = useState<string | null>(null);

  const { messages, isStreaming, error, sendMessage } = useChat({
    initialMessages: initialMessages ?? [],
  });

  const handleSend = async (content: string): Promise<void> => {
    setCreateError(null);
    let convId = activeConversationId;
    let isNewConversation = false;

    // New chat: create the conversation before the first message
    if (!convId) {
      const result = await createConversationAction(activeCharacterId);

      if ('error' in result) {
        setCreateError(result.error);
        return;
      }

      convId = result.id;
      isNewConversation = true;
      setActiveConversationId(convId);

      // Update URL bar without unmounting this component (router.replace would remount)
      window.history.replaceState(null, '', `/chat/${convId}`);
    }

    await sendMessage(content, activeCharacterId, convId);

    // After streaming completes: set title from first message + refresh sidebar reactively
    if (isNewConversation) {
      const titleResult = await updateConversationTitleAction(convId, content);
      if (!titleResult.error) {
        // Invalidate sidebar query — causes useQuery in sidebar-wrapper to refetch
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  };

  const displayError = createError ?? error;
  const characters = getAllCharacters();
  const isNewChat = !conversationId;

  return (
    <div className='flex flex-col h-full'>
      {/* Character switcher — only on new chat, before conversation is created */}
      {isNewChat && (
        <div className='shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50'>
          <span className='text-xs text-muted-foreground shrink-0'>Talking to:</span>
          <div className='flex items-center gap-1.5 flex-wrap'>
            {characters.map((char) => {
              const isActive = char.id === activeCharacterId;
              return (
                <button
                  key={char.id}
                  type='button'
                  onClick={() => setActiveCharacterId(char.id)}
                  disabled={isStreaming}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    isActive
                      ? 'bg-muted text-foreground ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <span>{char.ui.emoji}</span>
                  <span>{char.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error banner */}
      {displayError && (
        <div className='shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-destructive bg-destructive/10 border-b border-destructive/20'>
          <AlertCircle size={14} className='shrink-0' />
          <span>{displayError}</span>
        </div>
      )}

      <ChatContainer
        messages={messages}
        isStreaming={isStreaming}
        characterId={activeCharacterId}
        className='flex-1 min-h-0'
      />

      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        characterId={activeCharacterId}
        className='shrink-0'
      />
    </div>
  );
};
