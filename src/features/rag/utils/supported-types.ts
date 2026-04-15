import 'server-only';

/** Supported MIME types mapped to their file extension and parser type */
export const SUPPORTED_TYPES: Record<
  string,
  { extensions: string[]; parser: 'pdf' | 'docx' | 'csv' | 'text' | 'code' }
> = {
  'application/pdf': { extensions: ['.pdf'], parser: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    parser: 'docx',
  },
  'text/csv': { extensions: ['.csv'], parser: 'csv' },
  'text/plain': { extensions: ['.txt'], parser: 'text' },
  'text/markdown': { extensions: ['.md'], parser: 'text' },

  // Code files
  'text/javascript': { extensions: ['.js', '.mjs', '.cjs'], parser: 'code' },
  'text/typescript': { extensions: ['.ts', '.mts', '.cts'], parser: 'code' },
  'text/x-python': { extensions: ['.py'], parser: 'code' },
  'text/x-java': { extensions: ['.java'], parser: 'code' },
  'text/x-go': { extensions: ['.go'], parser: 'code' },
  'text/x-rust': { extensions: ['.rs'], parser: 'code' },
  'text/x-c': { extensions: ['.c', '.h'], parser: 'code' },
  'text/x-c++': { extensions: ['.cpp', '.hpp', '.cc'], parser: 'code' },
  'application/json': { extensions: ['.json'], parser: 'code' },
  'application/xml': { extensions: ['.xml'], parser: 'code' },
  'text/yaml': { extensions: ['.yaml', '.yml'], parser: 'code' },
  'text/html': { extensions: ['.html', '.htm'], parser: 'code' },
  'text/css': { extensions: ['.css'], parser: 'code' },
  'text/x-sql': { extensions: ['.sql'], parser: 'code' },
  'text/x-sh': { extensions: ['.sh', '.bash'], parser: 'code' },
};

/** Max file size: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Map file extension to MIME type for cases where browser sends generic type */
const EXTENSION_TO_MIME: Record<string, string> = {};
for (const [mime, { extensions }] of Object.entries(SUPPORTED_TYPES)) {
  for (const ext of extensions) {
    EXTENSION_TO_MIME[ext] = mime;
  }
}

export function resolveMimeType(fileName: string, browserMime: string): string | null {
  // Try browser MIME first
  if (SUPPORTED_TYPES[browserMime]) return browserMime;

  // Fallback: derive from extension
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  return EXTENSION_TO_MIME[ext] ?? null;
}

export function isSupported(mime: string): boolean {
  return mime in SUPPORTED_TYPES;
}

export function getParser(mime: string): 'pdf' | 'docx' | 'csv' | 'text' | 'code' {
  const entry = SUPPORTED_TYPES[mime];
  if (!entry) throw new Error(`Unsupported MIME type: ${mime}`);
  return entry.parser;
}

export function getSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_TYPES).flatMap((t) => t.extensions);
}
