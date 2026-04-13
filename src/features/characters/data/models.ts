export const MODELS = {
  GEMINI_3_FLASH_LITE: 'google/gemini-3.1-flash-lite-preview',
  GEMINI_2_FLASH_LITE: 'google/gemini-2.5-flash-lite',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Default model used when a character has no modelPreference
export const DEFAULT_CHAT_MODEL: ModelId = MODELS.GEMINI_2_FLASH_LITE;
