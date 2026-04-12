-- ============================================================
-- SavageAI — Waitlist Table
-- Created: 2026-04-12
-- ============================================================

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'savage-tier',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Only service role can read waitlist entries (admin only)
CREATE POLICY "No public read on waitlist"
  ON waitlist FOR SELECT
  USING (false);

-- Authenticated users can insert their own entry
CREATE POLICY "Authenticated users can join waitlist"
  ON waitlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
