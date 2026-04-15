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
  console.log('[search] embedding query:', query.slice(0, 80));
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
    "[USER'S KNOWLEDGE BASE CONTEXT]",
    'The user has provided the following personal information/documents.',
    'CRITICAL RULES:',
    '1. ONLY state facts that are explicitly written in the context below. Do NOT invent, guess, or hallucinate any names, addresses, dates, numbers, or other details.',
    '2. If information is NOT present in the context, say "I do not see that in your documents" — never make it up.',
    '3. Quote the document directly when possible.',
    '---',
    chunks,
    '---',
    '[END CONTEXT]',
  ].join('\n');
}
