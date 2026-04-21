import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before importing the module under test
// ---------------------------------------------------------------------------

// Mock @upstash/redis — Redis.fromEnv() is called at module load time
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn().mockReturnValue({}),
  },
}));

// Mock @upstash/ratelimit — instances are created at module load time
const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = vi.fn().mockReturnValue({ type: 'slidingWindow' });

    limit = mockLimit;
  },
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks
// ---------------------------------------------------------------------------

import { getClientIP, handleRateLimit, chatRateLimit } from '@/lib/ratelimit';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getClientIP()', () => {
  const makeRequest = (headers: Record<string, string>): Request =>
    new Request('http://localhost/api/test', { headers });

  it('extracts IP from x-forwarded-for header', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.42, 10.0.0.1' });

    expect(getClientIP(req)).toBe('203.0.113.42');
  });

  it('extracts IP from x-real-ip header when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '203.0.113.99' });

    expect(getClientIP(req)).toBe('203.0.113.99');
  });

  it('falls back to 127.0.0.1 when no IP headers are present', () => {
    const req = makeRequest({});

    expect(getClientIP(req)).toBe('127.0.0.1');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = makeRequest({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '9.9.9.9',
    });

    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('trims whitespace from x-forwarded-for first entry', () => {
    const req = makeRequest({ 'x-forwarded-for': '  203.0.113.1  , 10.0.0.1' });

    expect(getClientIP(req)).toBe('203.0.113.1');
  });
});

// ---------------------------------------------------------------------------

describe('handleRateLimit()', () => {
  const FUTURE_RESET = Date.now() + 10_000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success:true and rate-limit headers when under the limit', async () => {
    mockLimit.mockResolvedValue({ success: true, reset: FUTURE_RESET, remaining: 19 });

    const result = await handleRateLimit(chatRateLimit, '127.0.0.1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers['X-RateLimit-Remaining']).toBe('19');
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    }
  });

  it('returns success:false with a 429 Response when over the limit', async () => {
    mockLimit.mockResolvedValue({ success: false, reset: FUTURE_RESET, remaining: 0 });

    const result = await handleRateLimit(chatRateLimit, '127.0.0.1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(429);
    }
  });

  it('includes Retry-After header in the 429 response', async () => {
    mockLimit.mockResolvedValue({ success: false, reset: FUTURE_RESET, remaining: 0 });

    const result = await handleRateLimit(chatRateLimit, '127.0.0.1');

    if (!result.success) {
      const retryAfter = result.response.headers.get('Retry-After');
      expect(retryAfter).not.toBeNull();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    }
  });

  it('429 response body includes error message and retryAfter', async () => {
    mockLimit.mockResolvedValue({ success: false, reset: FUTURE_RESET, remaining: 0 });

    const result = await handleRateLimit(chatRateLimit, '127.0.0.1');

    if (!result.success) {
      const body = (await result.response.json()) as { error: string; retryAfter: number };
      expect(body.error).toMatch(/too many requests/i);
      expect(body.retryAfter).toBeGreaterThan(0);
    }
  });

  it('calls limiter.limit with the provided identifier', async () => {
    mockLimit.mockResolvedValue({ success: true, reset: FUTURE_RESET, remaining: 10 });

    await handleRateLimit(chatRateLimit, '10.20.30.40');

    expect(mockLimit).toHaveBeenCalledWith('10.20.30.40');
  });
});
