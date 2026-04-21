import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeStream = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
};

const makeOkResponse = (chunks: string[] = ['Hello!']): Response =>
  new Response(makeStream(chunks), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });

const makeErrorResponse = (status: number, body: object): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ---------------------------------------------------------------------------
// Import hook AFTER mocks
// ---------------------------------------------------------------------------

import { useChat } from '@/features/chat/hooks/use-chat';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHARACTER_ID = 'angry-grandpa';
const CONVERSATION_ID = '550e8400-e29b-41d4-a716-446655440001';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Stable UUID so we can reference the assistant message id
    vi.spyOn(global.crypto, 'randomUUID')
      .mockReturnValueOnce('user-msg-id' as `${string}-${string}-${string}-${string}-${string}`)
      .mockReturnValueOnce('asst-msg-id' as `${string}-${string}-${string}-${string}-${string}`)
      .mockImplementation(
        () => 'fallback-uuid' as `${string}-${string}-${string}-${string}-${string}`
      );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('has empty messages array', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
    });

    it('is not streaming', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isStreaming).toBe(false);
    });

    it('has no error', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.error).toBeNull();
    });

    it('accepts initialMessages', () => {
      const initial = [
        {
          id: 'init-1',
          conversation_id: CONVERSATION_ID,
          role: 'user' as const,
          content: 'Pre-loaded message',
          model: null,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ];

      const { result } = renderHook(() => useChat({ initialMessages: initial }));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Pre-loaded message');
    });
  });

  describe('sendMessage — optimistic updates', () => {
    it('adds user message immediately (optimistic)', async () => {
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['Hi']));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        void result.current.sendMessage('Hello!', CHARACTER_ID, CONVERSATION_ID);
      });

      // User message should appear immediately
      const userMsg = result.current.messages.find((m) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg?.content).toBe('Hello!');
    });

    it('adds empty assistant placeholder while streaming', async () => {
      // Pause stream so we can inspect mid-flight state
      let resolveStream!: () => void;
      const pausedStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(''));
          // Never closes until we resolve
        },
      });

      vi.mocked(fetch).mockResolvedValue(
        new Response(pausedStream, { status: 200 })
      );

      const { result } = renderHook(() => useChat());

      act(() => {
        void result.current.sendMessage('Hey', CHARACTER_ID, CONVERSATION_ID);
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistantMsg).toBeDefined();
      expect(assistantMsg?.content).toBe('');
    });

    it('sets isStreaming to true while waiting for response', async () => {
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['streaming data']));

      const { result } = renderHook(() => useChat());

      act(() => {
        void result.current.sendMessage('Hello', CHARACTER_ID, CONVERSATION_ID);
      });

      // isStreaming should be true right after sendMessage is called
      expect(result.current.isStreaming).toBe(true);
    });
  });

  describe('sendMessage — streaming response', () => {
    it('accumulates chunks into the assistant message', async () => {
      // The hook sends a single response body — content arrives as one stream chunk
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['Hello there!']));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistantMsg?.content).toBe('Hello there!');
    });

    it('sets isStreaming to false after streaming completes', async () => {
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['Done!']));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('removes empty assistant message if stream yields no content', async () => {
      // Stream with only whitespace — assistant bubble should be removed
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['   ']));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistantMsg).toBeUndefined();
    });
  });

  describe('sendMessage — error handling', () => {
    it('sets error when the server returns a non-OK response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeErrorResponse(500, { error: 'Internal Server Error' })
      );

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      expect(result.current.error).toBe('Internal Server Error');
    });

    it('sets error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('removes assistant placeholder on error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistantMsg).toBeUndefined();
    });

    it('sets isStreaming to false after an error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hi', CHARACTER_ID, CONVERSATION_ID);
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', async () => {
      vi.mocked(fetch).mockResolvedValue(makeOkResponse(['Hi']));

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello', CHARACTER_ID, CONVERSATION_ID);
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });
});
