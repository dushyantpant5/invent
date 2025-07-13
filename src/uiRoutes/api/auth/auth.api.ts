import { createApiClient } from '@/uiRoutes/lib/createApiClient';
import { sendOtpEmail } from '@/helpers/emailjs';

const authClient = createApiClient('/auth');

// This fucntion will be chagned later as we will use the EmailService and EmailServiceClass
export const requestSignUp = async (email: string, password: string): Promise<void> => {
  const data = { email, password };

  const response: { message: string; otp?: string; error?: string } = await authClient.post(
    '/signUp/request-signup',
    data
  );

  const { otp, error } = response;

  if (otp) {
    console.log('OTP created:', otp);
    await sendOtpEmail({
      toEmail: email,
      otp,
    });
  } else {
    throw new Error(error || 'Failed to request sign up');
  }
};

export const verifyOtp = async (otp: string): Promise<void> => {
  const data = { otp };
  await authClient.post('/signUp/verify-otp', data);
};
