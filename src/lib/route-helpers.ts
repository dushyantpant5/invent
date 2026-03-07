import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ServiceError } from '@/services/lib';
import { DatabaseError } from '@/repositories/lib';

// --- HOF wrapper — eliminates try/catch from every route ---

export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      return buildErrorResponse(error);
    }
  };
}

// --- Request helpers ---

export function extractRequestMeta(request: NextRequest): {
  userAgent: string;
  ipAddress: string;
} {
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return { userAgent, ipAddress };
}

export async function parseJsonBody<T = Record<string, unknown>>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

// --- Response helpers ---

export function validationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: 'Validation failed', details: error.format() },
    { status: 400 }
  );
}

export function buildErrorResponse(error: unknown): NextResponse {
  if (error instanceof ServiceError || error instanceof DatabaseError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json({ error: message }, { status: 500 });
}
