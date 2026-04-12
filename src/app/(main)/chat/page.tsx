import React from 'react';

import { ChatView } from '@/features/chat/components/ChatView';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '@/features/characters/data';
import { getUser } from '@/lib/dal';

export const dynamic = 'force-dynamic';

const NewChatPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ character?: string }>;
}): Promise<React.JSX.Element> => {
  const [user, params] = await Promise.all([getUser(), searchParams]);

  const requestedCharacter = params.character;
  const characterId =
    requestedCharacter && CHARACTERS[requestedCharacter]
      ? requestedCharacter
      : (user.preferred_character ?? DEFAULT_CHARACTER_ID);

  return (
    <div className='flex flex-col h-full'>
      <ChatView characterId={characterId} />
    </div>
  );
};

export default NewChatPage;
