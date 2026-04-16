import '@testing-library/jest-dom/vitest';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from './mocks/server';

// ---------------------------------------------------------------------------
// Module mocks (hoisted — apply to all tests automatically)
// ---------------------------------------------------------------------------

// Mock `server-only` — noop in test environment
vi.mock('server-only', () => ({}));

// Mock `next/headers` — cookies() used by Supabase server client + DAL
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
  })),
  headers: vi.fn(() => new Headers()),
}));

// Mock `next/navigation` — redirect(), useRouter(), etc.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  useParams: vi.fn(() => ({})),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock `next/cache` — used by DAL unstable_cache
// Uses a Map-based cache keyed by keyParts + args so tests exercising
// cache hits, revalidateTag, and revalidatePath behave correctly.
vi.mock('next/cache', () => {
  const cache = new Map<string, unknown>();
  const tagKeys = new Map<string, Set<string>>();

  const unstable_cache = vi.fn(
    (
      fn: (...args: unknown[]) => unknown,
      keyParts?: string[],
      options?: { tags?: string[]; revalidate?: number },
    ) =>
      async (...args: unknown[]) => {
        const key = JSON.stringify([...(keyParts ?? []), ...args]);
        if (cache.has(key)) return cache.get(key);
        const result = await fn(...args);
        cache.set(key, result);
        if (options?.tags) {
          for (const tag of options.tags) {
            if (!tagKeys.has(tag)) tagKeys.set(tag, new Set());
            tagKeys.get(tag)!.add(key);
          }
        }
        return result;
      },
  );

  const revalidateTag = vi.fn((tag: string) => {
    const keys = tagKeys.get(tag);
    if (keys) {
      keys.forEach((k) => cache.delete(k));
      tagKeys.delete(tag);
    }
  });

  const revalidatePath = vi.fn(() => cache.clear());

  return { unstable_cache, revalidatePath, revalidateTag };
});

// ---------------------------------------------------------------------------
// MSW server lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
