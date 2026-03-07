import { prisma } from './index';
import { DatabaseError } from './lib';

export class OtpRepository {
  static async createEmailOtp(data: { otpHash: string; email: string; expiresAt: Date }) {
    try {
      return await prisma.email_otps.create({ data });
    } catch {
      throw new DatabaseError('Failed to enter otp details in table');
    }
  }
  static async getLatestValidOtpByEmail(email: string) {
    try {
      return await prisma.email_otps.findFirst({
        where: {
          email,
          expiresAt: {
            gte: new Date(),
          },
          used: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      throw new DatabaseError('Failed to fetch latest valid OTP by email');
    }
  }
  static async markOtpAsUsed(id: string) {
    try {
      return await prisma.email_otps.update({
        where: { id },
        data: { used: true },
      });
    } catch {
      throw new DatabaseError('Failed to mark OTP as used');
    }
  }

  static async hasEmailBeenVerifiedByOtp(email: string): Promise<boolean> {
    try {
      const latestOtp = await prisma.email_otps.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });
      return !!latestOtp && latestOtp.used;
    } catch {
      throw new DatabaseError('Failed to fetch OTP verification status');
    }
  }
}
