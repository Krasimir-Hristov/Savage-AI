import { describe, expect, it } from 'vitest';

import {
  CHARACTERS,
  DEFAULT_CHARACTER_ID,
  getAllCharacters,
  getCharacter,
} from '@/features/characters/data';

// ---------------------------------------------------------------------------
// CHARACTERS constant
// ---------------------------------------------------------------------------

describe('CHARACTERS constant', () => {
  it('contains at least one character', () => {
    expect(Object.keys(CHARACTERS).length).toBeGreaterThan(0);
  });

  it('each character has all required fields', () => {
    for (const character of Object.values(CHARACTERS)) {
      expect(character.id).toBeTruthy();
      expect(character.name).toBeTruthy();
      expect(character.systemPrompt).toBeTruthy();
      expect(character.avatar).toBeTruthy();
      expect(character.personality).toBeTruthy();
      expect(character.ui).toBeDefined();
      expect(character.ui.emoji).toBeTruthy();
      expect(character.ui.colorClass).toBeTruthy();
    }
  });

  it('all system prompts are non-empty strings', () => {
    for (const character of Object.values(CHARACTERS)) {
      expect(typeof character.systemPrompt).toBe('string');
      expect(character.systemPrompt.trim().length).toBeGreaterThan(0);
    }
  });

  it('all character IDs are unique', () => {
    const ids = Object.values(CHARACTERS).map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all character IDs match slug format (lowercase letters, digits, hyphens)', () => {
    for (const character of Object.values(CHARACTERS)) {
      expect(character.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('CHARACTERS record keys match their character id', () => {
    for (const [key, character] of Object.entries(CHARACTERS)) {
      expect(key).toBe(character.id);
    }
  });
});

// ---------------------------------------------------------------------------
// getAllCharacters()
// ---------------------------------------------------------------------------

describe('getAllCharacters()', () => {
  it('returns an array', () => {
    const all = getAllCharacters();
    expect(Array.isArray(all)).toBe(true);
  });

  it('returns all characters from the CHARACTERS record', () => {
    const all = getAllCharacters();
    expect(all.length).toBe(Object.keys(CHARACTERS).length);
  });

  it('includes every character ID from the CHARACTERS record', () => {
    const all = getAllCharacters();
    const returnedIds = all.map((c) => c.id);
    for (const id of Object.keys(CHARACTERS)) {
      expect(returnedIds).toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// getCharacter()
// ---------------------------------------------------------------------------

describe('getCharacter()', () => {
  it('returns the correct character for each valid ID', () => {
    for (const id of Object.keys(CHARACTERS)) {
      const character = getCharacter(id);
      expect(character.id).toBe(id);
    }
  });

  it('throws for an unknown character ID', () => {
    expect(() => getCharacter('unknown-character')).toThrow();
  });

  it('includes the bad ID in the error message', () => {
    const badId = 'ghost-character';
    expect(() => getCharacter(badId)).toThrow(badId);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_CHARACTER_ID
// ---------------------------------------------------------------------------

describe('DEFAULT_CHARACTER_ID', () => {
  it('refers to an existing character in CHARACTERS', () => {
    expect(CHARACTERS[DEFAULT_CHARACTER_ID]).toBeDefined();
  });
});
