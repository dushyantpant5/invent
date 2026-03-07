import {
  createInventorySchema,
  joinInventorySchema,
  otpVerificationSchema,
  refreshTokenSchema,
  signInSchema,
  signUpSchema,
} from '@/validators';

describe('validators/index', () => {
  it('accepts valid signup payload and rejects invalid one', () => {
    expect(
      signUpSchema.safeParse({ email: 'user@example.com', password: 'Passw0rd!' }).success
    ).toBe(true);
    expect(signUpSchema.safeParse({ email: 'x', password: '123' }).success).toBe(false);
  });

  it('validates signin payload', () => {
    expect(
      signInSchema.safeParse({ email: 'user@example.com', password: 'password1' }).success
    ).toBe(true);
    expect(signInSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
  });

  it('validates otp, refresh token and inventory payloads', () => {
    expect(otpVerificationSchema.safeParse({ otp: '123456' }).success).toBe(true);
    expect(otpVerificationSchema.safeParse({ otp: '123' }).success).toBe(false);

    expect(refreshTokenSchema.safeParse({ refreshTokenFromCookie: 'token' }).success).toBe(true);
    expect(refreshTokenSchema.safeParse({ refreshTokenFromCookie: '' }).success).toBe(false);

    expect(createInventorySchema.safeParse({ name: 'Main' }).success).toBe(true);
    expect(createInventorySchema.safeParse({ name: '' }).success).toBe(false);

    expect(joinInventorySchema.safeParse({ code: 'ABC123' }).success).toBe(true);
    expect(joinInventorySchema.safeParse({ code: '' }).success).toBe(false);
  });
});
