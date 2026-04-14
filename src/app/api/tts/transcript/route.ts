// POST /api/tts/transcript — saves voice call transcript messages to a conversation
import { saveVoiceTranscript, TranscriptSaveError } from '@/features/tts/api/transcript.service';
import { transcriptRequestSchema } from '@/features/tts/api/tts.schema';
import { verifySession } from '@/lib/dal';
import { ttsRateLimit, getClientIP, handleRateLimit } from '@/lib/ratelimit';

export const POST = async (req: Request): Promise<Response> => {
  // 1. Rate limit
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(ttsRateLimit, ip);

  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  // 2. Verify session
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

  // 3. Parse + validate body
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = transcriptRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Delegate to service
  try {
    await saveVoiceTranscript(userId, parsed.data.conversationId, parsed.data.messages);

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitResult.headers,
      },
    });
  } catch (error) {
    if (error instanceof TranscriptSaveError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
};
