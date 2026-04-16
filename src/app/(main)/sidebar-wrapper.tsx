'use client';

import React from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import {
  deleteConversationAction,
  renameConversationAction,
} from '@/features/chat/actions/conversation.actions';
import { ChatSidebar, MobileSidebarTrigger } from '@/features/chat/components/ChatSidebar';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import type { Conversation } from '@/types/chat';

interface SidebarWrapperProps {
  initialConversations: Conversation[];
  preferredCharacter: string;
}

interface SidebarCallbacksResult {
  conversations: Conversation[];
  currentConversationId: string | undefined;
  characterId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<void>;
  onRenameConversation: (id: string, title: string) => Promise<void>;
}

const useSidebarCallbacks = (
  initialConversations: Conversation[],
  preferredCharacter: string
): SidebarCallbacksResult => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const currentConversationId = params?.id;

  // Keep conversations list in sync client-side after mutations
  const { data: conversations = initialConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return (await res.json()) as Conversation[];
    },
    initialData: initialConversations,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Derive active character from the current conversation, fallback to preferredCharacter
  const activeConversation = conversations.find((c) => c.id === currentConversationId);
  const characterId =
    activeConversation?.character_id ??
    (CHARACTERS[preferredCharacter] ? preferredCharacter : DEFAULT_CHARACTER_ID);

  const handleNewChat = (): void => {
    // Append a unique timestamp so Next.js always sees a different URL and triggers
    // a real navigation — necessary because window.history.replaceState (used by
    // ChatView after the first message) desyncs the Next.js router from the browser
    // URL, making router.push('/chat') a no-op when the router thinks it's already there.
    router.push(`/chat?_r=${Date.now()}`);
  };

  const handleSelectConversation = (id: string): void => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteConversation = async (id: string): Promise<void> => {
    const result = await deleteConversationAction(id);
    if (result.error) {
      console.error('Failed to delete conversation:', result.error);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    if (currentConversationId === id) {
      router.push('/chat');
    }
  };

  const handleRenameConversation = async (id: string, title: string): Promise<void> => {
    const result = await renameConversationAction(id, title);
    if (result.error) {
      console.error('Failed to rename conversation:', result.error);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return {
    conversations,
    currentConversationId,
    characterId,
    onNewChat: handleNewChat,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation: handleDeleteConversation,
    onRenameConversation: handleRenameConversation,
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
