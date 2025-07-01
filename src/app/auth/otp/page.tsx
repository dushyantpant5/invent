import { Suspense } from 'react';

import InputOTPForm from '@/components/otp-form'; // adjust path as needed

export default function OTPPage() {
  return (
    <Suspense fallback={<div></div>}>
      <InputOTPForm />
    </Suspense>
  );
}
