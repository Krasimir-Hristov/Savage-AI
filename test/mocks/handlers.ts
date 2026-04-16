import { http, HttpResponse } from 'msw';
import { mockConversations } from '../fixtures/conversations';
import { mockKnowledgeEntries, mockKnowledgeEntryWithChunks } from '../fixtures/knowledge';
import { createStreamingResponse, defaultChatTokens } from './openrouter';

export const handlers = [
  // ---------------------------------------------------------------------------
  // Chat — POST /api/chat (streaming)
  // ---------------------------------------------------------------------------
  http.post('/api/chat', () => {
    return new HttpResponse(createStreamingResponse(defaultChatTokens), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }),

  // ---------------------------------------------------------------------------
  // Conversations
  // ---------------------------------------------------------------------------
  http.get('/api/conversations', () => {
    return HttpResponse.json(mockConversations);
  }),

  // ---------------------------------------------------------------------------
  // Knowledge
  // ---------------------------------------------------------------------------
  http.get('/api/knowledge', () => {
    return HttpResponse.json(mockKnowledgeEntries);
  }),

  http.post('/api/knowledge', async ({ request }) => {
    const contentType = request.headers.get('content-type') ?? '';
    const isFile = contentType.includes('multipart/form-data');
    return HttpResponse.json(
      {
        ...mockKnowledgeEntries[0],
        id: crypto.randomUUID(),
        source_type: isFile ? 'file' : 'manual',
      },
      { status: 201 }
    );
  }),

  http.get('/api/knowledge/:id', ({ params }) => {
    const entry = mockKnowledgeEntries.find((e) => e.id === params.id);
    if (!entry) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...entry, chunks: mockKnowledgeEntryWithChunks.chunks });
  }),

  http.patch('/api/knowledge/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entry = mockKnowledgeEntries.find((e) => e.id === params.id);
    if (!entry) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json({ ...entry, ...body });
  }),

  http.delete('/api/knowledge/:id', ({ params }) => {
    const entry = mockKnowledgeEntries.find((e) => e.id === params.id);
    if (!entry) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json({ success: true });
  }),

  http.patch('/api/knowledge/:id/chunks/:chunkId', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, ...body });
  }),

  // ---------------------------------------------------------------------------
  // TTS
  // ---------------------------------------------------------------------------
  http.post('/api/tts/session', () => {
    return HttpResponse.json({
      signedUrl: 'https://api.elevenlabs.io/v1/convai/conversation?agent_id=mock-agent',
      promptOverride: { prompt: 'Mock system prompt override' },
    });
  }),

  http.post('/api/tts/transcript', () => {
    return HttpResponse.json({ success: true });
  }),
];
