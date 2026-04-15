import { verifySession } from '@/lib/dal';
import {
  getClientIP,
  handleRateLimit,
  knowledgeRateLimit,
  knowledgeUploadRateLimit,
} from '@/lib/ratelimit';
import { createKnowledgeSchema } from '@/features/rag/api/knowledge.schema';
import { getKnowledgeEntries } from '@/features/rag/dal';
import { createAndEmbedEntry } from '@/features/rag/services/embed-entry';
import { parseFile } from '@/features/rag/utils/parse-file';
import { MAX_FILE_SIZE, resolveMimeType } from '@/features/rag/utils/supported-types';

// ---------------------------------------------------------------------------
// GET /api/knowledge — list user's knowledge entries
// ---------------------------------------------------------------------------
export async function GET(req: Request): Promise<Response> {
  const ip = getClientIP(req);
  const rateLimitResult = await handleRateLimit(knowledgeRateLimit, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  let userId: string;
  try {
    const session = await verifySession();
    userId = session.userId;
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }

  try {
    const entries = await getKnowledgeEntries(userId);
    return new Response(JSON.stringify(entries), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...rateLimitResult.headers },
    });
  } catch (error) {
    console.error('[knowledge/GET]', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch entries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/knowledge — create entry (manual text or file upload)
// ---------------------------------------------------------------------------
export async function POST(req: Request): Promise<Response> {
  const ip = getClientIP(req);

  // Determine content type to choose rate limiter
  const contentType = req.headers.get('content-type') ?? '';
  const isFileUpload = contentType.includes('multipart/form-data');
  const limiter = isFileUpload ? knowledgeUploadRateLimit : knowledgeRateLimit;

  const rateLimitResult = await handleRateLimit(limiter, ip);
  if (!rateLimitResult.success) return rateLimitResult.response;

  let userId: string;
  try {
    const session = await verifySession();
    userId = session.userId;
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }

  try {
    if (isFileUpload) {
      return await handleFileUpload(req, userId, rateLimitResult.headers);
    } else {
      return await handleManualEntry(req, userId, rateLimitResult.headers);
    }
  } catch (error) {
    console.error('[knowledge/POST]', error);
    return new Response(JSON.stringify({ error: 'Failed to create entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ---------------------------------------------------------------------------
// Manual text entry (JSON body)
// ---------------------------------------------------------------------------
async function handleManualEntry(
  req: Request,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = createKnowledgeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const entry = await createAndEmbedEntry({
    userId,
    title: parsed.data.title,
    content: parsed.data.content,
    sourceType: 'manual',
  });

  return new Response(JSON.stringify(entry), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ---------------------------------------------------------------------------
// File upload (multipart/form-data)
// ---------------------------------------------------------------------------
async function handleFileUpload(
  req: Request,
  userId: string,
  headers: Record<string, string>
): Promise<Response> {
  const formData = await req.formData();
  const file = formData.get('file');
  const title = formData.get('title');

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const mimeType = resolveMimeType(file.name, file.type);
  if (!mimeType) {
    return new Response(JSON.stringify({ error: `Unsupported file type: ${file.name}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse the file to text
  const buffer = Buffer.from(await file.arrayBuffer());
  const textContent = await parseFile(buffer, mimeType, file.name);

  if (!textContent.trim()) {
    return new Response(JSON.stringify({ error: 'File contains no extractable text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Guard against extremely large parsed content that would overwhelm embeddings
  const MAX_CONTENT_LENGTH = 500_000;
  if (textContent.length > MAX_CONTENT_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Parsed content too large (${Math.round(textContent.length / 1000)}K chars). Maximum is 500K characters.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const entry = await createAndEmbedEntry({
    userId,
    title: typeof title === 'string' ? title : file.name,
    content: textContent,
    sourceType: 'file',
    fileName: file.name,
    fileSize: file.size,
    mimeType,
  });

  return new Response(JSON.stringify(entry), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
