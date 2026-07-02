import { describe, expect, it } from 'vitest';

import {
  authRateLimit,
  chatRateLimit,
  getClientIP,
  handleRateLimit,
} from '@/lib/ratelimit';

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
  it('returns success:true and rate-limit headers when under the limit', async () => {
    const result = await handleRateLimit(chatRateLimit, 'test-under-limit');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    }
  });

  it('returns success:false with a 429 Response when over the limit', async () => {
    // authRateLimit allows only 5 requests per 60s — exhaust it
    const identifier = 'test-over-limit';
    for (let i = 0; i < 5; i++) {
      await handleRateLimit(authRateLimit, identifier);
    }

    const result = await handleRateLimit(authRateLimit, identifier);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(429);
    }
  });

  it('includes Retry-After header in the 429 response', async () => {
    const identifier = 'test-retry-after';
    for (let i = 0; i < 5; i++) {
      await handleRateLimit(authRateLimit, identifier);
    }

    const result = await handleRateLimit(authRateLimit, identifier);

    if (!result.success) {
      const retryAfter = result.response.headers.get('Retry-After');
      expect(retryAfter).not.toBeNull();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    }
  });

  it('429 response body includes error message and retryAfter', async () => {
    const identifier = 'test-body';
    for (let i = 0; i < 5; i++) {
      await handleRateLimit(authRateLimit, identifier);
    }

    const result = await handleRateLimit(authRateLimit, identifier);

    if (!result.success) {
      const body = (await result.response.json()) as { error: string; retryAfter: number };
      expect(body.error).toMatch(/too many requests/i);
      expect(body.retryAfter).toBeGreaterThan(0);
    }
  });

  it('tracks different identifiers independently', async () => {
    const id1 = 'test-independent-1';
    const id2 = 'test-independent-2';

    // Exhaust limit for id1
    for (let i = 0; i < 5; i++) {
      await handleRateLimit(authRateLimit, id1);
    }

    // id1 should be rate limited
    const result1 = await handleRateLimit(authRateLimit, id1);
    expect(result1.success).toBe(false);

    // id2 should still succeed
    const result2 = await handleRateLimit(authRateLimit, id2);
    expect(result2.success).toBe(true);
  });

  it('decrements remaining count on each request', async () => {
    const identifier = 'test-remaining-decrement';
    const first = await handleRateLimit(chatRateLimit, identifier);
    const second = await handleRateLimit(chatRateLimit, identifier);

    if (first.success && second.success) {
      const firstRemaining = Number(first.headers['X-RateLimit-Remaining']);
      const secondRemaining = Number(second.headers['X-RateLimit-Remaining']);
      expect(secondRemaining).toBe(firstRemaining - 1);
    }
  });
});
