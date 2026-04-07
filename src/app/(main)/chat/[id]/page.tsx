import React from 'react';

import { notFound } from 'next/navigation';

import { ChatView } from '@/features/chat/components/chat-view';
import { getConversation, getMessages } from '@/lib/dal';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ConversationPage = async ({ params }: PageProps): Promise<React.JSX.Element> => {
  const { id } = await params;

  let conversation: Awaited<ReturnType<typeof getConversation>> | null = null;
  try {
    conversation = await getConversation(id);
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    notFound();
  }

  if (!conversation) notFound();

  let messages: Awaited<ReturnType<typeof getMessages>> | null = null;
  try {
    messages = await getMessages(id);
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    notFound();
  }

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
