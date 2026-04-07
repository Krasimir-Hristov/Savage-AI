import React from 'react';

export const dynamic = 'force-dynamic';

import { ChatView } from '@/features/chat/components/chat-view';
import { DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { getUser } from '@/lib/dal';

const NewChatPage = async (): Promise<React.JSX.Element> => {
  const user = await getUser();
  const characterId = user.preferred_character ?? DEFAULT_CHARACTER_ID;

  return (
    <div className='flex flex-col h-full'>
      <ChatView characterId={characterId} />
    </div>
  );
};

export default NewChatPage;
