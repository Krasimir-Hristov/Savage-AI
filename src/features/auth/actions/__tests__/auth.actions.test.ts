import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

import { loginAction, logoutAction } from '@/features/auth/actions/auth.actions';
import { createMockSupabaseClient } from '../../../../../test/mocks/supabase';

// ---------------------------------------------------------------------------
// Hoist mock factory — must be hoisted so vi.mock() factory can reference it
// ---------------------------------------------------------------------------

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeFormData = (fields: Record<string, string>): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
};

const initialState = {};

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------

describe('loginAction', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('successful login', () => {
    it('calls redirect("/chat") on valid credentials', async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null });

      const formData = makeFormData({ email: 'user@example.com', password: 'password123' });
      await loginAction(initialState, formData);

      expect(redirect).toHaveBeenCalledWith('/chat');
    });
  });

  describe('wrong password / invalid credentials', () => {
    it('returns an error message when Supabase returns an auth error', async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' },
      });

      const formData = makeFormData({ email: 'user@example.com', password: 'wrongpassword' });
      const result = await loginAction(initialState, formData);

      expect(result.error?.message).toBeDefined();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Zod validation errors (no Supabase call)', () => {
    it('returns fieldErrors for an invalid email format', async () => {
      const formData = makeFormData({ email: 'not-an-email', password: 'password123' });
      const result = await loginAction(initialState, formData);

      expect(result.error?.fieldErrors?.email).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('returns fieldErrors for a password shorter than 8 characters', async () => {
      const formData = makeFormData({ email: 'user@example.com', password: 'short' });
      const result = await loginAction(initialState, formData);

      expect(result.error?.fieldErrors?.password).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('returns fieldErrors for a missing email', async () => {
      const formData = makeFormData({ password: 'password123' });
      const result = await loginAction(initialState, formData);

      expect(result.error?.fieldErrors?.email).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('network / unexpected error', () => {
    it('returns a graceful error message when createClient throws', async () => {
      mockCreateClient.mockRejectedValue(new Error('Network failure'));

      const formData = makeFormData({ email: 'user@example.com', password: 'password123' });
      const result = await loginAction(initialState, formData);

      expect(result.error?.message).toBeTruthy();
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// logoutAction
// ---------------------------------------------------------------------------

describe('logoutAction', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('successful logout', () => {
    it('awaits signOut before calling redirect("/login")', async () => {
      // Resolve on the next microtask tick — forces the code to actually await.
      mockSupabase.auth.signOut = vi
        .fn()
        .mockReturnValue(Promise.resolve().then(() => ({ error: null })));

      await logoutAction();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/login');

      // Verify call order: signOut must have been invoked before redirect.
      expect(mockSupabase.auth.signOut.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(redirect).mock.invocationCallOrder[0]
      );
    });
  });

  describe('Supabase error', () => {
    it('returns {success: false} and does NOT redirect when createClient throws', async () => {
      // logoutAction catches errors and returns early — redirect is only
      // called on the happy path (after the try/catch block).
      mockCreateClient.mockRejectedValue(new Error('Supabase unavailable'));

      const result = await logoutAction();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeTruthy();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('returns the error message and code when signOut rejects with {message, code}', async () => {
      mockSupabase.auth.signOut = vi
        .fn()
        .mockRejectedValue({ message: 'Sign out failed', code: 'AUTH_ERROR' });

      const result = await logoutAction();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Sign out failed');
      expect(result.error?.code).toBe('AUTH_ERROR');
      expect(redirect).not.toHaveBeenCalled();
    });

    it('falls back to default message when signOut rejects without a message', async () => {
      mockSupabase.auth.signOut = vi.fn().mockRejectedValue({ code: 'UNKNOWN' });

      const result = await logoutAction();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to sign out. Please try again.');
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
