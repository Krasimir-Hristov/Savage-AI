import { vi } from 'vitest';
import * as navigation from 'next/navigation';
import * as nextHeaders from 'next/headers';

// ---------------------------------------------------------------------------
// Helpers to configure next/navigation + next/headers mocks in tests.
// The base mocks are set up globally in test/setup.ts.
// Use these helpers in individual tests to set specific return values.
// ---------------------------------------------------------------------------

/**
 * Makes redirect() throw a NEXT_REDIRECT error (matching Next.js real behavior).
 * Use in tests that assert redirect is called.
 *
 * @example
 * mockRedirectThrows();
 * await expect(loginAction(...)).rejects.toThrow('NEXT_REDIRECT');
 */
export const mockRedirectThrows = (): void => {
  vi.mocked(navigation.redirect).mockImplementation((url: string): never => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url}`;
    throw error;
  });
};

/**
 * Resets redirect to a no-op spy (default behavior).
 */
export const mockRedirectNoOp = (): void => {
  vi.mocked(navigation.redirect).mockImplementation(
    (() => undefined) as unknown as typeof navigation.redirect,
  );
};

/**
 * Configures useRouter mock with custom return values.
 */
export const mockUseRouter = (overrides: Record<string, ReturnType<typeof vi.fn>> = {}): void => {
  vi.mocked(navigation.useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof navigation.useRouter>);
};

/**
 * Configures cookies() mock to return specific cookie values.
 */
export const mockCookies = (cookieMap: Record<string, string> = {}): void => {
  const cookieStore = {
    get: vi.fn((name: string) =>
      cookieMap[name] ? { name, value: cookieMap[name] } : undefined,
    ),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() =>
      Object.entries(cookieMap).map(([name, value]) => ({ name, value })),
    ),
    has: vi.fn((name: string) => name in cookieMap),
  };
  vi.mocked(nextHeaders.cookies).mockReturnValue(
    cookieStore as unknown as ReturnType<typeof nextHeaders.cookies>,
  );
};
