import { createApiClient } from '@/uiRoutes/lib/createApiClient';
import { sendOtpEmail } from '@/helpers/emailjs';
import ToastService from '@/services/toast/toast.service';
import { signUpSchema } from '@/zod-validator';

const authClient = createApiClient('/auth');

// This fucntion will be chagned later as we will use the EmailService and EmailServiceClass
export const requestSignUp = async (email: string, password: string): Promise<void> => {
  const data = { email, password };
  const zodValidation = signUpSchema.safeParse(data);

  if (!zodValidation.success) {
    ToastService.showZodError(zodValidation.error);
    throw new Error('Validation Error: ' + JSON.stringify(zodValidation.error.format()));
  }

  try {
    const response: { message: string; otp?: string; error?: string } = await authClient.post(
      '/signUp/request-signup',
      data
    );

    const { otp, error } = response;

    if (otp) {
      console.log('OTP created:', otp);
      try {
        await sendOtpEmail({ toEmail: email, otp });
        ToastService.success('OTP has been sent to your email.');
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
        ToastService.error('Error sending OTP. Please try again later.');
        throw new Error('OTP email sending failed');
      }
    } else {
      const errorMessage = error || 'Failed to request sign up';
      ToastService.error(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (err) {
    if (err instanceof Error) {
      ToastService.error(err.message || 'An unexpected error occurred during sign up.');
    } else {
      ToastService.error('An unknown error occurred.');
    }
    console.error('Error during sign-up process:', err);
    throw err;
  }
};

export const requestLogIn = async (email: string, password: string): Promise<void> => {
  const data = { email, password };
  try {
    await authClient.post('/signIn', data);
    ToastService.success('Login Successfully!');
  } catch (loginError) {
    ToastService.error('Please Check your Credentials');
    throw new Error('Please Check your Credentials');
  }
};

export const verifyOtp = async (otp: string): Promise<void> => {
  const data = { otp };
  try {
    await authClient.post('/signUp/verify-otp', data);
    ToastService.success('Account Created Successfully');
  } catch (otpError) {
    ToastService.error('Incorect Otp');
    throw new Error('Incorrect otp');
  }
};
