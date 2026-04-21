import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';

import { signupAction } from '@/features/auth/actions/signup.action';
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
// signupAction
// ---------------------------------------------------------------------------

describe('signupAction', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('successful signup', () => {
    it('calls signUp with parsed credentials and redirects to /chat', async () => {
      mockSupabase.auth.signUp = vi.fn().mockResolvedValue({ data: {}, error: null });

      const formData = makeFormData({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      await signupAction(initialState, formData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        options: { data: { display_name: 'Test User' } },
      });
      expect(redirect).toHaveBeenCalledWith('/chat');
    });
  });

  describe('email already exists', () => {
    it('returns an error message and does NOT redirect', async () => {
      mockSupabase.auth.signUp = vi.fn().mockResolvedValue({
        data: {},
        error: { message: 'User already registered' },
      });

      const formData = makeFormData({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      });
      const result = await signupAction(initialState, formData);

      expect(result.error?.message).toBeDefined();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Zod validation errors (no Supabase call)', () => {
    it('returns fieldErrors for a password shorter than 8 characters', async () => {
      const formData = makeFormData({
        name: 'Test User',
        email: 'user@example.com',
        password: 'short',
      });
      const result = await signupAction(initialState, formData);

      expect(result.error?.fieldErrors?.password).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('returns fieldErrors for a missing email', async () => {
      const formData = makeFormData({ name: 'Test User', password: 'password123' });
      const result = await signupAction(initialState, formData);

      expect(result.error?.fieldErrors?.email).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('returns fieldErrors for a missing name', async () => {
      const formData = makeFormData({ email: 'user@example.com', password: 'password123' });
      const result = await signupAction(initialState, formData);

      expect(result.error?.fieldErrors?.name).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('returns fieldErrors for an invalid email format', async () => {
      const formData = makeFormData({
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123',
      });
      const result = await signupAction(initialState, formData);

      expect(result.error?.fieldErrors?.email).toBeDefined();
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('network / unexpected error', () => {
    it('returns a graceful error message when createClient throws', async () => {
      mockCreateClient.mockRejectedValue(new Error('Network failure'));

      const formData = makeFormData({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const result = await signupAction(initialState, formData);

      expect(result.error?.message).toBeTruthy();
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
