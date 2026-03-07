import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const users = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const user_profiles = {
    create: vi.fn(),
  };
  const prisma = { users, user_profiles };
  return { prisma };
});

vi.mock('@/repositories/index', () => ({
  prisma: mocks.prisma,
  default: mocks.prisma,
}));

import { DatabaseError } from '@/repositories/lib';
import { UserRepository } from '@/repositories/user.repo';

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets user by id', async () => {
    mocks.prisma.users.findUnique.mockResolvedValueOnce({ id: 'u1' });
    await expect(UserRepository.getUserById('u1')).resolves.toEqual({ id: 'u1' });
    expect(mocks.prisma.users.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('checks user existence by email', async () => {
    mocks.prisma.users.findUnique.mockResolvedValueOnce({ id: 'u1' });
    await expect(UserRepository.checkUserExistsByEmail('u@x.com')).resolves.toBe(true);

    mocks.prisma.users.findUnique.mockResolvedValueOnce(null);
    await expect(UserRepository.checkUserExistsByEmail('u@x.com')).resolves.toBe(false);
  });

  it('gets user by email', async () => {
    mocks.prisma.users.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'u@x.com' });
    await expect(UserRepository.getUserByEmail('u@x.com')).resolves.toEqual({
      id: 'u1',
      email: 'u@x.com',
    });
  });

  it('creates user and profile and updates verification status', async () => {
    const tx = {
      users: {
        create: vi.fn().mockResolvedValue({ id: 'u1' }),
        update: vi.fn().mockResolvedValue({}),
      },
      user_profiles: { create: vi.fn().mockResolvedValue({ id: 'p1' }) },
    };

    await expect(
      UserRepository.createUser({ email: 'u@x.com', passwordHash: 'hash' }, tx as never)
    ).resolves.toEqual({ id: 'u1' });
    await expect(UserRepository.createUserProfile('u1', tx as never)).resolves.toEqual({
      id: 'p1',
    });
    await expect(UserRepository.updateUserVerifiedStatus('u@x.com', tx as never)).resolves.toEqual(
      {}
    );
  });

  it('maps db failure to DatabaseError', async () => {
    mocks.prisma.users.findUnique.mockRejectedValueOnce(new Error('db down'));
    await expect(UserRepository.getUserById('u1')).rejects.toBeInstanceOf(DatabaseError);
  });
});
