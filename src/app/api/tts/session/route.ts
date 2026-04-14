// POST /api/tts/session — returns a signed ElevenLabs WebSocket URL for voice calls
import { createVoiceSession, VoiceSessionError } from '@/features/tts/api/session.service';
import { sessionRequestSchema } from '@/features/tts/api/tts.schema';
import { verifySession } from '@/lib/dal';
import { ttsRateLimit, getClientIP, handleRateLimit } from '@/lib/ratelimit';

export const POST = async (req: Request): Promise<Response> => {
  // 1. Rate limit — always first
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

  const parsed = sessionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Delegate to service
  try {
    const result = await createVoiceSession(
      userId,
      parsed.data.characterId,
      parsed.data.conversationId
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitResult.headers,
      },
    });
  } catch (error) {
    if (error instanceof VoiceSessionError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
};
