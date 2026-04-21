import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

// ---------------------------------------------------------------------------
// Make React's cache() transparent — no deduplication between test calls
// ---------------------------------------------------------------------------
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: unknown) => fn };
});

// ---------------------------------------------------------------------------
// Hoist createClient mock
// ---------------------------------------------------------------------------
const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { verifySession, getConversations, getMessages } from '@/lib/dal';
import { createMockQueryBuilder, createMockSupabaseClient } from '../../../test/mocks/supabase';
import { mockConversationId, mockConversations } from '../../../test/fixtures/conversations';
import { mockAssistantMessage, mockUserMessage } from '../../../test/fixtures/messages';
import { mockOtherUserId, mockUserEmail, mockUserId } from '../../../test/fixtures/users';

// ---------------------------------------------------------------------------
// verifySession()
// ---------------------------------------------------------------------------

describe('verifySession()', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    // Use fixture userId so ownership tests are consistent
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: mockUserId, email: mockUserEmail } },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it('valid session → returns userId and email', async () => {
    const session = await verifySession();
    expect(session.userId).toBe(mockUserId);
    expect(session.email).toBe(mockUserEmail);
  });

  it('user is null → calls redirect("/login") and throws', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // redirect is mocked (no-op), then user.id throws TypeError
    // → caught and re-thrown as 'verifySession failed: ...'
    await expect(verifySession()).rejects.toThrow('verifySession failed');
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login');
  });

  it('Supabase auth error → calls redirect("/login") and throws', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    });

    await expect(verifySession()).rejects.toThrow('verifySession failed');
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login');
  });
});

// ---------------------------------------------------------------------------
// getConversations()
// ---------------------------------------------------------------------------

describe('getConversations()', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it('returns conversations for the given userId', async () => {
    mockSupabase.from = vi
      .fn()
      .mockImplementation(() => createMockQueryBuilder({ data: mockConversations, error: null }));

    const result = await getConversations(mockUserId);
    expect(result).toEqual(mockConversations);
    expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
  });

  it('returns empty array when there are no conversations', async () => {
    mockSupabase.from = vi
      .fn()
      .mockImplementation(() => createMockQueryBuilder({ data: [], error: null }));

    const result = await getConversations(mockUserId);
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockSupabase.from = vi
      .fn()
      .mockImplementation(() => createMockQueryBuilder({ data: null, error: null }));

    const result = await getConversations(mockUserId);
    expect(result).toEqual([]);
  });

  it('throws when createClient rejects (DB unavailable)', async () => {
    mockCreateClient.mockRejectedValue(new Error('DB connection failed'));

    await expect(getConversations(mockUserId)).rejects.toThrow('getConversations failed');
  });
});

// ---------------------------------------------------------------------------
// getMessages()
// ---------------------------------------------------------------------------

describe('getMessages()', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    // verifySession calls auth.getUser — return consistent mockUserId
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: mockUserId, email: mockUserEmail } },
      error: null,
    });
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it('returns messages for owned conversation', async () => {
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'conversations') {
        // Ownership check — belongs to current user
        return createMockQueryBuilder({ data: { user_id: mockUserId }, error: null });
      }
      if (table === 'messages') {
        return createMockQueryBuilder({
          data: [mockUserMessage, mockAssistantMessage],
          error: null,
        });
      }
      return createMockQueryBuilder();
    });

    const result = await getMessages(mockConversationId);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
  });

  it('non-existent conversation → throws', async () => {
    mockSupabase.from = vi.fn().mockImplementation(() =>
      createMockQueryBuilder({ data: null, error: { message: 'Not found' } })
    );

    await expect(getMessages(mockConversationId)).rejects.toThrow();
  });

  it("other user's conversation → throws Unauthorized (application-level RLS)", async () => {
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'conversations') {
        // Conversation exists but belongs to a different user
        return createMockQueryBuilder({ data: { user_id: mockOtherUserId }, error: null });
      }
      return createMockQueryBuilder();
    });

    await expect(getMessages(mockConversationId)).rejects.toThrow('Unauthorized');
  });
});
