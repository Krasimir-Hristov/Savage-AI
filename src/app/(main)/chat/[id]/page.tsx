import React from 'react';

import { notFound } from 'next/navigation';

import { ChatView } from '@/features/chat/components/chat-view';
import { getConversation, getMessages } from '@/lib/dal';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ConversationPage = async ({ params }: PageProps): Promise<React.JSX.Element> => {
  const { id } = await params;

  const conversation = await getConversation(id).catch((err: unknown) => {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return null;
  });

  if (!conversation) notFound();

  const messages = await getMessages(id).catch((err: unknown) => {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    return null;
  });

  if (!messages) notFound();

  return (
    <div className='flex flex-col h-full'>
      <ChatView
        conversationId={conversation.id}
        initialMessages={messages}
        characterId={conversation.character_id}
      />
    </div>
  );
};

export default ConversationPage;
