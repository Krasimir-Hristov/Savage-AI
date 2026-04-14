import { z } from 'zod';

export const sessionRequestSchema = z.object({
  characterId: z.string().min(1),
  conversationId: z.string().uuid(),
});

export const transcriptRequestSchema = z.object({
  conversationId: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1)
    .max(100),
});

export type SessionRequest = z.infer<typeof sessionRequestSchema>;
export type TranscriptRequest = z.infer<typeof transcriptRequestSchema>;
