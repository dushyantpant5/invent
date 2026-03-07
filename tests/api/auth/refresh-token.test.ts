import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  handleRefresh: vi.fn(),
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: {
    handleRefresh: mocks.handleRefresh,
  },
}));

import { POST } from '@/app/api/auth/refreshToken/route';

describe('POST /api/auth/refreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/auth/refreshToken', {
      method: 'POST',
      body: JSON.stringify({ refreshTokenFromCookie: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 401 when refresh session is invalid', async () => {
    mocks.handleRefresh.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/auth/refreshToken', {
      method: 'POST',
      body: JSON.stringify({ refreshTokenFromCookie: 'refresh-token' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Vitest',
        'x-forwarded-for': '1.1.1.1',
      },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });

  it('returns 200 with fresh tokens when refresh succeeds', async () => {
    mocks.handleRefresh.mockResolvedValueOnce({
      message: 'Tokens refreshed successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const request = new Request('http://localhost/api/auth/refreshToken', {
      method: 'POST',
      body: JSON.stringify({ refreshTokenFromCookie: 'refresh-token' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Vitest',
        'x-forwarded-for': '1.1.1.1',
      },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Tokens refreshed successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
