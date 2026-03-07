import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAuthCookies: vi.fn(),
  setTokensAtTheTimeOfSignUp: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock('@/lib/cookies', () => ({
  clearAuthCookies: mocks.clearAuthCookies,
  setTokensAtTheTimeOfSignUp: mocks.setTokensAtTheTimeOfSignUp,
}));

vi.mock('@/services/auth/token-factory/token.factory', () => ({
  TokenFactory: {
    verifyAccessToken: mocks.verifyAccessToken,
  },
}));

import { middleware, tryRefreshToken } from '@/middleware';

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function buildRequest(accessToken?: string, refreshToken?: string) {
    return {
      cookies: {
        get: (name: string) => {
          if (name === 'accessToken' && accessToken) return { value: accessToken };
          if (name === 'refreshToken' && refreshToken) return { value: refreshToken };
          return undefined;
        },
      },
      nextUrl: {
        pathname: '/dashboard',
        search: '',
        origin: 'http://localhost',
        host: 'localhost',
      },
    } as never;
  }

  it('redirects to signin when both tokens are missing', async () => {
    const response = await middleware(buildRequest());
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toContain('/auth/signIn');
    expect(mocks.clearAuthCookies).toHaveBeenCalled();
  });

  it('allows request when access token is valid', async () => {
    mocks.verifyAccessToken.mockResolvedValueOnce({ id: 'u1', email: 'user@example.com' });
    const response = await middleware(buildRequest('access-token', 'refresh-token'));

    expect(response?.status).toBe(200);
    expect(mocks.clearAuthCookies).not.toHaveBeenCalled();
  });

  it('redirects when access token is invalid', async () => {
    mocks.verifyAccessToken.mockResolvedValueOnce(null);
    const response = await middleware(buildRequest('bad-access-token', 'refresh-token'));

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toContain('/auth/signIn');
    expect(mocks.clearAuthCookies).toHaveBeenCalled();
  });

  it('tries refresh flow when access token is missing and refresh token exists', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    mocks.verifyAccessToken.mockResolvedValueOnce({ id: 'u1', email: 'user@example.com' });

    const response = await middleware(buildRequest(undefined, 'refresh-token'));

    expect(response?.status).toBe(200);
    expect(mocks.setTokensAtTheTimeOfSignUp).toHaveBeenCalledWith(
      'new-access-token',
      'new-refresh-token',
      expect.any(Response)
    );
  });
});

describe('tryRefreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const request = {
    nextUrl: {
      pathname: '/dashboard',
      search: '',
      origin: 'http://localhost',
      host: 'localhost',
    },
  } as never;

  it('redirects when refresh endpoint responds non-ok', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    );

    const response = await tryRefreshToken(request, 'refresh-token');
    expect(response.status).toBe(307);
    expect(mocks.clearAuthCookies).toHaveBeenCalled();
  });

  it('redirects when refresh response is missing tokens', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ accessToken: 'only-access' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const response = await tryRefreshToken(request, 'refresh-token');
    expect(response.status).toBe(307);
    expect(mocks.clearAuthCookies).toHaveBeenCalled();
  });

  it('returns next response and sets cookies on successful refresh', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const response = await tryRefreshToken(request, 'refresh-token');
    expect(response.status).toBe(200);
    expect(mocks.setTokensAtTheTimeOfSignUp).toHaveBeenCalledWith(
      'new-access-token',
      'new-refresh-token',
      expect.any(Response)
    );
  });
});
