import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { NotFoundError } from '@/lib/errors';
import type { KnowledgeEntry } from '@/types/knowledge';

import { chunkAndEmbed } from '@/features/rag/utils/chunk-text';

// ---------------------------------------------------------------------------
// Create a new knowledge entry + chunk & embed its content
// ---------------------------------------------------------------------------
export async function createAndEmbedEntry(params: {
  userId: string;
  title?: string;
  content: string;
  sourceType: 'manual' | 'file';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}): Promise<KnowledgeEntry> {
  const supabase = await createClient();

  // 1. Insert the knowledge entry
  const { data: entry, error: entryError } = await supabase
    .from('knowledge_entries')
    .insert({
      user_id: params.userId,
      title: params.title ?? null,
      content: params.content,
      source_type: params.sourceType,
      file_name: params.fileName ?? null,
      file_size: params.fileSize ?? null,
      mime_type: params.mimeType ?? null,
      chunk_count: 0,
    })
    .select('*')
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to create knowledge entry: ${entryError?.message}`);
  }

  // 2. Chunk and embed
  const chunksWithEmbeddings = await chunkAndEmbed(params.content);

  // 3. Insert chunks
  const chunkRows = chunksWithEmbeddings.map((chunk) => ({
    user_id: params.userId,
    knowledge_entry_id: entry.id,
    content: chunk.content,
    embedding: JSON.stringify(chunk.embedding),
    chunk_index: chunk.chunkIndex,
    is_active: true,
    metadata: {},
  }));

  const { error: chunksError } = await supabase.from('document_chunks').insert(chunkRows);

  if (chunksError) {
    // Clean up the entry if chunk insertion fails
    await supabase.from('knowledge_entries').delete().eq('id', entry.id);
    throw new Error(`Failed to save chunks: ${chunksError.message}`);
  }

  // 4. Update chunk_count
  const { error: updateError } = await supabase
    .from('knowledge_entries')
    .update({
      chunk_count: chunksWithEmbeddings.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entry.id);

  if (updateError) {
    console.error('[embed-entry] Failed to update chunk_count:', updateError.message);
  }

  return { ...entry, chunk_count: chunksWithEmbeddings.length } as KnowledgeEntry;
}

// ---------------------------------------------------------------------------
// Re-embed an existing entry (used when editing content)
// Deletes old chunks, creates new ones from updated content
// ---------------------------------------------------------------------------
export async function reEmbedEntry(params: {
  entryId: string;
  userId: string;
  title?: string;
  content?: string;
}): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch current entry to get content if not provided
  const { data: entry, error: fetchError } = await supabase
    .from('knowledge_entries')
    .select('content')
    .eq('id', params.entryId)
    .eq('user_id', params.userId)
    .single();

  if (fetchError || !entry) {
    throw new NotFoundError('Knowledge entry not found');
  }

  const content = params.content ?? entry.content;

  // 2. Update entry fields
  const updateFields: {
    updated_at: string;
    title?: string;
    content?: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (params.title !== undefined) updateFields.title = params.title;
  if (params.content !== undefined) updateFields.content = params.content;

  const { error: updateEntryError } = await supabase
    .from('knowledge_entries')
    .update(updateFields)
    .eq('id', params.entryId)
    .eq('user_id', params.userId);

  if (updateEntryError) {
    throw new Error(`Failed to update entry: ${updateEntryError.message}`);
  }

  // 3. Only re-embed if content changed
  if (params.content !== undefined) {
    // Chunk and embed new content FIRST — if this fails, old chunks are preserved
    const chunksWithEmbeddings = await chunkAndEmbed(content);

    const chunkPayload = chunksWithEmbeddings.map((chunk) => ({
      content: chunk.content,
      embedding: JSON.stringify(chunk.embedding),
      chunk_index: chunk.chunkIndex,
      is_active: true,
      metadata: {},
    }));

    // Atomic swap: delete old + insert new + update count in one transaction
    const { error: swapError } = await supabase.rpc('swap_chunks', {
      p_entry_id: params.entryId,
      p_user_id: params.userId,
      p_chunks: JSON.stringify(chunkPayload),
    });

    if (swapError) {
      throw new Error(`Failed to swap chunks: ${swapError.message}`);
    }
  }
}
