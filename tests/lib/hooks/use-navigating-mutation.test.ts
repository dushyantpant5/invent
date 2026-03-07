import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  extractApiErrorMessage: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: mocks.useMutation,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/services/toast/toast.service', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('@/lib/http/api-error', () => ({
  extractApiErrorMessage: mocks.extractApiErrorMessage,
}));

import { useNavigatingMutation } from '@/lib/hooks/use-navigating-mutation';

describe('useNavigatingMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockImplementation((config) => config);
    mocks.extractApiErrorMessage.mockReturnValue('api error message');
  });

  it('handles success flow with toast and redirect', () => {
    const onSuccess = vi.fn();
    const config = useNavigatingMutation({
      mutationFn: vi.fn(),
      redirectTo: '/dashboard',
      successMessage: 'Saved',
      onSuccess,
    });

    config.onSuccess({ ok: true });

    expect(mocks.toastSuccess).toHaveBeenCalledWith('Saved');
    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('handles error flow with provided message', () => {
    const onError = vi.fn();
    const config = useNavigatingMutation({
      mutationFn: vi.fn(),
      errorMessage: 'Custom error',
      onError,
    });
    const error = new Error('failed');

    config.onError(error);

    expect(mocks.toastError).toHaveBeenCalledWith('Custom error');
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('handles error flow with default API message', () => {
    const config = useNavigatingMutation({
      mutationFn: vi.fn(),
    });
    const error = new Error('failed');

    config.onError(error);

    expect(mocks.extractApiErrorMessage).toHaveBeenCalledWith(error);
    expect(mocks.toastError).toHaveBeenCalledWith('api error message');
  });

  it('supports functional error message callback', () => {
    const config = useNavigatingMutation({
      mutationFn: vi.fn(),
      errorMessage: (error) => `Oops: ${error.message}`,
    });
    const error = new Error('failed');

    config.onError(error);

    expect(mocks.toastError).toHaveBeenCalledWith('Oops: failed');
  });
});
