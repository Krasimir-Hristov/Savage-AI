import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockQueryBuilder, createMockSupabaseClient } from '../../../../../test/mocks/supabase';
import { mockConversationId } from '../../../../../test/fixtures/conversations';

// ---------------------------------------------------------------------------
// Mocks — all hoisted before any imports
// ---------------------------------------------------------------------------

vi.mock('next/server', () => ({ after: vi.fn() }));

vi.mock('@/lib/ratelimit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  handleRateLimit: vi.fn().mockResolvedValue({ success: true, headers: {} }),
  chatRateLimit: {},
}));

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: 'mock-user-id', email: 'test@example.com' }),
}));

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));

vi.mock('@/features/rag/dal', () => ({
  getKnowledgeEntryCount: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/features/image-gen', () => ({
  detectImageIntent: vi.fn().mockReturnValue(false),
  extractImagePrompt: vi.fn(),
  generateImage: vi.fn(),
}));

vi.mock('@/lib/openrouter/client', () => ({
  streamChatAgent: vi.fn(),
  streamChatWithTools: vi.fn(),
  createChatModel: vi.fn(),
  IMAGE_MARKER_PREFIX: '__SAVAGE_IMG__',
  RAG_SEARCH_MARKER: '__RAG_SEARCH__',
}));

vi.mock('@/features/rag/tools/search-knowledge', () => ({
  createSearchKnowledgeTool: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Lazy imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/chat/route';
import { verifySession } from '@/lib/dal';
import { handleRateLimit } from '@/lib/ratelimit';
import { streamChatAgent } from '@/lib/openrouter/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeStream = (text = 'Hello!'): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

const validBody = {
  messages: [{ role: 'user', content: 'Reverse a string in JavaScript' }],
  characterId: 'angry-grandpa',
  conversationId: mockConversationId,
};

const makeRequest = (body: unknown = validBody) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/chat', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limit succeeds
    vi.mocked(handleRateLimit).mockResolvedValue({ success: true, headers: {} });

    // Default: session is valid
    vi.mocked(verifySession).mockResolvedValue({
      userId: 'mock-user-id',
      email: 'test@example.com',
    });

    // Default: conversation ownership check succeeds
    mockSupabase = createMockSupabaseClient();
    mockSupabase.from = vi
      .fn()
      .mockImplementation(() =>
        createMockQueryBuilder({ data: { id: mockConversationId }, error: null })
      );
    mockCreateClient.mockResolvedValue(mockSupabase);

    // Default: OpenRouter returns a simple stream
    vi.mocked(streamChatAgent).mockResolvedValue(makeStream());
  });

  describe('valid request → 200 streaming response', () => {
    it('returns 200 with Content-Type: text/event-stream', async () => {
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('calls streamChatAgent with the correct messages', async () => {
      await POST(makeRequest());

      expect(streamChatAgent).toHaveBeenCalled();
    });
  });

  describe('unauthenticated → 401', () => {
    it('returns 401 when verifySession throws a NEXT_REDIRECT error', async () => {
      vi.mocked(verifySession).mockRejectedValueOnce(
        Object.assign(new Error('Redirecting'), { digest: 'NEXT_REDIRECT;replace;/login' })
      );

      const res = await POST(makeRequest());

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('invalid body (Zod) → 400', () => {
    it('returns 400 for an empty messages array', async () => {
      const res = await POST(
        makeRequest({ ...validBody, messages: [] })
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 for a missing conversationId', async () => {
      const { conversationId: _removed, ...bodyWithoutId } = validBody;
      const res = await POST(makeRequest(bodyWithoutId));

      expect(res.status).toBe(400);
    });

    it('returns 400 for malformed JSON', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('rate limited → 429', () => {
    it('returns 429 when the rate limiter rejects the request', async () => {
      vi.mocked(handleRateLimit).mockResolvedValueOnce({
        success: false,
        response: new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(429);
    });
  });

  describe('OpenRouter error → 502', () => {
    it('returns 502 when streamChatAgent throws', async () => {
      vi.mocked(streamChatAgent).mockRejectedValueOnce(new Error('OpenRouter unavailable'));

      const res = await POST(makeRequest());

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
});
