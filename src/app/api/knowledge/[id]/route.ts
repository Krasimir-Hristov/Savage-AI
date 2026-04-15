import { verifySession } from '@/lib/dal';
import { getClientIP, handleRateLimit, knowledgeRateLimit } from '@/lib/ratelimit';
import { updateKnowledgeSchema } from '@/features/rag/api/knowledge.schema';
import { deleteKnowledgeEntry, getKnowledgeEntryWithChunks } from '@/features/rag/dal';
import { reEmbedEntry } from '@/features/rag/services/embed-entry';

// ---------------------------------------------------------------------------
// GET /api/knowledge/[id] — get entry with chunks
// ---------------------------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(knowledgeRateLimit, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  const { id } = await params;

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

  try {
    const entry = await getKnowledgeEntryWithChunks(id, userId);
    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/knowledge/[id] — update entry (re-embed if content changed)
// ---------------------------------------------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(knowledgeRateLimit, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  const { id } = await params;

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

  const parsed = updateKnowledgeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await reEmbedEntry({
      entryId: id,
      userId,
      title: parsed.data.title,
      content: parsed.data.content,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Update failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/knowledge/[id] — delete entry (CASCADE handles chunks)
// ---------------------------------------------------------------------------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(knowledgeRateLimit, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  const { id } = await params;

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

  try {
    await deleteKnowledgeEntry(id, userId);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Delete failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
