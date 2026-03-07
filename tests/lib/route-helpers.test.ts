import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildErrorResponse,
  extractRequestMeta,
  parseJsonBody,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/route-helpers';
import { ServiceError } from '@/services/lib';
import { DatabaseError } from '@/repositories/lib';

describe('route-helpers', () => {
  it('withErrorHandling returns handler response on success', async () => {
    const wrapped = withErrorHandling(async () => NextResponse.json({ ok: true }, { status: 200 }));

    const result = await wrapped({} as never);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it('withErrorHandling converts thrown errors into response', async () => {
    const wrapped = withErrorHandling(async () => {
      throw new ServiceError('forbidden', 403);
    });

    const result = await wrapped({} as never);
    const body = await result.json();

    expect(result.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden' });
  });

  it('extracts request metadata', () => {
    const request = {
      headers: new Headers({
        'user-agent': 'Vitest UA',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      }),
    };

    const meta = extractRequestMeta(request as never);
    expect(meta).toEqual({ userAgent: 'Vitest UA', ipAddress: '1.1.1.1' });
  });

  it('parses json body and falls back to empty object on parse failure', async () => {
    const okReq = { json: vi.fn().mockResolvedValue({ a: 1 }) };
    await expect(parseJsonBody(okReq as never)).resolves.toEqual({ a: 1 });

    const badReq = { json: vi.fn().mockRejectedValue(new Error('bad json')) };
    await expect(parseJsonBody(badReq as never)).resolves.toEqual({});
  });

  it('builds validation error response', async () => {
    const schema = z.object({ email: z.string().email('Invalid email') });
    const parsed = schema.safeParse({ email: 'bad' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const result = validationErrorResponse(parsed.error);
      const body = await result.json();
      expect(result.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    }
  });

  it('builds error responses for service/database and generic errors', async () => {
    const serviceResp = buildErrorResponse(new ServiceError('service fail', 422));
    expect(serviceResp.status).toBe(422);

    const dbResp = buildErrorResponse(new DatabaseError('db fail'));
    expect(dbResp.status).toBe(500);

    const genericResp = buildErrorResponse(new Error('boom'));
    expect(genericResp.status).toBe(500);
    expect(await genericResp.json()).toEqual({ error: 'boom' });
  });
});
