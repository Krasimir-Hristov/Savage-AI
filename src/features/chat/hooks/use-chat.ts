'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@/types/chat';
import { IMAGE_MARKER_PREFIX, RAG_SEARCH_MARKER } from '@/lib/constants/markers';

const MAX_CONTEXT_MESSAGES = 20;

interface UseChatOptions {
  initialMessages?: Message[];
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  isSearchingKnowledge: boolean;
  error: string | null;
  sendMessage: (content: string, characterId: string, conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChat = ({ initialMessages = [] }: UseChatOptions = {}): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, characterId: string, conversationId: string): Promise<void> => {
      // Abort any in-flight request before starting a new one
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'user',
        content,
        model: null,
        image_url: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      const contextMessages = [...messagesRef.current, userMessage]
        .filter((m) => m.role !== 'system')
        .slice(-MAX_CONTEXT_MESSAGES)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const assistantId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantId,
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        model: null,
        image_url: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: contextMessages, characterId, conversationId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let message = `Request failed: ${response.status}`;
          try {
            const data = (await response.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // ignore parse error, use status message
          }
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          let chunk = decoder.decode(value, { stream: true });

          // Detect RAG search marker — show indicator, strip from content
          if (chunk.includes(RAG_SEARCH_MARKER)) {
            setIsSearchingKnowledge(true);
            chunk = chunk.replaceAll(RAG_SEARCH_MARKER + '\n', '');
            chunk = chunk.replaceAll(RAG_SEARCH_MARKER, '');
            if (!chunk) continue;
          }

          // Once real content arrives after search, clear the indicator
          if (chunk.trim()) {
            setIsSearchingKnowledge(false);
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }

        // Flush any remaining buffered bytes from the decoder
        const remaining = decoder.decode();
        if (remaining) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + remaining } : m))
          );
        }

        // Remove assistant bubble if stream ended with no content (e.g. model returned empty)
        setMessages((prev) => {
          const msg = prev.find((m) => m.id === assistantId);
          if (msg && !msg.content.trim()) {
            return prev.filter((m) => m.id !== assistantId);
          }
          return prev;
        });

        // After stream ends, parse __SAVAGE_IMG__ marker if present
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;

            const markerIdx = m.content.indexOf(IMAGE_MARKER_PREFIX);
            if (markerIdx === -1) return m;

            const urlStart = markerIdx + IMAGE_MARKER_PREFIX.length;
            const urlEnd = m.content.indexOf('\n', urlStart);
            const imageUrl = m.content.slice(urlStart, urlEnd === -1 ? undefined : urlEnd).trim();

            // Strip the marker line from displayed content
            const before = m.content.slice(0, markerIdx);
            const after = urlEnd === -1 ? '' : m.content.slice(urlEnd + 1);
            const cleanContent = (before + after).trim();

            return { ...m, content: cleanContent, image_url: imageUrl || null };
          })
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        setIsSearchingKnowledge(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const clearMessages = useCallback((): void => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, isSearchingKnowledge, error, sendMessage, clearMessages };
};
