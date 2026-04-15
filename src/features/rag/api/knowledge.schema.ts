import { z } from 'zod';

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
