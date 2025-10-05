import { Prisma } from '@prisma/client';

import { prisma } from './index';
import { DatabaseError } from './lib';

export class UserRepository {
  static async checkUserExistsByEmail(email: string) {
    try {
      const user = await prisma.users.findUnique({ where: { email } });
      return !!user;
    } catch {
      throw new DatabaseError('Failed to fetch user by email');
    }
  }

  static async getUserByEmail(email: string) {
    try {
      return await prisma.users.findUnique({ where: { email } });
    } catch {
      throw new DatabaseError('Database error while fetching user');
    }
  }

  static async getUserEmailById(id: string) {
    try {
      return await prisma.users.findUnique({
        where: {
          id: id,
        },
        select: {
          email: true,
        },
      });
    } catch {
      throw new DatabaseError('Failed to fetch user email by Id');
    }
  }

  //This method is used in a transaction, so it accepts a Prisma.TransactionClient
  static async createUser(
    data: { email: string; passwordHash: string },
    tx: Prisma.TransactionClient = prisma
  ) {
    try {
      return await tx.users.create({ data });
    } catch {
      throw new DatabaseError('Failed to create user');
    }
  }

  //This method is used in a transaction, so it accepts a Prisma.TransactionClient
  static async createUserProfile(userId: string, tx: Prisma.TransactionClient = prisma) {
    try {
      return await tx.user_profiles.create({ data: { userId } });
    } catch {
      throw new DatabaseError('Failed to create user profile');
    }
  }

  static async createEmailOtp(data: {
    otpHash: string;
    email: string;
    expiresAt: Date;
    createdAt: Date;
    used: boolean;
  }) {
    try {
      return await prisma.email_otps.create({ data });
    } catch {
      throw new DatabaseError('Failed to enter otp details in table');
    }
  }

  static async getOtpByUniqueId(id: string) {
    try {
      return await prisma.email_otps.findUnique({ where: { id } });
    } catch {
      throw new DatabaseError('You are not registered with entered email');
    }
  }

  static async updateUserVerifiedStatus(email: string, tx: Prisma.TransactionClient = prisma) {
    try {
      const updateData: { isVerified: boolean } = { isVerified: true };
      return await tx.users.update({
        where: {
          email: email,
        },
        data: updateData,
      });
    } catch {
      throw new DatabaseError('Error on updating user verified status');
    }
  }

  static async updateEmailOtpsStatus(id: string, tx: Prisma.TransactionClient = prisma) {
    try {
      const updateData: { used: boolean } = { used: true };
      return await tx.email_otps.update({
        where: {
          id: id,
        },
        data: updateData,
      });
    } catch {
      throw new DatabaseError('Error on updating user status on otp table');
    }
  }

  static async getUserVerifiedStatus(email: string): Promise<boolean> {
    try {
      const latestOtp = await prisma.email_otps.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });

      return !!latestOtp && latestOtp.used;
    } catch {
      throw new DatabaseError('Failed to fetch user verified status');
    }
  }
}
