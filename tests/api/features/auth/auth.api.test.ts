import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  sendOtpEmail: vi.fn(),
}));

vi.mock('@/lib/http/api-client', () => ({
  createApiClient: vi.fn(() => ({ post: mocks.post })),
}));

vi.mock('@/lib/email/emailjs', () => ({
  sendOtpEmail: mocks.sendOtpEmail,
}));

import { requestLogIn, requestSignUp, verifyOtp } from '@/features/auth/auth.api';
import { ApiError } from '@/lib/http/api-error';

describe('features auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ApiError for invalid signup payload', async () => {
    await expect(requestSignUp('bad-email', 'short')).rejects.toBeInstanceOf(ApiError);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('throws ApiError when signup response has no otp', async () => {
    mocks.post.mockResolvedValueOnce({ message: 'ok' });

    await expect(requestSignUp('user@example.com', 'Passw0rd!')).rejects.toThrow(
      'Failed to initiate sign up'
    );
    expect(mocks.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('sends otp email on successful signup', async () => {
    mocks.post.mockResolvedValueOnce({ message: 'ok', otp: '123456' });
    mocks.sendOtpEmail.mockResolvedValueOnce(undefined);

    await requestSignUp('user@example.com', 'Passw0rd!');

    expect(mocks.post).toHaveBeenCalledWith('/signUp/request-signup', {
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(mocks.sendOtpEmail).toHaveBeenCalledWith({
      toEmail: 'user@example.com',
      otp: '123456',
    });
  });

  it('throws ApiError for invalid login payload', async () => {
    await expect(requestLogIn('bad-email', '123')).rejects.toBeInstanceOf(ApiError);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('calls login endpoint for valid login payload', async () => {
    mocks.post.mockResolvedValueOnce({});

    await requestLogIn('user@example.com', 'Passw0rd!');

    expect(mocks.post).toHaveBeenCalledWith('/signIn', {
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
  });

  it('calls verify otp endpoint', async () => {
    mocks.post.mockResolvedValueOnce({});

    await verifyOtp('123456');

    expect(mocks.post).toHaveBeenCalledWith('/signUp/verify-otp', { otp: '123456' });
  });
});
