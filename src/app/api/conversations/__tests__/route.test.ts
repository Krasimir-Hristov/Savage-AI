import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockConversations } from '../../../../../test/fixtures/conversations';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/ratelimit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  handleRateLimit: vi.fn().mockResolvedValue({ success: true, headers: {} }),
  conversationsRateLimit: {},
}));

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: 'mock-user-id', email: 'test@example.com' }),
  getConversations: vi.fn().mockResolvedValue([]),
}));

// ---------------------------------------------------------------------------
// Lazy imports
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/conversations/route';
import { getConversations, verifySession } from '@/lib/dal';
import { handleRateLimit } from '@/lib/ratelimit';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(handleRateLimit).mockResolvedValue({ success: true, headers: {} });
    vi.mocked(verifySession).mockResolvedValue({
      userId: 'mock-user-id',
      email: 'test@example.com',
    });
    vi.mocked(getConversations).mockResolvedValue([]);
  });

  describe('returns conversations → 200', () => {
    it('returns 200 with the conversations array', async () => {
      vi.mocked(getConversations).mockResolvedValueOnce(mockConversations);

      const req = new Request('http://localhost/api/conversations');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockConversations);
    });

    it('returns 200 with an empty array when user has no conversations', async () => {
      vi.mocked(getConversations).mockResolvedValueOnce([]);

      const req = new Request('http://localhost/api/conversations');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it('passes the authenticated userId to getConversations', async () => {
      vi.mocked(verifySession).mockResolvedValueOnce({
        userId: 'specific-user-id',
        email: 'user@example.com',
      });

      const req = new Request('http://localhost/api/conversations');
      await GET(req);

      expect(getConversations).toHaveBeenCalledWith('specific-user-id');
    });
  });

  describe('unauthenticated → 401', () => {
    it('returns 401 when verifySession throws a NEXT_REDIRECT error', async () => {
      vi.mocked(verifySession).mockRejectedValueOnce(
        Object.assign(new Error('Redirecting'), { digest: 'NEXT_REDIRECT;replace;/login' })
      );

      const req = new Request('http://localhost/api/conversations');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('rate limited → 429', () => {
    it('returns 429 when the rate limiter rejects the request', async () => {
      vi.mocked(handleRateLimit).mockResolvedValueOnce({
        success: false,
        response: new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
      });

      const req = new Request('http://localhost/api/conversations');
      const res = await GET(req);

      expect(res.status).toBe(429);
    });
  });
});
