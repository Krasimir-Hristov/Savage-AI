export interface KnowledgeEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  source_type: 'manual' | 'file';
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  metadata: Record<string, unknown>;
  chunk_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentChunk {
  id: string;
  user_id: string;
  knowledge_entry_id: string;
  content: string;
  chunk_index: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface KnowledgeEntryWithChunks extends KnowledgeEntry {
  chunks: DocumentChunk[];
}

/** Result from the match_documents RPC function */
export interface VectorSearchResult {
  id: string;
  knowledge_entry_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}
