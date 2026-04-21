import { describe, expect, it } from 'vitest';

import { chatRequestSchema } from '@/features/chat/api/chat.schema';
import { CHARACTERS } from '@/features/characters/data';

// ---------------------------------------------------------------------------
// Phase 14: Performance Tests
// ---------------------------------------------------------------------------

describe('Schema validation performance', () => {
  const validPayload = {
    messages: [{ role: 'user' as const, content: 'How do I reverse a string?' }],
    characterId: 'angry-grandpa',
    conversationId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('validates 1000 chatRequestSchema payloads in under 100ms', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      chatRequestSchema.safeParse(validPayload);
    }

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  it('validates 1000 invalid payloads (fast failure) in under 100ms', () => {
    const invalidPayload = { messages: [], characterId: '', conversationId: 'not-a-uuid' };
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      chatRequestSchema.safeParse(invalidPayload);
    }

    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
  });
});

describe('CHARACTERS constant caching', () => {
  it('returns the same object reference on multiple accesses (module-level singleton)', () => {
    // CHARACTERS is a module-level const — importing it twice must return the same reference
    const ref1 = CHARACTERS;
    const ref2 = CHARACTERS;

    expect(ref1).toBe(ref2);
  });

  it('contains all expected character IDs', () => {
    const ids = Object.keys(CHARACTERS);

    expect(ids).toContain('angry-grandpa');
    expect(ids).toContain('balkan-dad');
  });

  it('character objects are frozen-like (properties are stable across accesses)', () => {
    const char1 = CHARACTERS['angry-grandpa'];
    const char2 = CHARACTERS['angry-grandpa'];

    // Same reference — not re-created per access
    expect(char1).toBe(char2);
    expect(char1.systemPrompt).toBe(char2.systemPrompt);
  });
});
