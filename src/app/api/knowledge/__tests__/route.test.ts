import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/ratelimit', () => ({
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  handleRateLimit: vi.fn().mockResolvedValue({ success: true, headers: {} }),
  knowledgeRateLimit: {},
  knowledgeUploadRateLimit: {},
}));

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: 'mock-user-id', email: 'test@example.com' }),
}));

vi.mock('@/features/rag/dal', () => ({
  getKnowledgeEntries: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/rag/services/embed-entry', () => ({
  createAndEmbedEntry: vi.fn(),
}));

vi.mock('@/features/rag/utils/parse-file', () => ({
  parseFile: vi.fn().mockResolvedValue('Parsed text content from file.'),
}));

// ---------------------------------------------------------------------------
// Lazy imports
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/knowledge/route';
import { createAndEmbedEntry } from '@/features/rag/services/embed-entry';
import { verifySession } from '@/lib/dal';
import { handleRateLimit } from '@/lib/ratelimit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const makeJsonRequest = (body: unknown) =>
  new Request('http://localhost/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeFileRequest = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  // Note: do NOT set Content-Type manually — browser sets it with boundary
  return new Request('http://localhost/api/knowledge', { method: 'POST', body: fd });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/knowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(handleRateLimit).mockResolvedValue({ success: true, headers: {} });
    vi.mocked(verifySession).mockResolvedValue({
      userId: 'mock-user-id',
      email: 'test@example.com',
    });
    vi.mocked(createAndEmbedEntry).mockResolvedValue({
      id: 'new-entry-id',
      user_id: 'mock-user-id',
      title: 'My notes',
      content: 'Hello world',
      source_type: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never);
  });

  describe('valid manual text entry → 201', () => {
    it('returns 201 and calls createAndEmbedEntry with correct data', async () => {
      const res = await POST(makeJsonRequest({ content: 'Hello world', title: 'My notes' }));

      expect(res.status).toBe(201);
      expect(createAndEmbedEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mock-user-id',
          content: 'Hello world',
          sourceType: 'manual',
        })
      );
    });

    it('accepts content without a title', async () => {
      const res = await POST(makeJsonRequest({ content: 'Just content' }));

      expect(res.status).toBe(201);
    });
  });

  describe('invalid body → 400', () => {
    it('returns 400 for empty content', async () => {
      const res = await POST(makeJsonRequest({ content: '' }));

      expect(res.status).toBe(400);
      expect(createAndEmbedEntry).not.toHaveBeenCalled();
    });

    it('returns 400 for missing content field', async () => {
      const res = await POST(makeJsonRequest({ title: 'Only title' }));

      expect(res.status).toBe(400);
      expect(createAndEmbedEntry).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed JSON', async () => {
      const req = new Request('http://localhost/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('file upload — file too large → 400', () => {
    it('returns 400 when file exceeds the 10 MB limit', async () => {
      // Allocate 10MB + 1 byte — fileUploadSchema rejects on fileSize
      const largeBuffer = new ArrayBuffer(MAX_FILE_SIZE + 1);
      const largeFile = new File([largeBuffer], 'report.pdf', { type: 'application/pdf' });

      const res = await POST(makeFileRequest(largeFile));

      expect(res.status).toBe(400);
      expect(createAndEmbedEntry).not.toHaveBeenCalled();
    });
  });

  describe('file upload — unsupported MIME type → 400', () => {
    it('returns 400 for a file with an unsupported extension', async () => {
      // .exe — resolveMimeType returns null → mimeType = '' → schema fails
      const exeFile = new File(['MZ'], 'malware.exe', { type: 'application/octet-stream' });

      const res = await POST(makeFileRequest(exeFile));

      expect(res.status).toBe(400);
      expect(createAndEmbedEntry).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated → 401', () => {
    it('returns 401 when verifySession throws a NEXT_REDIRECT error', async () => {
      vi.mocked(verifySession).mockRejectedValueOnce(
        Object.assign(new Error('Redirecting'), { digest: 'NEXT_REDIRECT;replace;/login' })
      );

      const res = await POST(makeJsonRequest({ content: 'Hello' }));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('rate limited → 429', () => {
    it('returns 429 when the rate limiter rejects the request', async () => {
      vi.mocked(handleRateLimit).mockResolvedValueOnce({
        success: false,
        response: new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
      });

      const res = await POST(makeJsonRequest({ content: 'Hello' }));

      expect(res.status).toBe(429);
    });
  });
});
