import { Prisma } from '@prisma/client';

import { prisma } from './index';
import { DatabaseError } from './lib';

export class UserRepository {
  static async getUserById(userId: string) {
    try {
      return await prisma.users.findUnique({ where: { id: userId } });
    } catch {
      throw new DatabaseError('Failed to fetch user by id');
    }
  }

  static async checkUserExistsByEmail(email: string): Promise<boolean> {
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

  static async createUserProfile(userId: string, tx: Prisma.TransactionClient = prisma) {
    try {
      return await tx.user_profiles.create({ data: { userId } });
    } catch {
      throw new DatabaseError('Failed to create user profile');
    }
  }

  static async updateUserVerifiedStatus(email: string, tx: Prisma.TransactionClient = prisma) {
    try {
      return await tx.users.update({
        where: { email },
        data: { isVerified: true },
      });
    } catch {
      throw new DatabaseError('Error on updating user verified status');
    }
  }
}
