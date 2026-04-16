import type { KnowledgeEntry, DocumentChunk, KnowledgeEntryWithChunks } from '@/types/knowledge';
import { mockUserId } from './users';

// ---------------------------------------------------------------------------
// Knowledge entry fixtures
// ---------------------------------------------------------------------------

export const mockEntryId = 'k1a2b3c4-d5e6-7890-kabc-123456789012';
export const mockEntryId2 = 'k2b3c4d5-e6f7-8901-kbcd-234567890123';
export const mockChunkId1 = 'ch1a2b3c-d4e5-6789-chab-123456789012';
export const mockChunkId2 = 'ch2b3c4d-e5f6-7890-chbc-234567890123';
export const mockChunkId3 = 'ch3c4d5e-f6a7-8901-chcd-345678901234';

export const mockKnowledgeEntry: KnowledgeEntry = {
  id: mockEntryId,
  user_id: mockUserId,
  title: 'JavaScript Tips',
  content:
    'JavaScript is a versatile programming language used for web development. It supports both functional and object-oriented paradigms.',
  source_type: 'manual',
  file_name: null,
  file_size: null,
  mime_type: null,
  metadata: {},
  chunk_count: 2,
  created_at: '2026-01-10T08:00:00.000Z',
  updated_at: '2026-01-10T08:05:00.000Z',
};

export const mockKnowledgeEntryFile: KnowledgeEntry = {
  id: mockEntryId2,
  user_id: mockUserId,
  title: 'Project Documentation',
  content: 'This is the extracted text from the uploaded PDF file.',
  source_type: 'file',
  file_name: 'documentation.pdf',
  file_size: 204800,
  mime_type: 'application/pdf',
  metadata: { pages: 5 },
  chunk_count: 1,
  created_at: '2026-01-11T09:00:00.000Z',
  updated_at: '2026-01-11T09:10:00.000Z',
};

export const mockKnowledgeEntries: KnowledgeEntry[] = [mockKnowledgeEntry, mockKnowledgeEntryFile];

export const mockChunk1: DocumentChunk = {
  id: mockChunkId1,
  user_id: mockUserId,
  knowledge_entry_id: mockEntryId,
  content: 'JavaScript is a versatile programming language used for web development.',
  chunk_index: 0,
  is_active: true,
  metadata: {},
  created_at: '2026-01-10T08:00:01.000Z',
};

export const mockChunk2: DocumentChunk = {
  id: mockChunkId2,
  user_id: mockUserId,
  knowledge_entry_id: mockEntryId,
  content: 'It supports both functional and object-oriented paradigms.',
  chunk_index: 1,
  is_active: true,
  metadata: {},
  created_at: '2026-01-10T08:00:02.000Z',
};

export const mockChunk3: DocumentChunk = {
  id: mockChunkId3,
  user_id: mockUserId,
  knowledge_entry_id: mockEntryId2,
  content: 'This is the extracted text from the uploaded PDF file.',
  chunk_index: 0,
  is_active: false,
  metadata: {},
  created_at: '2026-01-11T09:00:01.000Z',
};

export const mockKnowledgeEntryWithChunks: KnowledgeEntryWithChunks = {
  ...mockKnowledgeEntry,
  chunks: [mockChunk1, mockChunk2],
};

export const createMockKnowledgeEntry = (
  overrides: Partial<KnowledgeEntry> = {}
): KnowledgeEntry => ({
  ...mockKnowledgeEntry,
  id: crypto.randomUUID(),
  ...overrides,
});

export const createMockChunk = (overrides: Partial<DocumentChunk> = {}): DocumentChunk => ({
  ...mockChunk1,
  id: crypto.randomUUID(),
  ...overrides,
});

/** Creates a 1536-dimensional mock embedding vector */
export const createMockEmbedding = (value = 0.1): number[] =>
  Array.from({ length: 1536 }, (_, i) => value + i * 0.0001);
