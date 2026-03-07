import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  sendOtpEmail: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastShowZodError: vi.fn(),
}));

vi.mock('@/uiRoutes/lib/createApiClient', () => ({
  createApiClient: vi.fn(() => ({ post: mocks.post })),
}));

vi.mock('@/helpers/emailjs', () => ({
  sendOtpEmail: mocks.sendOtpEmail,
}));

vi.mock('@/services/toast/toast.service', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    showZodError: mocks.toastShowZodError,
  },
}));

import { requestLogIn, requestSignUp, verifyOtp } from '@/uiRoutes/api/auth/auth.api';

describe('uiRoutes auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid signup payload', async () => {
    await expect(requestSignUp('bad-email', 'short')).rejects.toThrow('Validation Error');
    expect(mocks.toastShowZodError).toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('sends otp email when signup response contains otp', async () => {
    mocks.post.mockResolvedValueOnce({ message: 'ok', otp: '123456' });
    mocks.sendOtpEmail.mockResolvedValueOnce(undefined);

    await requestSignUp('user@example.com', 'Passw0rd!');

    expect(mocks.post).toHaveBeenCalledWith('/signUp/request-signup', {
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(mocks.sendOtpEmail).toHaveBeenCalledWith({ toEmail: 'user@example.com', otp: '123456' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('OTP has been sent to your email.');
  });

  it('rejects signup when otp is missing', async () => {
    mocks.post.mockResolvedValueOnce({ message: 'ok', error: 'Failed to request sign up' });

    await expect(requestSignUp('user@example.com', 'Passw0rd!')).rejects.toThrow(
      'Failed to request sign up'
    );
    expect(mocks.toastError).toHaveBeenCalled();
  });

  it('rejects invalid login payload', async () => {
    await expect(requestLogIn('bad-email', 'x')).rejects.toThrow('Validation Error');
    expect(mocks.toastShowZodError).toHaveBeenCalled();
  });

  it('logs in successfully with valid payload', async () => {
    mocks.post.mockResolvedValueOnce({});
    await requestLogIn('user@example.com', 'Passw0rd!');

    expect(mocks.post).toHaveBeenCalledWith('/signIn', {
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Login Successfully!');
  });

  it('maps login failure to user-facing message', async () => {
    mocks.post.mockRejectedValueOnce(new Error('bad credentials'));
    await expect(requestLogIn('user@example.com', 'Passw0rd!')).rejects.toThrow(
      'Please Check your Credentials'
    );
    expect(mocks.toastError).toHaveBeenCalledWith('Please Check your Credentials');
  });

  it('verifies otp and shows success toast', async () => {
    mocks.post.mockResolvedValueOnce({});
    await verifyOtp('123456');

    expect(mocks.post).toHaveBeenCalledWith('/signUp/verify-otp', { otp: '123456' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Account Created Successfully');
  });

  it('maps otp verification failure to error', async () => {
    mocks.post.mockRejectedValueOnce(new Error('otp failed'));
    await expect(verifyOtp('123456')).rejects.toThrow('Incorrect otp');
    expect(mocks.toastError).toHaveBeenCalledWith('Incorect Otp');
  });
});
