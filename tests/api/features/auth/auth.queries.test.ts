import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useNavigatingMutation: vi.fn(),
}));

vi.mock('@/lib/hooks/use-navigating-mutation', () => ({
  useNavigatingMutation: mocks.useNavigatingMutation,
}));

vi.mock('@/features/auth/auth.api', () => ({
  requestSignUp: vi.fn(),
  requestLogIn: vi.fn(),
  verifyOtp: vi.fn(),
}));

import { useRequestLogIn, useRequestSignUp, useVerifyOtp } from '@/features/auth/auth.queries';
import { requestLogIn, requestSignUp, verifyOtp } from '@/features/auth/auth.api';

describe('features auth queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useNavigatingMutation.mockReturnValue({ mutate: vi.fn() });
  });

  it('configures request signup mutation', async () => {
    useRequestSignUp();

    const config = mocks.useNavigatingMutation.mock.calls[0][0];
    expect(config.redirectTo).toBe('/auth/otp');
    expect(config.successMessage).toBe('OTP sent to your email');
    await config.mutationFn({ email: 'user@example.com', password: 'Passw0rd!' });
    expect(requestSignUp).toHaveBeenCalledWith('user@example.com', 'Passw0rd!');
  });

  it('configures request login mutation', async () => {
    useRequestLogIn();

    const config = mocks.useNavigatingMutation.mock.calls[0][0];
    expect(config.redirectTo).toBe('/dashboard');
    await config.mutationFn({ email: 'user@example.com', password: 'Passw0rd!' });
    expect(requestLogIn).toHaveBeenCalledWith('user@example.com', 'Passw0rd!');
  });

  it('configures verify otp mutation', async () => {
    useVerifyOtp();

    const config = mocks.useNavigatingMutation.mock.calls[0][0];
    expect(config.redirectTo).toBe('/dashboard');
    await config.mutationFn({ otp: '123456' });
    expect(verifyOtp).toHaveBeenCalledWith('123456');
  });
});
