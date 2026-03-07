import { AxiosError } from 'axios';
import { z } from 'zod';

import { ApiError, extractApiErrorMessage, formatZodError } from '@/lib/http/api-error';

describe('api-error', () => {
  it('builds ApiError with status code', () => {
    const err = new ApiError('boom', 409);

    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(409);
  });

  it('extracts message from AxiosError response payload', () => {
    const axiosError = new AxiosError('request failed', undefined, undefined, undefined, {
      data: { error: 'custom api error' },
    } as never);

    expect(extractApiErrorMessage(axiosError)).toBe('custom api error');
  });

  it('extracts message from standard Error', () => {
    expect(extractApiErrorMessage(new Error('plain error'))).toBe('plain error');
  });

  it('returns fallback message for unknown error shape', () => {
    expect(extractApiErrorMessage({ nope: true })).toBe('An unexpected error occurred');
  });

  it('formats zod issues into a sentence', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password too short'),
    });
    const parsed = schema.safeParse({ email: 'x', password: '123' });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodError(parsed.error)).toContain('Invalid email');
      expect(formatZodError(parsed.error)).toContain('Password too short');
    }
  });
});
