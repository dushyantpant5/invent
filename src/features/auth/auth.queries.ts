'use client';

import { requestSignUp, requestLogIn, verifyOtp } from './auth.api';

import { useNavigatingMutation } from '@/lib/hooks/use-navigating-mutation';

export const useRequestSignUp = () =>
  useNavigatingMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      requestSignUp(email, password),
    redirectTo: '/auth/otp',
    successMessage: 'OTP sent to your email',
  });

export const useRequestLogIn = () =>
  useNavigatingMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      requestLogIn(email, password),
    redirectTo: '/dashboard',
    successMessage: 'Logged in successfully',
    errorMessage: 'Please check your credentials',
  });

export const useVerifyOtp = () =>
  useNavigatingMutation({
    mutationFn: ({ otp }: { otp: string }) => verifyOtp(otp),
    redirectTo: '/dashboard',
    successMessage: 'Account created successfully',
    errorMessage: 'Incorrect OTP. Please try again',
  });
