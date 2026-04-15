import 'server-only';

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { embedTexts } from '@/lib/embeddings/client';

/** Minimum text length to attempt semantic chunking */
const MIN_TEXT_LENGTH = 200;

/** Hard fallback limits for very large documents */
const MAX_CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

export interface ChunkWithEmbedding {
  content: string;
  embedding: number[];
  chunkIndex: number;
}

/**
 * Split text into semantically meaningful chunks and embed them.
 *
 * Strategy:
 * - Short texts (< 200 chars): single chunk
 * - Longer texts: RecursiveCharacterTextSplitter to split at natural boundaries
 *   (paragraphs, sentences, words) then embed all chunks in batch
 *
 * Returns chunks with their pre-computed embeddings to avoid double embedding calls.
 */
export async function chunkAndEmbed(text: string): Promise<ChunkWithEmbedding[]> {
  if (!text.trim()) {
    throw new Error('Cannot chunk empty text');
  }

  // Short texts → single chunk
  if (text.length < MIN_TEXT_LENGTH) {
    const embeddings = await embedTexts([text]);
    return [{ content: text, embedding: embeddings[0], chunkIndex: 0 }];
  }

  // Split at natural boundaries: paragraphs → sentences → words
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: MAX_CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
  });

  const chunks = await splitter.splitText(text);

  // Filter out empty/whitespace-only chunks
  const validChunks = chunks.filter((c) => c.trim().length > 0);

  if (validChunks.length === 0) {
    throw new Error('Text produced no valid chunks after splitting');
  }

  // Embed all chunks in a single batch call
  const embeddings = await embedTexts(validChunks);

  return validChunks.map((content, i) => ({
    content,
    embedding: embeddings[i],
    chunkIndex: i,
  }));
}
