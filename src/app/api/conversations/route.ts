// GET /api/conversations — returns the current user's conversations list
import { verifySession, getConversations } from '@/lib/dal';
import { conversationsRateLimit, getClientIP, handleRateLimit } from '@/lib/ratelimit';

export const GET = async (req: Request): Promise<Response> => {
  // 1. Rate limit first
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(conversationsRateLimit, ip);

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

  // 3. Fetch conversations
  try {
    const conversations = await getConversations(userId);

    return new Response(JSON.stringify(conversations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitResult.headers,
      },
    });
  } catch (error) {
    console.error('[GET /api/conversations] Failed to fetch conversations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
