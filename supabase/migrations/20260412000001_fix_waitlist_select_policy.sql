-- Drop the blocking SELECT policy
DROP POLICY IF EXISTS "No public read on waitlist" ON waitlist;

-- Allow authenticated users to read only their own waitlist entry
CREATE POLICY "Users can read own waitlist entry"
  ON waitlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
