import { Prisma } from '@prisma/client';

import { prisma } from './index';
import { DatabaseError } from './lib';

export class SessionRepository {
  static async createSession(
    userId: string,
    refreshTokenHash: string,
    userAgent: string,
    ipAddress: string,
    expiresAt: Date,
    tx: Prisma.TransactionClient = prisma
  ) {
    try {
      return await tx.sessions.create({
        data: {
          userId,
          refreshTokenHash,
          userAgent,
          ipAddress,
          expiresAt,
        },
      });
    } catch {
      throw new DatabaseError('Failed to create session');
    }
  }

  static async getUseIdByRefreshToken(token: string) {
    try {
      if (token.length === 0) {
        return null;
      }
      const userDetails = await prisma.sessions.findUnique({
        where: {
          refreshTokenHash: token,
        },
        //orderBy: { expiresAt: 'desc' },
        select: {
          userId: true,
        },
      });
      return userDetails?.userId;
    } catch {
      throw new DatabaseError('Failed to fetch userif from Refresh token');
    }
  }
}
