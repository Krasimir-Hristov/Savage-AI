import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { DocumentChunk, KnowledgeEntry, KnowledgeEntryWithChunks } from '@/types/knowledge';

// ---------------------------------------------------------------------------
// List all entries (without chunks) for a user
// ---------------------------------------------------------------------------
export async function getKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch knowledge entries: ${error.message}`);
  }

  return (data ?? []) as KnowledgeEntry[];
}

// ---------------------------------------------------------------------------
// Get single entry with ownership check (no chunks)
// ---------------------------------------------------------------------------
export async function getKnowledgeEntry(entryId: string, userId: string): Promise<KnowledgeEntry> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Knowledge entry not found or access denied');
  }

  return data as KnowledgeEntry;
}

// ---------------------------------------------------------------------------
// Get entry with its chunks (for detail/edit view)
// ---------------------------------------------------------------------------
export async function getKnowledgeEntryWithChunks(
  entryId: string,
  userId: string
): Promise<KnowledgeEntryWithChunks> {
  const entry = await getKnowledgeEntry(entryId, userId);

  const supabase = await createClient();
  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select(
      'id, user_id, knowledge_entry_id, content, chunk_index, is_active, metadata, created_at'
    )
    .eq('knowledge_entry_id', entryId)
    .eq('user_id', userId)
    .order('chunk_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chunks: ${error.message}`);
  }

  return {
    ...entry,
    chunks: (chunks ?? []) as DocumentChunk[],
  };
}

// ---------------------------------------------------------------------------
// Count entries for a user (cheap check for "has any knowledge?")
// ---------------------------------------------------------------------------
export async function getKnowledgeEntryCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('knowledge_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to count knowledge entries: ${error.message}`);
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Delete entry (CASCADE handles chunks)
// ---------------------------------------------------------------------------
export async function deleteKnowledgeEntry(entryId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete knowledge entry: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Knowledge entry not found or access denied');
  }
}

// ---------------------------------------------------------------------------
// Toggle chunk active/inactive
// ---------------------------------------------------------------------------
export async function toggleChunkActive(
  chunkId: string,
  userId: string,
  isActive: boolean,
  knowledgeEntryId?: string
): Promise<void> {
  const supabase = await createClient();

  const query = supabase
    .from('document_chunks')
    .update({ is_active: isActive })
    .eq('id', chunkId)
    .eq('user_id', userId);

  // If knowledgeEntryId is provided, also verify the chunk belongs to that entry
  const { data, error } = await (
    knowledgeEntryId ? query.eq('knowledge_entry_id', knowledgeEntryId) : query
  ).select('id');

  if (error) {
    throw new Error(`Failed to toggle chunk: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Chunk not found or access denied');
  }
}
