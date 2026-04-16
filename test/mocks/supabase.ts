import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Chainable Supabase query builder mock
// ---------------------------------------------------------------------------

export const createMockQueryBuilder = (
  resolveValue: { data: unknown; error: unknown } = { data: null, error: null }
) => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'is',
    'order',
    'limit',
    'range',
    'not',
    'filter',
    'match',
  ] as const;

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnThis();
  });

  builder['single'] = vi.fn().mockResolvedValue(resolveValue);
  builder['maybeSingle'] = vi.fn().mockResolvedValue(resolveValue);
  // Make the builder itself thenable (resolves when awaited directly)
  builder['then'] = vi.fn(
    (
      onFulfilled: ((v: unknown) => unknown) | null | undefined,
      onRejected: ((e: unknown) => unknown) | null | undefined,
    ) => Promise.resolve(resolveValue).then(onFulfilled, onRejected),
  );

  return builder;
};

// ---------------------------------------------------------------------------
// Full Supabase client mock factory
// ---------------------------------------------------------------------------

export const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path.jpg' }, error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/mock/path.jpg' } }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
});

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
