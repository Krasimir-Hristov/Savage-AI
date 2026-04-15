import 'server-only';

import { OpenAIEmbeddings } from '@langchain/openai';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/** Dimensions produced by text-embedding-3-small */
export const EMBEDDING_DIMENSIONS = 1536;

let embeddingsInstance: OpenAIEmbeddings | null = null;

function getEmbeddingsClient(): OpenAIEmbeddings {
  if (embeddingsInstance) return embeddingsInstance;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  embeddingsInstance = new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
    openAIApiKey: apiKey,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://savage-ai.vercel.app',
        'X-Title': 'SavageAI',
      },
    },
  });

  return embeddingsInstance;
}

/** Embed a single query string (for search) */
export async function embedQuery(text: string): Promise<number[]> {
  const client = getEmbeddingsClient();
  return client.embedQuery(text);
}

/** Embed multiple texts in batch (for document ingestion) */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = getEmbeddingsClient();
  return client.embedDocuments(texts);
}

/** Expose the embeddings instance for use with LangChain components (e.g. SemanticChunker) */
export function getEmbeddings(): OpenAIEmbeddings {
  return getEmbeddingsClient();
}
