'use client';

import { Suspense } from 'react';

import InputOTPForm from '@/components/otp-form';
import { useVerifyOtp } from '@/features/auth/auth.queries';

export default function OTPPage() {
  const { mutate: verifyOtpMutaion } = useVerifyOtp();

  return (
    <Suspense fallback={<div></div>}>
      <InputOTPForm verifyOtpFunction={verifyOtpMutaion} />
    </Suspense>
  );
}
