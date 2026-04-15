import { z } from 'zod';

import { isSupported, MAX_FILE_SIZE } from '@/features/rag/utils/supported-types';

export const fileUploadSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z
    .number()
    .positive('File is empty')
    .max(MAX_FILE_SIZE, `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  mimeType: z.string().min(1, 'Unsupported file type').refine(isSupported, 'Unsupported file type'),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

export const createKnowledgeSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(500_000, 'Content too large (max 500K characters)'),
});

export const updateKnowledgeSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(500_000, 'Content too large (max 500K characters)')
    .optional(),
});

export const toggleChunkSchema = z.object({
  is_active: z.boolean(),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
export type ToggleChunkInput = z.infer<typeof toggleChunkSchema>;
