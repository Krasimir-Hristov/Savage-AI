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

// ---------------------------------------------------------------------------
// Public API - streaming chat WITH tool calling (RAG)
// ---------------------------------------------------------------------------

import type { StructuredToolInterface } from '@langchain/core/tools';
import type { BaseMessageChunk } from '@langchain/core/messages';

/** RAG search marker — client uses this to show "searching knowledge base" indicator */
export const RAG_SEARCH_MARKER = '__SAVAGE_RAG_SEARCH__';

/**
 * Streams a character response with tool-calling support.
 * Uses bindTools() + manual ReAct loop:
 *   1. Call model with tools bound
 *   2. If model emits tool_calls → execute tools → feed results back
 *   3. Repeat until model produces a final text response
 *   4. Stream the final response to client
 *
 * Intermediate tool calls are NOT streamed — only the final answer is.
 * A RAG_SEARCH_MARKER is emitted when a tool is invoked (for UI indication).
 */
export async function streamChatWithTools(
  messages: ChatMessage[],
  systemPrompt: string,
  tools: StructuredToolInterface[],
  model?: string,
  imageUrl?: string
): Promise<ReadableStream<Uint8Array>> {
  const llm = createOpenRouterModel(model);
  const llmWithTools = llm.bindTools(tools);

  const langchainMessages = messages.map((msg) => {
    if (msg.role === 'user') return new HumanMessage(msg.content);
    if (msg.role === 'assistant') return new AIMessage(msg.content);
    return new HumanMessage(msg.content);
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const effectiveSystemPrompt = imageUrl
          ? systemPrompt +
            '\n\nCONTEXT: The user asked for an image. It has been successfully generated and will be shown below your response. React in character to having just created it - make a brief comment (1-3 sentences). Do NOT say you will generate anything; it is already done.'
          : systemPrompt;

        // Build conversation with system prompt
        const conversationMessages = [
          new SystemMessage(effectiveSystemPrompt),
          ...langchainMessages,
        ];

        // ReAct loop — max 3 tool rounds to prevent infinite loops
        const MAX_TOOL_ROUNDS = 3;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Non-streaming invoke to check for tool calls
          const response: BaseMessageChunk = await llmWithTools.invoke(conversationMessages);

          const toolCalls = (response as AIMessage).tool_calls;

          if (!toolCalls || toolCalls.length === 0) {
            // Final answer — stream it
            const text = typeof response.content === 'string' ? response.content : '';
            if (text) {
              // Re-stream through LLM for natural token-by-token delivery
              // (since we used invoke above, we have the full text)
              controller.enqueue(encoder.encode(text));
            }
            break;
          }

          // Emit search indicator
          controller.enqueue(encoder.encode(RAG_SEARCH_MARKER + '\n'));

          // Execute tool calls
          conversationMessages.push(response as AIMessage);

          for (const toolCall of toolCalls) {
            const tool = tools.find((t) => t.name === toolCall.name);
            if (!tool) continue;

            const toolResult = await tool.invoke(toolCall.args);

            const { ToolMessage } = await import('@langchain/core/messages');
            conversationMessages.push(
              new ToolMessage({
                content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                tool_call_id: toolCall.id ?? '',
              })
            );
          }

          // Loop continues — model will see tool results and generate response
        }

        // Append image marker if applicable
        if (imageUrl) {
          controller.enqueue(encoder.encode('\n' + IMAGE_MARKER_PREFIX + imageUrl + '\n'));
        }

        controller.close();
      } catch (error) {
        controller.error(error instanceof Error ? error : new Error('Stream with tools failed'));
      }
    },
  });
}
