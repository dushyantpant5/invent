import emailjs from 'emailjs-com';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { PasswordFactory } from '@/services/auth/password-factory/password.factory';

export async function generateOtpUpdateTable(email: string, router: AppRouterInstance) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const serviceID = 'service_tcfnna5';
  const templateID = 'template_vw7lzpr';
  const userID = 'KJEBx3PbN3FjIVI50';
  await emailjs.send(
    serviceID,
    templateID,
    {
      email: email,
      passcode: otp,
    },
    userID
  );
  const otpHash = await PasswordFactory.generateHashPassword(otp.toString());
  const createdAt = new Date();
  const expiresAtISO = new Date(createdAt.getTime() + 10 * 60000);
  const expiresAt = expiresAtISO.toISOString();
  let used = false;
  const otpResponse = await fetch('../api/auth/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ otpHash, email, expiresAt, createdAt, used }),
  });
  const userData = await otpResponse.json();
  const sendData = {
    emails: userData.data.email,
    id: userData.data.id,
  };

  const encoded = encodeURIComponent(JSON.stringify(sendData));
  if (!router || typeof router.push !== 'function') {
    throw new Error('Router is not initialized correctly');
  }
  router.push(`/auth/otp?data=${encoded}`);
}
