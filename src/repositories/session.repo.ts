import { Prisma } from '@prisma/client';

import { prisma } from './index';
import { DatabaseError } from './lib';

import { ICreateSessionDTO } from '@/types/auth/auth';

export class SessionRepository {
  static async createSession(data: ICreateSessionDTO) {
    const { userId, refreshTokenHash, userAgent, ipAddress, expiresAt, tx = prisma } = data;
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

  static async getSession(tokenHash: string) {
    try {
      const sessionData = await prisma.sessions.findUnique({
        where: { refreshTokenHash: tokenHash, revoked: false },
      });
      if (sessionData) return sessionData;
      return null;
    } catch {
      throw new DatabaseError('Failed to get session');
    }
  }

  static async revokeSession(sessionId: string, tx: Prisma.TransactionClient = prisma) {
    try {
      await tx.sessions.update({
        where: { id: sessionId },
        data: { revoked: true },
      });
    } catch {
      throw new DatabaseError('Failed to revoke session');
    }
  }
}
