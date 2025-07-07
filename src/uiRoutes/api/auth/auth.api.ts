import { createApiClient } from '@/uiRoutes/lib/createApiClient';
import { sendOtpEmail } from '@/helpers/emailjs';

// Will be removed later as we will use the EmailService and EmailServiceClass
type SignUpResponse = {
  message: string;
  otp: string;
};

const authClient = createApiClient('/auth');

// This fucntion will be chagned later as we will use the EmailService and EmailServiceClass
export const requestSignUp = async (email: string, password: string): Promise<void> => {
  const data = { email, password };

  const response: SignUpResponse = await authClient.post('/signUp/request-signup', data);

  if (response.otp) {
    await sendOtpEmail({
      toEmail: email,
      otp: response.otp,
    });
  } else {
    throw new Error(response?.message || 'Failed to request sign up');
  }
};

export const verifyOtp = async (otp: string): Promise<void> => {
  const data = { otp };
  await authClient.post('/signUp/verify-otp', data);
};
