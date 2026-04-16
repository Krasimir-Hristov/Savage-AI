// ---------------------------------------------------------------------------
// OpenRouter / streaming response helpers for MSW handlers
// ---------------------------------------------------------------------------

/**
 * Creates a ReadableStream that emits the given text tokens with small delays.
 * Simulates the raw streaming response from /api/chat.
 */
export const createStreamingResponse = (tokens: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
      }
      controller.close();
    },
  });
};

/**
 * Default mock streaming tokens for a standard chat response.
 */
export const defaultChatTokens = ['Hello', ' from', ' SavageAI', '!'];

/**
 * Mock streaming tokens that include the RAG search marker.
 */
export const ragSearchTokens = [
  '__RAG_SEARCH__',
  'Searching...',
  '\n\nHere',
  ' are',
  ' the',
  ' results.',
];

/**
 * Mock streaming tokens that include an image marker.
 */
export const imageResponseTokens = [
  'Here',
  ' is',
  ' your',
  ' image',
  '__SAVAGE_IMG__https://mock.supabase.co/image.jpg',
];
