// ---------------------------------------------------------------------------
// Shared error hierarchy for typed HTTP error responses
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

// ---------------------------------------------------------------------------
// Convert an unknown caught error into a JSON Response with the right status
// ---------------------------------------------------------------------------
export const toHttpResponse = (error: unknown): Response => {
  if (error instanceof AppError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
