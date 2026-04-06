import 'server-only';

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface StreamChunk {
  id?: string;
  choices: Array<{
    delta: {
      content: string | null;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}
