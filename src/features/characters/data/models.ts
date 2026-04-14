export const MODELS = {
  GEMINI_3_FLASH_LITE: 'google/gemini-3.1-flash-lite-preview',
  GEMINI_2_FLASH_LITE: 'google/gemini-2.5-flash-lite',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Default model used when a character has no modelPreference
export const DEFAULT_CHAT_MODEL: ModelId = MODELS.GEMINI_2_FLASH_LITE;

export const IMAGE_MODELS = {
  FLUX_2_PRO: 'black-forest-labs/flux.2-pro',
} as const;

export type ImageModelId = (typeof IMAGE_MODELS)[keyof typeof IMAGE_MODELS];

export const DEFAULT_IMAGE_MODEL: ImageModelId = IMAGE_MODELS.FLUX_2_PRO;
