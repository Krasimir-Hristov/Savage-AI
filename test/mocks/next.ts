import { vi } from 'vitest';

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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nav = vi.mocked(require('next/navigation'));
  nav.redirect.mockImplementation(
    (url: string): never => {
      const error = new Error(`NEXT_REDIRECT:${url}`);
      (error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url}`;
      throw error;
    }
  );
};

/**
 * Resets redirect to a no-op spy (default behavior).
 */
export const mockRedirectNoOp = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nav = vi.mocked(require('next/navigation'));
  nav.redirect.mockImplementation((): void => {
    // noop
  });
};

/**
 * Configures useRouter mock with custom return values.
 */
export const mockUseRouter = (overrides: Record<string, ReturnType<typeof vi.fn>> = {}): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nav = vi.mocked(require('next/navigation'));
  nav.useRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  });
};

/**
 * Configures cookies() mock to return specific cookie values.
 */
export const mockCookies = (cookieMap: Record<string, string> = {}): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const hdrs = vi.mocked(require('next/headers'));
  hdrs.cookies.mockReturnValue({
    get: vi.fn((name: string) =>
      cookieMap[name] ? { name, value: cookieMap[name] } : undefined,
    ),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() =>
      Object.entries(cookieMap).map(([name, value]) => ({ name, value })),
    ),
    has: vi.fn((name: string) => name in cookieMap),
  } as never);
};
