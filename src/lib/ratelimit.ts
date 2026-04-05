import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (reused across all requests)
const redis = Redis.fromEnv();

/**
 * Rate limiters for different API endpoints
 * Key pattern: 'savage-ai:{endpoint}:{identifier}'
 */

export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'), // 20 requests per 10 seconds per IP
  analytics: true,
  prefix: 'savage-ai:chat',
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 requests per 60 seconds per IP
  analytics: true,
  prefix: 'savage-ai:auth',
});

export const conversationsRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'), // 60 requests per 60 seconds per IP
  analytics: true,
  prefix: 'savage-ai:conversations',
});

/**
 * Generic function to handle rate limiting errors
 * Call this FIRST in your API handler, before any auth/DB calls
 *
 * Usage:
 *   const ip = getClientIP(req);
 *   const result = await handleRateLimit(chatRateLimit, ip);
 *   if (!result.success) return result.response!;
 *
 *   // Continue with request...
 *   return new Response(..., { headers: result.headers });
 */
export const handleRateLimit = async (
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; response?: Response; headers?: Record<string, string> }> => {
  const { success, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }

  return {
    success: true,
    headers: {
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(reset),
    },
  };
};

/**
 * Helper: Extract user IP from request
 * Works with Vercel, Netlify, and other proxies
 */
export const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (clientIp) {
    return clientIp;
  }

  return '127.0.0.1'; // Fallback for local development
};
