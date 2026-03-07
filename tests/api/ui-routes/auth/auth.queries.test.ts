import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: mocks.useMutation,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/uiRoutes/api/auth/auth.api', () => ({
  requestSignUp: vi.fn(),
  requestLogIn: vi.fn(),
  verifyOtp: vi.fn(),
}));

import { useRequestLogIn, useRequestSignUp, useVerifyOtp } from '@/uiRoutes/api/auth/auth.queries';
import { requestLogIn, requestSignUp, verifyOtp } from '@/uiRoutes/api/auth/auth.api';

describe('uiRoutes auth queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockImplementation((config) => config);
  });

  it('builds signup mutation config', async () => {
    const config = useRequestSignUp();

    await config.mutationFn({ email: 'user@example.com', password: 'Passw0rd!' });
    expect(requestSignUp).toHaveBeenCalledWith('user@example.com', 'Passw0rd!');

    config.onSuccess();
    expect(mocks.push).toHaveBeenCalledWith('/auth/otp');
  });

  it('builds login mutation config', async () => {
    const config = useRequestLogIn();

    await config.mutationFn({ email: 'user@example.com', password: 'Passw0rd!' });
    expect(requestLogIn).toHaveBeenCalledWith('user@example.com', 'Passw0rd!');

    config.onSuccess();
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('builds verify otp mutation config', async () => {
    const config = useVerifyOtp();

    await config.mutationFn({ otp: '123456' });
    expect(verifyOtp).toHaveBeenCalledWith('123456');

    config.onSuccess();
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
  });
});
