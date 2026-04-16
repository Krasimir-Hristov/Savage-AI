import 'server-only';

import { embedQuery } from '@/lib/embeddings/client';
import { createClient } from '@/lib/supabase/server';
import type { VectorSearchResult } from '@/types/knowledge';

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.1;

/**
 * Search the user's knowledge base using vector similarity.
 * Embeds the query, calls match_documents RPC, returns ranked results.
 * Only returns active chunks belonging to the specified user.
 */
export async function searchKnowledge(
  query: string,
  userId: string,
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): Promise<VectorSearchResult[]> {
  if (!query.trim()) return [];

  // 1. Embed the search query
  console.log('[search] embedding query length:', query.length);
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(query);
  } catch (error) {
    console.error('[search] embedding failed:', error instanceof Error ? error.message : error);
    return [];
  }
  console.log('[search] embedding done, dimensions:', queryEmbedding.length);

  // 2. Call Supabase RPC — this function filters by user_id AND is_active
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: topK,
    filter_user_id: userId,
  });

  if (error) {
    console.error('[search] match_documents RPC error:', error.message);
    return [];
  }

  const rows = (data ?? []) as VectorSearchResult[];
  console.log('[search] RPC returned', rows.length, 'results above threshold', threshold);
  if (rows.length === 0 && process.env.NODE_ENV === 'development') {
    // Run again with very low threshold to show actual scores for debugging
    const { data: debugData } = await supabase.rpc('match_documents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.0,
      match_count: 3,
      filter_user_id: userId,
    });
    if (debugData && debugData.length > 0) {
      console.log(
        '[search] DEBUG — best scores without threshold filter:',
        (debugData as VectorSearchResult[]).map((r) => r.similarity.toFixed(4)).join(', ')
      );
    } else {
      console.log(
        '[search] DEBUG — no rows returned even with threshold=0 (user_id mismatch or no chunks?)'
      );
    }
  }
  return rows;
}

/**
 * Format search results into a context string for injection into system prompt.
 */
export function formatSearchResults(results: VectorSearchResult[]): string {
  if (results.length === 0) return '';

  const chunks = results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n---\n');

  return [
    "[USER'S KNOWLEDGE BASE — RELEVANT CONTEXT]",
    "INSTRUCTION: Use the context below to answer questions about the user's documents. Stay in character while using this information.",
    'RULES:',
    '1. Prefer facts explicitly stated in the context below over assumptions.',
    '2. If the exact information is not in the context, supplement from your general knowledge but do not fabricate document-specific details (names, dates, numbers).',
    '3. Quote the document directly when possible.',
    '4. Answer the question first using this data, then add your character commentary.',
    '---',
    chunks,
    '---',
    '[END CONTEXT]',
  ].join('\n');
}
