import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(10000, 'Message too long'),
});

export const chatRequestSchema = z.object({
  // Client sends only the recent context window (last ~20 messages), not full history.
  // Max 50 enforced server-side to prevent oversized OpenRouter requests.
  messages: z
    .array(messageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Too many messages in context window'),

  // Character IDs are slugs, not UUIDs ('angry-grandpa', 'balkan-dad')
  characterId: z.string().min(1, 'Character ID is required'),

  conversationId: z.string().uuid('Invalid conversation ID'),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
