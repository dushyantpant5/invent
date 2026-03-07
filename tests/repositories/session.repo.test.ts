import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const sessions = {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const prisma = { sessions };
  return { prisma };
});

vi.mock('@/repositories/index', () => ({
  prisma: mocks.prisma,
  default: mocks.prisma,
}));

import { DatabaseError } from '@/repositories/lib';
import { SessionRepository } from '@/repositories/session.repo';

describe('SessionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates session with mapped fields', async () => {
    const expiresAt = new Date('2026-01-01T00:00:00Z');
    mocks.prisma.sessions.create.mockResolvedValueOnce({ id: 's1' });

    await expect(
      SessionRepository.createSession({
        userId: 'u1',
        refreshTokenHash: 'hash',
        userAgent: 'ua',
        ipAddress: '1.1.1.1',
        expiresAt,
      })
    ).resolves.toEqual({ id: 's1' });

    expect(mocks.prisma.sessions.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        refreshTokenHash: 'hash',
        userAgent: 'ua',
        ipAddress: '1.1.1.1',
        expiresAt,
      },
    });
  });

  it('returns session or null from getSession', async () => {
    mocks.prisma.sessions.findUnique.mockResolvedValueOnce({ id: 's1', revoked: false });
    await expect(SessionRepository.getSession('hash')).resolves.toEqual({
      id: 's1',
      revoked: false,
    });

    mocks.prisma.sessions.findUnique.mockResolvedValueOnce(null);
    await expect(SessionRepository.getSession('hash')).resolves.toBeNull();
  });

  it('revokes session', async () => {
    mocks.prisma.sessions.update.mockResolvedValueOnce({});
    await expect(SessionRepository.revokeSession('s1')).resolves.toBeUndefined();
    expect(mocks.prisma.sessions.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revoked: true },
    });
  });

  it('maps db errors to DatabaseError', async () => {
    mocks.prisma.sessions.create.mockRejectedValueOnce(new Error('db failed'));
    await expect(
      SessionRepository.createSession({
        userId: 'u1',
        refreshTokenHash: 'hash',
        userAgent: 'ua',
        ipAddress: '1.1.1.1',
        expiresAt: new Date(),
      })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
