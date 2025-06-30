import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { generateOtpUpdateTable } from '@/utils/generateOtpAndUpdateTable';
interface OtpTimerProps {
  emails: string;
}
export default function OtpTimer({ emails }: OtpTimerProps) {
  console.log('props on top', emails);
  const [timeLeft, setTimeLeft] = useState(600); // 600 seconds = 10 minutes
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  // Countdown logic
  useEffect(() => {
    if (timeLeft <= 0) {
      setShowResend(true); // show button
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResendOtp = async () => {
    // 👇 Call your backend API to regenerate OTP
    // await fetch('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });
    await generateOtpUpdateTable(emails, router);
    setTimeLeft(600); // reset to 10 minutes
    setShowResend(false); // hide button
  };

  return (
    <div className="mx-80">
      {showResend ? (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 -mx-60"
          onClick={handleResendOtp}
        >
          Generate New OTP
        </button>
      ) : (
        <p className="text-lg font-medium -mx-60 ">OTP Expires in: {formatTime(timeLeft)}</p>
      )}
    </div>
  );
}
