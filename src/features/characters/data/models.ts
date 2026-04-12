export const MODELS = {
  GEMINI_FLASH_LITE: 'google/gemini-3.1-flash-lite-preview',
  QWEN_FREE: 'qwen/qwen3.6-plus:free',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Default model used when a character has no modelPreference
export const DEFAULT_CHAT_MODEL: ModelId = MODELS.GEMINI_FLASH_LITE;
