import { describe, it, expect } from 'vitest';
import {
  fileUploadSchema,
  createKnowledgeSchema,
  updateKnowledgeSchema,
  toggleChunkSchema,
} from '@/features/rag/api/knowledge.schema';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// fileUploadSchema
// ---------------------------------------------------------------------------

describe('fileUploadSchema', () => {
  describe('valid inputs', () => {
    it('accepts a valid PDF upload', () => {
      const result = fileUploadSchema.safeParse({
        fileName: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a valid upload with optional title', () => {
      const result = fileUploadSchema.safeParse({
        title: 'My Document',
        fileName: 'notes.txt',
        fileSize: 500,
        mimeType: 'text/plain',
      });
      expect(result.success).toBe(true);
    });

    it('accepts a file at exactly max size (10 MB)', () => {
      const result = fileUploadSchema.safeParse({
        fileName: 'big.pdf',
        fileSize: MAX_FILE_SIZE,
        mimeType: 'application/pdf',
      });
      expect(result.success).toBe(true);
    });

    it('accepts all supported text mime types', () => {
      const supported = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'text/javascript',
        'text/typescript',
        'text/x-python',
        'application/json',
        'text/html',
        'text/css',
      ];
      for (const mimeType of supported) {
        const result = fileUploadSchema.safeParse({
          fileName: 'file.txt',
          fileSize: 100,
          mimeType,
        });
        expect(result.success, `Expected ${mimeType} to be accepted`).toBe(true);
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects a file exceeding 10 MB', () => {
      const result = fileUploadSchema.safeParse({
        fileName: 'huge.pdf',
        fileSize: MAX_FILE_SIZE + 1,
        mimeType: 'application/pdf',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.fileSize).toBeDefined();
    });

    it('rejects zero byte file (not positive)', () => {
      const result = fileUploadSchema.safeParse({
        fileName: 'empty.pdf',
        fileSize: 0,
        mimeType: 'application/pdf',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.fileSize).toBeDefined();
    });

    it('rejects unsupported mime type', () => {
      const result = fileUploadSchema.safeParse({
        fileName: 'photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.mimeType).toBeDefined();
    });

    it('rejects empty fileName', () => {
      const result = fileUploadSchema.safeParse({
        fileName: '',
        fileSize: 1024,
        mimeType: 'text/plain',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.fileName).toBeDefined();
    });

    it('rejects title exceeding 200 characters', () => {
      const result = fileUploadSchema.safeParse({
        title: 'a'.repeat(201),
        fileName: 'file.txt',
        fileSize: 100,
        mimeType: 'text/plain',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.title).toBeDefined();
    });

    it('rejects missing fileName', () => {
      const result = fileUploadSchema.safeParse({
        fileSize: 1024,
        mimeType: 'text/plain',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.fileName).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// createKnowledgeSchema
// ---------------------------------------------------------------------------

describe('createKnowledgeSchema', () => {
  describe('valid inputs', () => {
    it('accepts content without title', () => {
      const result = createKnowledgeSchema.safeParse({
        content: 'Some knowledge content.',
      });
      expect(result.success).toBe(true);
    });

    it('accepts content with optional title', () => {
      const result = createKnowledgeSchema.safeParse({
        title: 'My KB entry',
        content: 'Some knowledge content.',
      });
      expect(result.success).toBe(true);
    });

    it('accepts content at exactly 500000 characters (max)', () => {
      const result = createKnowledgeSchema.safeParse({
        content: 'a'.repeat(500_000),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty content', () => {
      const result = createKnowledgeSchema.safeParse({ content: '' });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.content).toBeDefined();
    });

    it('rejects content exceeding 500000 characters', () => {
      const result = createKnowledgeSchema.safeParse({
        content: 'a'.repeat(500_001),
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.content).toBeDefined();
    });

    it('rejects title exceeding 200 characters', () => {
      const result = createKnowledgeSchema.safeParse({
        title: 'a'.repeat(201),
        content: 'Valid content.',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.title).toBeDefined();
    });

    it('rejects missing content', () => {
      const result = createKnowledgeSchema.safeParse({ title: 'Only title' });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.content).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// updateKnowledgeSchema
// ---------------------------------------------------------------------------

describe('updateKnowledgeSchema', () => {
  describe('valid inputs', () => {
    it('accepts an empty object (both fields optional for partial update)', () => {
      const result = updateKnowledgeSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts only title update', () => {
      const result = updateKnowledgeSchema.safeParse({ title: 'New title' });
      expect(result.success).toBe(true);
    });

    it('accepts only content update', () => {
      const result = updateKnowledgeSchema.safeParse({ content: 'Updated content.' });
      expect(result.success).toBe(true);
    });

    it('accepts both title and content', () => {
      const result = updateKnowledgeSchema.safeParse({
        title: 'New title',
        content: 'Updated content.',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty string content (min 1 when provided)', () => {
      const result = updateKnowledgeSchema.safeParse({ content: '' });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.content).toBeDefined();
    });

    it('rejects content exceeding 500000 characters', () => {
      const result = updateKnowledgeSchema.safeParse({
        content: 'a'.repeat(500_001),
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.content).toBeDefined();
    });

    it('rejects title exceeding 200 characters', () => {
      const result = updateKnowledgeSchema.safeParse({
        title: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.title).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// toggleChunkSchema
// ---------------------------------------------------------------------------

describe('toggleChunkSchema', () => {
  describe('valid inputs', () => {
    it('accepts is_active: true', () => {
      const result = toggleChunkSchema.safeParse({ is_active: true });
      expect(result.success).toBe(true);
    });

    it('accepts is_active: false', () => {
      const result = toggleChunkSchema.safeParse({ is_active: false });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects a string value', () => {
      const result = toggleChunkSchema.safeParse({ is_active: 'true' });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.is_active).toBeDefined();
    });

    it('rejects a number value', () => {
      const result = toggleChunkSchema.safeParse({ is_active: 1 });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.is_active).toBeDefined();
    });

    it('rejects missing is_active', () => {
      const result = toggleChunkSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.is_active).toBeDefined();
    });
  });
});
