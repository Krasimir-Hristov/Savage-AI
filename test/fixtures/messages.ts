import type { Message } from '@/types/chat';
import { mockConversationId } from './conversations';

// ---------------------------------------------------------------------------
// Message fixtures
// ---------------------------------------------------------------------------

export const mockMessageId1 = 'e1f2a3b4-c5d6-7890-efab-123456789012';
export const mockMessageId2 = 'f2a3b4c5-d6e7-8901-fabc-234567890123';
export const mockMessageId3 = 'a3b4c5d6-e7f8-9012-abcd-345678901234';

export const mockUserMessage: Message = {
  id: mockMessageId1,
  conversation_id: mockConversationId,
  role: 'user',
  content: 'How do I reverse a string in JavaScript?',
  model: null,
  image_url: null,
  created_at: '2026-01-15T10:00:00.000Z',
};

export const mockAssistantMessage: Message = {
  id: mockMessageId2,
  conversation_id: mockConversationId,
  role: 'assistant',
  content:
    'Pff, you call yourself a developer?! Use `.split("").reverse().join("")` — even my grandson knows that!',
  model: 'google/gemini-2.5-flash-lite',
  image_url: null,
  created_at: '2026-01-15T10:00:05.000Z',
};

export const mockAssistantMessageWithImage: Message = {
  id: mockMessageId3,
  conversation_id: mockConversationId,
  role: 'assistant',
  content: 'Here is your image!',
  model: 'google/gemini-2.5-flash-lite',
  image_url: 'https://mock.supabase.co/storage/v1/object/public/images/test.jpg',
  created_at: '2026-01-15T10:01:00.000Z',
};

export const mockMessages: Message[] = [mockUserMessage, mockAssistantMessage];

export const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  ...mockUserMessage,
  id: crypto.randomUUID(),
  ...overrides,
});

/** Creates a pair: user message + assistant reply */
export const createMockMessagePair = (
  userContent: string,
  assistantContent: string,
  overrides: Partial<Message> = {},
): [Message, Message] => {
  // Strip id and conversation_id from shared overrides to prevent duplicate identifiers
  // across the two messages; each call to createMockMessage generates its own UUID.
  const { id: _id, conversation_id: _cid, ...sharedOverrides } = overrides;
  return [
    createMockMessage({ ...sharedOverrides, role: 'user', content: userContent }),
    createMockMessage({
      ...sharedOverrides,
      role: 'assistant',
      content: assistantContent,
      model: 'google/gemini-2.5-flash-lite',
    }),
  ];
};
