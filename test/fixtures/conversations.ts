import type { Conversation } from '@/types/chat';
import { mockUserId } from './users';

// ---------------------------------------------------------------------------
// Conversation fixtures
// ---------------------------------------------------------------------------

export const mockConversationId = 'c1d2e3f4-a5b6-7890-cdef-123456789012';
export const mockConversationId2 = 'd2e3f4a5-b6c7-8901-defa-234567890123';

export const mockConversation: Conversation = {
  id: mockConversationId,
  user_id: mockUserId,
  character_id: 'angry-grandpa',
  title: 'Test conversation',
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-01-15T10:05:00.000Z',
};

export const mockConversation2: Conversation = {
  id: mockConversationId2,
  user_id: mockUserId,
  character_id: 'balkan-dad',
  title: 'Another conversation',
  created_at: '2026-01-16T09:00:00.000Z',
  updated_at: '2026-01-16T09:30:00.000Z',
};

export const mockConversations: Conversation[] = [mockConversation2, mockConversation];

export const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  ...mockConversation,
  id: crypto.randomUUID(),
  ...overrides,
});
