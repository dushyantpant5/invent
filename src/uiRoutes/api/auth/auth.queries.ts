'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { requestSignUp, verifyOtp, requestLogIn } from './auth.api';

export const useRequestSignUp = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      requestSignUp(email, password),
    onSuccess: () => {
      router.push('/auth/otp');
    },
    onError: (error: Error) => {
      console.error('Sign up failed:', error.message);
    },
  });
};

export const useRequestLogIn = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      requestLogIn(email, password),
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      console.error('Login Failed', error.message);
    },
  });
};

export const useVerifyOtp = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ otp }: { otp: string }) => verifyOtp(otp),
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      console.error('OTP verification failed:', error.message);
    },
  });
};
