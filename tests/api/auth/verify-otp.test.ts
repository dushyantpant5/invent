import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  handleVerifyOtp: vi.fn(),
  handleCompleteSignUp: vi.fn(),
  setTokensAtTheTimeOfSignUp: vi.fn(),
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: {
    handleVerifyOtp: mocks.handleVerifyOtp,
    handleCompleteSignUp: mocks.handleCompleteSignUp,
  },
}));

vi.mock('@/lib/cookies', () => ({
  setTokensAtTheTimeOfSignUp: mocks.setTokensAtTheTimeOfSignUp,
}));

import { POST } from '@/app/api/auth/signUp/verify-otp/route';

describe('POST /api/auth/signUp/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid otp payload', async () => {
    const request = new Request('http://localhost/api/auth/signUp/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp: '123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 201 and sets tokens after otp verification', async () => {
    mocks.handleVerifyOtp.mockResolvedValueOnce(undefined);
    mocks.handleCompleteSignUp.mockResolvedValueOnce({
      message: 'Account created successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const request = new Request('http://localhost/api/auth/signUp/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp: '123456' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Vitest',
        'x-forwarded-for': '1.1.1.1',
      },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ message: 'Account created successfully' });
    expect(mocks.handleVerifyOtp).toHaveBeenCalledWith({ otp: '123456' });
    expect(mocks.handleCompleteSignUp).toHaveBeenCalledWith({
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
