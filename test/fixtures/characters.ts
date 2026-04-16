import type { Character } from '@/types/character';

// ---------------------------------------------------------------------------
// Character fixtures — mirrors actual characters in src/features/characters/data/
// ---------------------------------------------------------------------------

export const mockAngryGrandpa: Character = {
  id: 'angry-grandpa',
  name: 'Angry Grandpa',
  personality: 'Old-school curmudgeon who thinks the modern world is soft',
  avatar: '/avatars/angry-grandpa.jpg',
  modelPreference: 'google/gemini-2.5-flash-lite',
  elevenLabsAgentId: 'mock-grandpa-agent-id',
  ui: {
    emoji: '👴',
    colorClass: 'text-character-grandpa',
    placeholder: 'Ask the old man something... if you dare.',
  },
  systemPrompt: 'You are Angry Grandpa. Be grumpy but helpful.',
};

export const mockBalkanDad: Character = {
  id: 'balkan-dad',
  name: 'Balkan Dad',
  personality: 'Hot-headed Balkan tough guy with zero tolerance for nonsense',
  avatar: '/avatars/balkan-dad.jpg',
  modelPreference: 'google/gemini-2.5-flash-lite',
  elevenLabsAgentId: 'mock-dad-agent-id',
  ui: {
    emoji: '👨',
    colorClass: 'text-character-dad',
    placeholder: 'Ask the Balkan guy... brace yourself.',
  },
  systemPrompt: 'You are Balkan Dad. Be direct and loud but helpful.',
};

export const mockCorporateShark: Character = {
  id: 'corporate-shark',
  name: 'Corporate Shark',
  personality: 'Ruthless business predator who measures everything in ROI',
  avatar: '/avatars/corporate-shark.jpg',
  modelPreference: 'google/gemini-2.5-flash-lite',
  elevenLabsAgentId: 'mock-shark-agent-id',
  ui: {
    emoji: '🦈',
    colorClass: 'text-character-shark',
    placeholder: 'Pitch your idea. You have 30 seconds.',
  },
  systemPrompt: 'You are Corporate Shark. Be ruthless but helpful.',
};

/** Character without elevenLabsAgentId — for TTS error tests */
export const mockCharacterNoVoice: Character = {
  id: 'no-voice-character',
  name: 'Silent Character',
  personality: 'A character with no voice configured',
  avatar: '/avatars/placeholder.jpg',
  ui: { emoji: '🤐', colorClass: 'text-gray-500' },
  systemPrompt: 'You are silent.',
};

export const mockCharacters: Character[] = [mockAngryGrandpa, mockBalkanDad, mockCorporateShark];

export const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
  ...mockAngryGrandpa,
  id: `mock-character-${Date.now()}`,
  ...overrides,
});
