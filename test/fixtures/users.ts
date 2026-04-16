// ---------------------------------------------------------------------------
// User + session fixtures
// ---------------------------------------------------------------------------

export const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const mockUserEmail = 'test@example.com';
export const mockUserName = 'Test User';

export const mockUser = {
  id: mockUserId,
  email: mockUserEmail,
  created_at: '2026-01-01T00:00:00.000Z',
  user_metadata: {
    display_name: mockUserName,
  },
};

export const mockSession = {
  userId: mockUserId,
  email: mockUserEmail,
};

/** Second user — used for ownership/access-control tests */
export const mockOtherUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
export const mockOtherUser = {
  id: mockOtherUserId,
  email: 'other@example.com',
  created_at: '2026-01-02T00:00:00.000Z',
  user_metadata: { display_name: 'Other User' },
};

export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
});
