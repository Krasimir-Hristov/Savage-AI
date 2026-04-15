import 'server-only';

import { verifySession } from '@/lib/dal';
import { getClientIP, handleRateLimit, knowledgeRateLimit } from '@/lib/ratelimit';
import { toHttpResponse } from '@/lib/errors';
import { toggleChunkSchema } from '@/features/rag/api/knowledge.schema';
import { toggleChunkActive } from '@/features/rag/dal';

// ---------------------------------------------------------------------------
// PATCH /api/knowledge/[id]/chunks/[chunkId] — toggle chunk active/inactive
// ---------------------------------------------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; chunkId: string }> }
): Promise<Response> {
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(knowledgeRateLimit, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  const { id, chunkId } = await params;

  let userId: string;
  try {
    const session = await verifySession();
    userId = session.userId;
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = toggleChunkSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await toggleChunkActive(chunkId, userId, parsed.data.is_active, id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
    });
  } catch (error) {
    console.error('[knowledge/chunks/PATCH]', error);
    return toHttpResponse(error);
  }
}
