import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const email_otps = {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  };
  const prisma = { email_otps };
  return { prisma };
});

vi.mock('@/repositories/index', () => ({
  prisma: mocks.prisma,
  default: mocks.prisma,
}));

import { DatabaseError } from '@/repositories/lib';
import { OtpRepository } from '@/repositories/otp.repo';

describe('OtpRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates otp row', async () => {
    const expiresAt = new Date('2026-01-01T00:00:00Z');
    mocks.prisma.email_otps.create.mockResolvedValueOnce({ id: 'otp1' });

    await expect(
      OtpRepository.createEmailOtp({ otpHash: 'hash', email: 'u@x.com', expiresAt })
    ).resolves.toEqual({ id: 'otp1' });
  });

  it('gets latest valid otp and marks it used', async () => {
    mocks.prisma.email_otps.findFirst.mockResolvedValueOnce({ id: 'otp1' });
    await expect(OtpRepository.getLatestValidOtpByEmail('u@x.com')).resolves.toEqual({
      id: 'otp1',
    });

    mocks.prisma.email_otps.update.mockResolvedValueOnce({ id: 'otp1', used: true });
    await expect(OtpRepository.markOtpAsUsed('otp1')).resolves.toEqual({ id: 'otp1', used: true });
  });

  it('reports verification status using latest otp', async () => {
    mocks.prisma.email_otps.findFirst.mockResolvedValueOnce({ id: 'otp1', used: true });
    await expect(OtpRepository.hasEmailBeenVerifiedByOtp('u@x.com')).resolves.toBe(true);

    mocks.prisma.email_otps.findFirst.mockResolvedValueOnce({ id: 'otp2', used: false });
    await expect(OtpRepository.hasEmailBeenVerifiedByOtp('u@x.com')).resolves.toBe(false);

    mocks.prisma.email_otps.findFirst.mockResolvedValueOnce(null);
    await expect(OtpRepository.hasEmailBeenVerifiedByOtp('u@x.com')).resolves.toBe(false);
  });

  it('maps db errors to DatabaseError', async () => {
    mocks.prisma.email_otps.create.mockRejectedValueOnce(new Error('db failed'));
    await expect(
      OtpRepository.createEmailOtp({ otpHash: 'hash', email: 'u@x.com', expiresAt: new Date() })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
