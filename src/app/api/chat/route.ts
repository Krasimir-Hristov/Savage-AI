// POST /api/chat — streaming chat endpoint
import { after } from 'next/server';

import { getCharacter } from '@/features/characters/data';
import { detectImageIntent, extractImagePrompt, generateImage } from '@/features/image-gen';
import { chatRequestSchema } from '@/features/chat/api/chat.schema';
import { verifySession } from '@/lib/dal';
import { createChatModel, IMAGE_MARKER_PREFIX, streamChatAgent } from '@/lib/openrouter/client';
import type { ChatMessage } from '@/lib/openrouter/client';
import { chatRateLimit, getClientIP, handleRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request): Promise<Response> {
  // 1. Rate limit — always first, before any auth or DB calls
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(chatRateLimit, ip);

  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  // 2. Verify session
  let userId: string;

  try {
    const session = await verifySession();
    userId = session.userId;
  } catch (error) {
    // verifySession() calls redirect() internally — catch it and return 401 for API routes
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }

  // 3. Parse + validate request body
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages, characterId, conversationId } = parsed.data;

  // 4. Verify conversation ownership — prevents wasting OpenRouter credits on unauthorized requests
  const supabase = await createClient();

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Resolve character + build messages with system prompt prepended
  let character: ReturnType<typeof getCharacter>;

  try {
    character = getCharacter(characterId);
  } catch {
    return new Response(JSON.stringify({ error: 'Character not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messagesWithSystem: ChatMessage[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // 6. Detect image intent → orchestrate generation before streaming
  let imageUrl: string | undefined;

  if (detectImageIntent(messagesWithSystem)) {
    const lastUserMsg = messagesWithSystem.findLast((m) => m.role === 'user');
    if (lastUserMsg) {
      try {
        const llm = createChatModel(character.modelPreference);
        const imagePrompt = await extractImagePrompt(lastUserMsg.content, llm);
        console.log('[route] image intent detected', { userId });
        imageUrl = (await generateImage(imagePrompt, userId)) ?? undefined;
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'AI service unavailable',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // 7. Stream from OpenRouter
  let stream: ReadableStream<Uint8Array>;

  try {
    stream = await streamChatAgent(
      messagesWithSystem,
      character.systemPrompt,
      character.modelPreference,
      imageUrl
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'AI service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 7. Tee the stream: one branch for the client, one for collecting the full assistant text
  const [clientStream, collectorStream] = stream.tee();

  // 8. Save messages to DB after the response has been sent (non-blocking)
  const userContent = messages[messages.length - 1].content;
  const resolvedModel = character.modelPreference ?? 'google/gemini-2.0-flash-exp:free';

  after(async () => {
    try {
      // Collect the full assistant response from the collector stream
      const reader = collectorStream.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
      }

      // Flush remaining bytes
      assistantContent += decoder.decode();

      if (!assistantContent) return;

      // Extract image URL from __SAVAGE_IMG__ marker (if present)
      let imageUrl: string | null = null;
      const markerIdx = assistantContent.indexOf(IMAGE_MARKER_PREFIX);

      if (markerIdx !== -1) {
        const urlStart = markerIdx + IMAGE_MARKER_PREFIX.length;
        // URL ends at newline or end of string
        const urlEnd = assistantContent.indexOf('\n', urlStart);
        imageUrl = assistantContent.slice(urlStart, urlEnd === -1 ? undefined : urlEnd).trim();
        // Strip the marker line from content
        const before = assistantContent.slice(0, markerIdx);
        const after = urlEnd === -1 ? '' : assistantContent.slice(urlEnd + 1);
        assistantContent = (before + after).trim();
      }

      // Insert both messages in a single round trip
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'user' as const,
          content: userContent,
          model: null,
          image_url: null,
        },
        {
          conversation_id: conversationId,
          role: 'assistant' as const,
          content: assistantContent,
          model: resolvedModel,
          image_url: imageUrl,
        },
      ]);
    } catch {
      // DB write failure must not affect the streaming response already sent to client
      // TODO: add proper error logging/monitoring here
    }
  });

  // 9. Return the streaming response
  return new Response(clientStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      ...rateLimitResult.headers,
    },
  });
}
