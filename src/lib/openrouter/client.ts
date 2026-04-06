import 'server-only';

import type { OpenRouterMessage, StreamChunk } from '@/lib/openrouter/types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export async function streamChat(
  messages: OpenRouterMessage[],
  model?: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  let response: Response;

  try {
    response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://savage-ai.vercel.app',
        'X-Title': 'SavageAI',
      },
      body: JSON.stringify({
        model: model ?? DEFAULT_MODEL,
        messages,
        stream: true,
      }),
    });
  } catch (error) {
    throw new Error(
      `OpenRouter request failed: ${error instanceof Error ? error.message : 'Network error'}`
    );
  }

  if (!response.ok) {
    let errorText = `HTTP ${response.status}`;
    try {
      errorText = await response.text();
    } catch {
      // Body read failed — keep the status code message
    }
    throw new Error(`OpenRouter ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('OpenRouter returned an empty response body');
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  // Transform SSE stream (data: {...}\n\n) into plain text tokens
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      // Split on newlines, keeping the incomplete last line in the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and SSE comments (lines starting with ':')
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);

        // End of stream signal — stream closes naturally when connection drops
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data) as StreamChunk;
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        } catch {
          // Skip malformed JSON chunks (e.g. keep-alive comments)
        }
      }
    },

    flush(controller) {
      // Handle any remaining bytes in the buffer after the stream closes
      const trimmed = buffer.trim();
      if (!trimmed.startsWith('data: ')) return;

      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const json = JSON.parse(data) as StreamChunk;
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      } catch {
        // Ignore final malformed chunk
      }
    },
  });

  return response.body.pipeThrough(transformStream);
}
