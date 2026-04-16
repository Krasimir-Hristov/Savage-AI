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
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ---------------------------------------------------------------------------
// MSW server lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
