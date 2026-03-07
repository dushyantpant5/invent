import { otpVerificationSchema, signInSchema, signUpSchema } from '@/zod-validator';

describe('zod-validator/index', () => {
  it('validates sign up schema', () => {
    expect(
      signUpSchema.safeParse({ email: 'user@example.com', password: 'Passw0rd!' }).success
    ).toBe(true);
    expect(signUpSchema.safeParse({ email: 'bad', password: '123' }).success).toBe(false);
  });

  it('validates sign in schema', () => {
    expect(
      signInSchema.safeParse({ email: 'user@example.com', password: 'password1' }).success
    ).toBe(true);
    expect(signInSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
  });

  it('validates otp schema', () => {
    expect(otpVerificationSchema.safeParse({ otp: '123456' }).success).toBe(true);
    expect(otpVerificationSchema.safeParse({ otp: '12345' }).success).toBe(false);
  });
});
