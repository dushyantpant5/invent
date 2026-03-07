import { OtpFactory } from '@/services/auth/otp-factory/otp.factory';

describe('OtpFactory', () => {
  it('generates a 6-digit OTP string', () => {
    const otp = OtpFactory.generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('hashes OTP deterministically and verifies successfully', async () => {
    const hash = await OtpFactory.generateOtpHash('123456');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    await expect(OtpFactory.verifyOtp('123456', hash)).resolves.toBe(true);
    await expect(OtpFactory.verifyOtp('654321', hash)).resolves.toBe(false);
  });

  it('throws on missing OTP values', async () => {
    await expect(OtpFactory.generateOtpHash('')).rejects.toThrow('OTP cannot be empty');
    await expect(OtpFactory.verifyOtp('', 'hash')).rejects.toThrow(
      'Plain OTP and hashed OTP are required for verification'
    );
  });
});
