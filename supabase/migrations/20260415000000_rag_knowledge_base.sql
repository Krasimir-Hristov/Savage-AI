-- ============================================================
-- SavageAI — RAG Knowledge Base Schema
-- Created: 2026-04-15
-- Enables per-user knowledge base with pgvector embeddings
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENABLE pgvector EXTENSION
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- 2. KNOWLEDGE_ENTRIES TABLE (source of truth, editable)
-- ------------------------------------------------------------
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'file')),
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. DOCUMENT_CHUNKS TABLE (chunked + embedded vectors)
-- ------------------------------------------------------------
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  knowledge_entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  chunk_index INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- knowledge_entries policies
CREATE POLICY "Users can view own knowledge entries"
  ON knowledge_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge entries"
  ON knowledge_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge entries"
  ON knowledge_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge entries"
  ON knowledge_entries FOR DELETE
  USING (auth.uid() = user_id);

-- document_chunks policies
CREATE POLICY "Users can view own document chunks"
  ON document_chunks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document chunks"
  ON document_chunks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document chunks"
  ON document_chunks FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_knowledge_entries_user_id ON knowledge_entries(user_id);
CREATE INDEX idx_knowledge_entries_created_at ON knowledge_entries(created_at DESC);
CREATE INDEX idx_document_chunks_entry_id ON document_chunks(knowledge_entry_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_active ON document_chunks(user_id, is_active);

-- HNSW index for fast vector similarity search (cosine distance)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

-- ------------------------------------------------------------
-- 6. VECTOR SEARCH RPC FUNCTION
-- Filters by user_id AND is_active for secure per-user search
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_user_id UUID
) RETURNS TABLE (
  id UUID,
  knowledge_entry_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.knowledge_entry_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.user_id = filter_user_id
    AND dc.is_active = true
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
