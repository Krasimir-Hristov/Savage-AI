import 'server-only';

import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { DEFAULT_CHAT_MODEL } from '@/features/characters/data/models';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Stream marker protocol - client parses this to extract image URLs */
export const IMAGE_MARKER_PREFIX = '__SAVAGE_IMG__';

// ---------------------------------------------------------------------------
// Model factory
// ---------------------------------------------------------------------------

function createOpenRouterModel(model?: string): ChatOpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  return new ChatOpenAI({
    model: model ?? DEFAULT_CHAT_MODEL,
    apiKey,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://savage-ai.vercel.app',
        'X-Title': 'SavageAI',
      },
    },
    streaming: true,
    streamUsage: false,
  });
}

// ---------------------------------------------------------------------------
// Public API - streaming chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Streams the character response as UTF-8 text chunks.
 *
 * Two paths:
 *  - imageUrl provided: character reacts to the generated image, then injects __SAVAGE_IMG__ marker
 *  - Otherwise: direct LLM streaming
 */
export async function streamChatAgent(
  messages: ChatMessage[],
  systemPrompt: string,
  model?: string,
  imageUrl?: string
): Promise<ReadableStream<Uint8Array>> {
  const llm = createOpenRouterModel(model);

  const langchainMessages = messages.map((msg) => {
    if (msg.role === 'user') return new HumanMessage(msg.content);
    if (msg.role === 'assistant') return new AIMessage(msg.content);
    return new HumanMessage(msg.content);
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (imageUrl) {
          const reactionSystemPrompt =
            systemPrompt +
            '\n\nCONTEXT: The user asked for an image. It has been successfully generated and will be shown below your response. React in character to having just created it - make a brief comment (1-3 sentences). Do NOT say you will generate anything; it is already done.';

          const reactionStream = await llm.stream([
            new SystemMessage(reactionSystemPrompt),
            ...langchainMessages,
          ]);

          for await (const chunk of reactionStream) {
            const text = typeof chunk.content === 'string' ? chunk.content : '';
            if (text) controller.enqueue(encoder.encode(text));
          }

          controller.enqueue(encoder.encode('\n' + IMAGE_MARKER_PREFIX + imageUrl + '\n'));
        } else {
          const chatStream = await llm.stream([
            new SystemMessage(systemPrompt),
            ...langchainMessages,
          ]);

          for await (const chunk of chatStream) {
            const text = typeof chunk.content === 'string' ? chunk.content : '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error instanceof Error ? error : new Error('Stream failed'));
      }
    },
  });
}

/**
 * Returns a ChatOpenAI instance configured for OpenRouter.
 * Used by features that need direct LLM access (e.g. prompt extraction).
 */
export function createChatModel(model?: string): ChatOpenAI {
  return createOpenRouterModel(model);
}
