import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  handleRequestSignUp: vi.fn(),
  setSignUpData: vi.fn(),
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: {
    handleRequestSignUp: mocks.handleRequestSignUp,
  },
}));

vi.mock('@/lib/cookies', () => ({
  setSignUpData: mocks.setSignUpData,
}));

import { POST } from '@/app/api/auth/signUp/request-signup/route';

describe('POST /api/auth/signUp/request-signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setSignUpData.mockResolvedValue(undefined);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/auth/signUp/request-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad', password: 'x' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 201 and stores signup payload', async () => {
    mocks.handleRequestSignUp.mockResolvedValueOnce({
      message: 'OTP sent to email',
      otp: '123456',
    });

    const request = new Request('http://localhost/api/auth/signUp/request-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'Passw0rd!' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ message: 'OTP sent to email', otp: '123456' });
    expect(mocks.setSignUpData).toHaveBeenCalledWith(
      { email: 'user@example.com', password: 'Passw0rd!' },
      expect.any(Response)
    );
  });
});
