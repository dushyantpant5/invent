import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      'Password must contain at least one letter, one number, and one special character'
    ),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const otpVerificationSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshTokenFromCookie: z.string().min(1, 'Refresh token is required'),
});

export const createInventorySchema = z.object({
  name: z
    .string()
    .min(1, 'Inventory name is required')
    .max(100, 'Inventory name must be 100 characters or fewer'),
});

export const joinInventorySchema = z.object({
  code: z.string().min(1, 'Inventory code is required').max(20, 'Invalid inventory code'),
});
