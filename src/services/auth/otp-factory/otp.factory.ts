import { createHash } from 'crypto';

export class OtpFactory {
  static generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }
  static generateOtpHash(otp: string): string {
    if (!otp) {
      throw new Error('OTP cannot be empty');
    }
    return createHash('sha256').update(otp).digest('hex');
  }
  static verifyOtp(plainOtp: string, hashedOtp: string): boolean {
    if (!plainOtp || !hashedOtp) {
      throw new Error('Plain OTP and hashed OTP are required for verification');
    }
    const hashedPlainOtp = this.generateOtpHash(plainOtp);
    return hashedPlainOtp === hashedOtp;
  }
}
