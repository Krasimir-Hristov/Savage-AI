import 'server-only';

// ---------------------------------------------------------------------------
// In-Memory Sliding Window Rate Limiter
// ---------------------------------------------------------------------------
// Replaces Upstash Redis with a zero-dependency, in-process rate limiter.
// Each Vercel serverless instance tracks its own counters — sufficient as a
// secondary defense layer (Vercel provides edge-level rate limiting by default).
//
// Algorithm: sliding window log — stores timestamps per key, counts hits
// within the window. Old entries are lazily pruned on each check.
// ---------------------------------------------------------------------------

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  prefix: string;
}

interface RateLimitState {
  timestamps: number[];
}

// Global store: `${prefix}:${identifier}` → state
const store = new Map<string, RateLimitState>();

// Periodic cleanup interval (every 60s) to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000;

function createLimiter(config: RateLimitConfig) {
  return {
    config,

    async limit(identifier: string): Promise<{
      success: boolean;
      reset: number;
      remaining: number;
    }> {
      const key = `${config.prefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let state = store.get(key);
      if (!state) {
        state = { timestamps: [] };
        store.set(key, state);
      }

      // Prune timestamps outside the current window
      state.timestamps = state.timestamps.filter((ts) => ts > windowStart);

      const remaining = Math.max(0, config.maxRequests - state.timestamps.length);

      if (state.timestamps.length >= config.maxRequests) {
        // Rate limited — reset is when the oldest timestamp in window expires
        const oldestInWindow = state.timestamps[0] ?? now;
        const reset = oldestInWindow + config.windowMs;
        return { success: false, reset, remaining: 0 };
      }

      // Allow request — record timestamp
      state.timestamps.push(now);

      // Reset is when this newest request falls out of the window
      const reset = now + config.windowMs;

      return {
        success: true,
        reset,
        remaining: remaining - 1,
      };
    },
  };
}

// Start periodic cleanup to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, state] of store.entries()) {
    // Find the most recent timestamp to determine if this entry is stale
    const latestTs = state.timestamps[state.timestamps.length - 1] ?? 0;
    if (now - latestTs > CLEANUP_INTERVAL_MS * 2) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Prevent the interval from keeping the process alive in serverless
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

// ---------------------------------------------------------------------------
// Rate limiter instances (same limits as before)
// ---------------------------------------------------------------------------

export const chatRateLimit = createLimiter({
  maxRequests: 20,
  windowMs: 10_000, // 10 seconds
  prefix: 'savage-ai:chat',
});

export const authRateLimit = createLimiter({
  maxRequests: 5,
  windowMs: 60_000, // 60 seconds
  prefix: 'savage-ai:auth',
});

export const conversationsRateLimit = createLimiter({
  maxRequests: 60,
  windowMs: 60_000, // 60 seconds
  prefix: 'savage-ai:conversations',
});

export const ttsRateLimit = createLimiter({
  maxRequests: 10,
  windowMs: 60_000, // 60 seconds
  prefix: 'savage-ai:tts',
});

export const knowledgeRateLimit = createLimiter({
  maxRequests: 30,
  windowMs: 60_000, // 60 seconds
  prefix: 'savage-ai:knowledge',
});

export const knowledgeUploadRateLimit = createLimiter({
  maxRequests: 5,
  windowMs: 60_000, // 60 seconds
  prefix: 'savage-ai:knowledge-upload',
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
type RateLimitSuccess = { success: true; headers: Record<string, string> };
type RateLimitFailure = { success: false; response: Response };
export type RateLimitResult = RateLimitSuccess | RateLimitFailure;

export async function handleRateLimit(
  limiter: ReturnType<typeof createLimiter>,
  identifier: string
): Promise<RateLimitResult> {
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
}

/**
 * Helper: Extract user IP from request
 * Works with Vercel, Netlify, and other proxies
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (clientIp) {
    return clientIp;
  }

  return '127.0.0.1'; // Fallback for local development
}
