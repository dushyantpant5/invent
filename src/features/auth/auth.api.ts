import { createApiClient } from '@/lib/http/api-client';
import { sendOtpEmail } from '@/lib/email/emailjs';
import { ApiError, formatZodError } from '@/lib/http/api-error';
import { signUpSchema, signInSchema } from '@/validators';

const authClient = createApiClient('/auth');

export const requestSignUp = async (email: string, password: string): Promise<void> => {
  const validation = signUpSchema.safeParse({ email, password });
  if (!validation.success) throw new ApiError(formatZodError(validation.error));

  const response = await authClient.post<{ message: string; otp?: string }>(
    '/signUp/request-signup',
    { email, password }
  );

  if (!response.otp) throw new ApiError('Failed to initiate sign up');

  await sendOtpEmail({ toEmail: email, otp: response.otp });
};

export const requestLogIn = async (email: string, password: string): Promise<void> => {
  const validation = signInSchema.safeParse({ email, password });
  if (!validation.success) throw new ApiError(formatZodError(validation.error));

  await authClient.post('/signIn', { email, password });
};

export const verifyOtp = async (otp: string): Promise<void> => {
  await authClient.post('/signUp/verify-otp', { otp });
};
