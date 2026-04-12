-- Drop the plain index added in the previous migration
DROP INDEX IF EXISTS idx_waitlist_user_id;

-- Replace with a partial UNIQUE index: one row per authenticated user, NULLs excluded
CREATE UNIQUE INDEX idx_waitlist_user_id_unique ON waitlist(user_id) WHERE user_id IS NOT NULL;
