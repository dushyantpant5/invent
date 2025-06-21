import { Prisma } from '@prisma/client';

import { prisma } from './index';
import { DatabaseError } from './lib';

export class UserRepository {
  static async checkUserExistsByEmail(email: string) {
    try {
      const user = await prisma.users.findUnique({ where: { email } });
      return !!user;
    } catch {
      throw new DatabaseError('Failed to check if user exists by email');
    }
  }

  static async getUserByEmail(email: string) {
    try {
      return await prisma.users.findUnique({ where: { email } });
    } catch {
      throw new DatabaseError('Failed to fetch user by email');
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
}
