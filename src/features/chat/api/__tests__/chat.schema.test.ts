import { describe, it, expect } from 'vitest';
import { chatRequestSchema } from '@/features/chat/api/chat.schema';

const VALID_CONVERSATION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const validMessage = { role: 'user' as const, content: 'Hello!' };
const assistantMessage = { role: 'assistant' as const, content: 'What do you want?' };

// ---------------------------------------------------------------------------
// chatRequestSchema
// ---------------------------------------------------------------------------

describe('chatRequestSchema', () => {
  describe('valid inputs', () => {
    it('accepts a minimal valid request (1 message)', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(true);
    });

    it('accepts a request with 50 messages (max allowed)', () => {
      const result = chatRequestSchema.safeParse({
        messages: Array(50).fill(validMessage),
        characterId: 'balkan-dad',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(true);
    });

    it('accepts alternating user/assistant messages', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage, assistantMessage, validMessage],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(true);
    });

    it('accepts a message with content up to 10000 chars', () => {
      const result = chatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'a'.repeat(10000) }],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs — messages', () => {
    it('rejects an empty messages array', () => {
      const result = chatRequestSchema.safeParse({
        messages: [],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.messages).toBeDefined();
    });

    it('rejects more than 50 messages', () => {
      const result = chatRequestSchema.safeParse({
        messages: Array(51).fill(validMessage),
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.messages).toBeDefined();
    });

    it('rejects a message with an invalid role', () => {
      const result = chatRequestSchema.safeParse({
        messages: [{ role: 'system', content: 'You are...' }],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
    });

    it('rejects a message with empty content', () => {
      const result = chatRequestSchema.safeParse({
        messages: [{ role: 'user', content: '' }],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
    });

    it('rejects a message with content exceeding 10000 chars', () => {
      const result = chatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'a'.repeat(10001) }],
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing messages field', () => {
      const result = chatRequestSchema.safeParse({
        characterId: 'angry-grandpa',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.messages).toBeDefined();
    });
  });

  describe('invalid inputs — characterId', () => {
    it('rejects an empty characterId', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: '',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.characterId).toBeDefined();
    });

    it('rejects a missing characterId', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.characterId).toBeDefined();
    });

    // Note: characterId is a slug (e.g. 'angry-grandpa'), not a UUID.
    // Unknown slugs are validated at the business logic layer, not by this schema.
    it('accepts any non-empty string as characterId (slug format, not UUID)', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: 'some-unknown-slug',
        conversationId: VALID_CONVERSATION_ID,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs — conversationId', () => {
    it('rejects a non-UUID conversationId', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: 'angry-grandpa',
        conversationId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.conversationId).toBeDefined();
    });

    it('rejects an empty conversationId', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: 'angry-grandpa',
        conversationId: '',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.conversationId).toBeDefined();
    });

    it('rejects a missing conversationId', () => {
      const result = chatRequestSchema.safeParse({
        messages: [validMessage],
        characterId: 'angry-grandpa',
      });
      expect(result.success).toBe(false);
      expect(result.error?.flatten().fieldErrors.conversationId).toBeDefined();
    });

    it('rejects an empty object', () => {
      const result = chatRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
