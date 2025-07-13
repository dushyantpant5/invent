'use client';

import { useEffect, useState } from 'react';

export default function OtpTimer() {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mx-auto mt-4 text-center">
      {timeLeft > 0 ? (
        <p className="text-lg font-medium">OTP Expires in: {formatTime(timeLeft)}</p>
      ) : (
        <p className="text-red-500 font-medium">OTP has expired. Please go back and try again.</p>
      )}
    </div>
  );
}
