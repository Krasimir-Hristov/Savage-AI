import type { Character } from '@/types/character';

import { angryGrandpa } from './angry-grandpa';
import { balkanDad } from './balkan-dad';
import { corporateShark } from './corporate-shark';

export const CHARACTERS: Record<string, Character> = {
  [angryGrandpa.id]: angryGrandpa,
  [balkanDad.id]: balkanDad,
  [corporateShark.id]: corporateShark,
};

export const DEFAULT_CHARACTER_ID = angryGrandpa.id;

export function getCharacter(id: string): Character {
  const character = CHARACTERS[id];
  if (!character) {
    throw new Error(
      `Character not found: "${id}". Available: ${Object.keys(CHARACTERS).join(', ')}`
    );
  }
  return character;
}

export function getAllCharacters(): Character[] {
  return Object.values(CHARACTERS);
}
