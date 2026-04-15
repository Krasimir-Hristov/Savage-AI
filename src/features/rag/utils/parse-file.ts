import 'server-only';

import { getParser } from './supported-types';

/**
 * Parse a file buffer to plain text based on MIME type.
 * Returns the extracted text content.
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const parser = getParser(mimeType);

  switch (parser) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'csv':
      return parseCsv(buffer);
    case 'text':
    case 'code':
      return parseText(buffer, fileName);
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // unpdf bundles a serverless-safe pdfjs build with all Node.js polyfills included.
  // Replaces pdf-parse which triggers DOMMatrix/canvas errors in Node.js v18+.
  const { extractText } = await import('unpdf');
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return text.trim();
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function parseCsv(buffer: Buffer): Promise<string> {
  const { parse } = await import('csv-parse/sync');
  const records = parse(buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  // Format rows as readable text: "Column: Value | Column: Value"
  return records
    .map((row) =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
    )
    .join('\n');
}

function parseText(buffer: Buffer, fileName: string): string {
  const text = buffer.toString('utf-8').trim();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  // For code files, wrap with language hint for better embedding context
  const codeExtensions = [
    'js',
    'mjs',
    'cjs',
    'ts',
    'mts',
    'cts',
    'py',
    'java',
    'go',
    'rs',
    'c',
    'h',
    'cpp',
    'hpp',
    'cc',
    'json',
    'xml',
    'yaml',
    'yml',
    'html',
    'htm',
    'css',
    'sql',
    'sh',
    'bash',
  ];

  if (codeExtensions.includes(ext)) {
    return `[Source code: ${fileName}]\n${text}`;
  }

  return text;
}
