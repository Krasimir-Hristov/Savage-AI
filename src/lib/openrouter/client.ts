import 'server-only';

import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage, BaseMessageChunk } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

import { DEFAULT_CHAT_MODEL } from '@/features/characters/data/models';
import { IMAGE_MARKER_PREFIX, RAG_SEARCH_MARKER } from '@/lib/constants/markers';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Re-export markers for existing consumers
export { IMAGE_MARKER_PREFIX, RAG_SEARCH_MARKER };

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

/**
 * Strip leaked tool-calling reasoning and internal chain-of-thought from model output.
 * Some models (e.g. Gemini Flash) include "PLAN:", "I should...", "The user wants..." etc.
 * in their text even when instructed not to. This removes those sections as a safety net.
 */
function stripToolLeakage(text: string): string {
  // Remove "PLAN:" blocks (with numbered steps) — greedy up to a double newline or end
  let cleaned = text.replace(/\bPLAN:\s*\n(?:\s*\d+\.\s*.+\n?)+/gi, '');
  // Remove lines referencing tool calls like: Call search_knowledge with query "..."
  cleaned = cleaned.replace(
    /^.*\b(?:call|invoke|use)\s+(?:`?search_knowledge`?|`?tool`?).*$/gim,
    ''
  );
  // Remove standalone lines that are just a tool name in backticks
  cleaned = cleaned.replace(/^\s*`search_knowledge`\s*$/gm, '');
  // Remove internal reasoning lines that leak chain-of-thought at the start of the response
  // Only match lines with explicit tool/meta-reasoning words to avoid trimming legit first-person replies
  cleaned = cleaned.replace(
    /^(?:The user (?:wants|asks|is asking|asked|is requesting|is looking)\b[^\n]*\n?)+/i,
    ''
  );
  cleaned = cleaned.replace(
    /^(?:I (?:need to|should|will|must|have to|want to)\s+(?:search|call|invoke|look up|find|use|query|check|fetch)[^\n]*\n?)+/i,
    ''
  );
  // Remove numbered reasoning steps at the start (1. Search... 2. Summarize... 3. End with...)
  cleaned = cleaned.replace(
    /^(?:\s*\d+\.\s*(?:Search|Call|Look|Find|Summarize|Respond|End with|Use|Invoke|Query)[^\n]*\n?)+/i,
    ''
  );
  // Collapse excessive blank lines left behind
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

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

        // Append tool-usage instructions to hide internals from the user
        const toolHidingInstruction =
          '\n\nCRITICAL INSTRUCTION — INTERNAL REASONING:\n' +
          '- NEVER output your internal reasoning, thoughts, or plans to the user.\n' +
          '- NEVER write lines like "The user wants...", "I should...", "I need to find...", "PLAN:", or any meta-commentary about what you are doing.\n' +
          '- NEVER mention tool names like "search_knowledge", "query", or describe calling tools.\n' +
          '- NEVER output numbered steps describing your plan (e.g. "1. Search... 2. Summarize...").\n' +
          '- Just respond directly and naturally with the answer IN CHARACTER. Start your response with actual content, not reasoning.';

        // Build conversation with system prompt
        const conversationMessages: BaseMessage[] = [
          new SystemMessage(effectiveSystemPrompt + toolHidingInstruction),
          ...langchainMessages,
        ];

        // ReAct loop — max 3 tool rounds to prevent infinite loops
        const MAX_TOOL_ROUNDS = 3;
        let finalAnswerEmitted = false;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Non-streaming invoke to check for tool calls
          const response: BaseMessageChunk = await llmWithTools.invoke(conversationMessages);

          const toolCalls = (response as AIMessage).tool_calls;

          if (!toolCalls || toolCalls.length === 0) {
            // Final answer — stream it (strip any leaked tool reasoning)
            const raw = typeof response.content === 'string' ? response.content : '';
            const text = stripToolLeakage(raw);
            if (text) {
              controller.enqueue(encoder.encode(text));
              finalAnswerEmitted = true;
            }
            break;
          }

          // Emit search indicator
          controller.enqueue(encoder.encode(RAG_SEARCH_MARKER + '\n'));

          // Execute tool calls
          conversationMessages.push(response as AIMessage);

          for (const toolCall of toolCalls) {
            const tool = tools.find((t) => t.name === toolCall.name);
            if (!tool) {
              console.warn(`[streamChatWithTools] Unknown tool requested: ${toolCall.name}`);
              conversationMessages.push(
                new ToolMessage({
                  content: `Tool "${toolCall.name}" is not available.`,
                  tool_call_id: toolCall.id ?? '',
                })
              );
              continue;
            }

            let toolResult: unknown;
            try {
              toolResult = await tool.invoke(toolCall.args);
            } catch (toolError) {
              console.error(`[streamChatWithTools] Tool ${toolCall.name} failed:`, toolError);
              toolResult = `Tool execution failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`;
            }

            conversationMessages.push(
              new ToolMessage({
                content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                tool_call_id: toolCall.id ?? '',
              })
            );
          }

          // Loop continues — model will see tool results and generate response
        }

        // If loop exhausted or no final text was emitted, send a fallback
        if (!finalAnswerEmitted) {
          const fallback = await llm.invoke(conversationMessages);
          const raw = typeof fallback.content === 'string' ? fallback.content : '';
          const text = stripToolLeakage(raw);
          if (text) controller.enqueue(encoder.encode(text));
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
