import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  handleSignInUser: vi.fn(),
  setTokensAtTheTimeOfSignUp: vi.fn(),
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: {
    handleSignInUser: mocks.handleSignInUser,
  },
}));

vi.mock('@/lib/cookies', () => ({
  setTokensAtTheTimeOfSignUp: mocks.setTokensAtTheTimeOfSignUp,
}));

import { POST } from '@/app/api/auth/signIn/route';

describe('POST /api/auth/signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when payload is invalid', async () => {
    const request = new Request('http://localhost/api/auth/signIn', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad', password: 'x' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 200 and sets tokens when signin succeeds', async () => {
    mocks.handleSignInUser.mockResolvedValueOnce({
      message: 'Signed in successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const request = new Request('http://localhost/api/auth/signIn', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'Passw0rd!' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Vitest',
        'x-forwarded-for': '1.1.1.1',
      },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: 'Signed in successfully' });
    expect(mocks.handleSignInUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Passw0rd!',
      userAgent: 'Vitest',
      ipAddress: '1.1.1.1',
    });
    expect(mocks.setTokensAtTheTimeOfSignUp).toHaveBeenCalledWith(
      'access-token',
      'refresh-token',
      expect.any(Response)
    );
  });
});
