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
import { CharacterSelector } from '@/features/characters/components/character-selector';
import { DEFAULT_CHARACTER_ID, getAllCharacters } from '@/features/characters/data';
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

      // Intentionally using window.history.replaceState instead of router.replace().
      // router.replace() would trigger a full Next.js navigation, unmounting this component
      // and interrupting the active stream. Trade-off: useParams() in the sidebar won't
      // update immediately — it reflects the new URL only after a real navigation occurs.
      window.history.replaceState(null, '', `/chat/${convId}`);
    }

    await sendMessage(content, activeCharacterId, convId);

    // After streaming completes: set title from first message + refresh sidebar reactively
    if (isNewConversation) {
      const titleResult = await updateConversationTitleAction(convId, content);
      if (titleResult.error) {
        console.error('[chat-view] Failed to update conversation title:', {
          convId,
          content,
          error: titleResult.error,
        });
        setCreateError('Conversation created, but failed to save its title.');
      } else {
        // Invalidate sidebar query — causes useQuery in sidebar-wrapper to refetch
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  };

  const displayError = createError ?? error;
  const characters = getAllCharacters();
  const isSelectingCharacter = !activeConversationId;

  return (
    <div className='flex flex-col h-full'>
      {isSelectingCharacter && (
        <CharacterSelector
          characters={characters}
          selectedCharacterId={activeCharacterId}
          onSelect={setActiveCharacterId}
          disabled={isStreaming}
        />
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
