-- ============================================================
-- SavageAI — Atomic chunk swap RPC
-- Created: 2026-04-15
-- Replaces the non-atomic delete+insert pattern in reEmbedEntry
-- ============================================================

-- ---------------------------------------------------------------------------
-- swap_chunks: atomically replace all chunks for a knowledge entry
--
-- Deletes existing chunks, inserts new ones, and updates chunk_count
-- in a single transaction. If any step fails, everything rolls back.
-- SECURITY INVOKER → RLS policies still apply.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION swap_chunks(
  p_entry_id UUID,
  p_user_id UUID,
  p_chunks JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- 1. Delete old chunks for this entry
  DELETE FROM document_chunks
  WHERE knowledge_entry_id = p_entry_id
    AND user_id = p_user_id;

  -- 2. Insert new chunks from the JSONB array
  INSERT INTO document_chunks (
    user_id,
    knowledge_entry_id,
    content,
    embedding,
    chunk_index,
    is_active,
    metadata
  )
  SELECT
    p_user_id,
    p_entry_id,
    (chunk->>'content')::TEXT,
    (chunk->>'embedding')::extensions.vector(1536),
    (chunk->>'chunk_index')::INTEGER,
    COALESCE((chunk->>'is_active')::BOOLEAN, true),
    COALESCE((chunk->'metadata')::JSONB, '{}'::JSONB)
  FROM jsonb_array_elements(p_chunks) AS chunk;

  -- 3. Update chunk_count on the parent entry
  UPDATE knowledge_entries
  SET chunk_count = jsonb_array_length(p_chunks),
      updated_at = NOW()
  WHERE id = p_entry_id
    AND user_id = p_user_id;
END;
$$;
