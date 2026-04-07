'use client';

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import { deleteConversationAction } from '@/features/chat/actions/conversation.actions';
import { ChatSidebar, MobileSidebarTrigger } from '@/features/chat/components/chat-sidebar';
import type { Conversation } from '@/types/chat';

interface SidebarWrapperProps {
  initialConversations: Conversation[];
  preferredCharacter: string;
}

const useSidebarCallbacks = (
  initialConversations: Conversation[],
  preferredCharacter: string,
) => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const currentConversationId = params?.id;

  const handleNewChat = (): void => {
    router.push('/chat');
  };

  const handleSelectConversation = (id: string): void => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteConversation = async (id: string): Promise<void> => {
    await deleteConversationAction(id);
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    if (currentConversationId === id) {
      router.push('/chat');
    }
  };

  return {
    conversations: initialConversations,
    currentConversationId,
    characterId: preferredCharacter,
    onNewChat: handleNewChat,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation: handleDeleteConversation,
  };
};

export const DesktopSidebar = ({
  initialConversations,
  preferredCharacter,
}: SidebarWrapperProps): React.JSX.Element => {
  const props = useSidebarCallbacks(initialConversations, preferredCharacter);
  return <ChatSidebar {...props} />;
};

export const MobileSidebar = ({
  initialConversations,
  preferredCharacter,
}: SidebarWrapperProps): React.JSX.Element => {
  const props = useSidebarCallbacks(initialConversations, preferredCharacter);
  return <MobileSidebarTrigger sidebarProps={props} />;
};
