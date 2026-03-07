'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import ToastService from '@/services/toast/toast.service';
import { extractApiErrorMessage } from '@/lib/http/api-error';

type UseNavigatingMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  redirectTo?: string;
  successMessage?: string;
  errorMessage?: string | ((error: Error) => string);
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
};

export function useNavigatingMutation<TData = void, TVariables = void>({
  mutationFn,
  redirectTo,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: UseNavigatingMutationOptions<TData, TVariables>) {
  const router = useRouter();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data) => {
      if (successMessage) ToastService.success(successMessage);
      onSuccess?.(data);
      if (redirectTo) router.push(redirectTo);
    },
    onError: (error) => {
      const msg =
        errorMessage != null
          ? typeof errorMessage === 'function'
            ? errorMessage(error)
            : errorMessage
          : extractApiErrorMessage(error);
      ToastService.error(msg);
      console.error(error);
      onError?.(error);
    },
  });
}
