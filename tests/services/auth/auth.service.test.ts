import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn(),
    delete: vi.fn(),
  };

  const prisma = {
    $transaction: vi.fn(),
  };

  const UserRepository = {
    checkUserExistsByEmail: vi.fn(),
    createUser: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserVerifiedStatus: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
  };

  const SessionRepository = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    revokeSession: vi.fn(),
  };

  const OtpRepository = {
    createEmailOtp: vi.fn(),
    getLatestValidOtpByEmail: vi.fn(),
    markOtpAsUsed: vi.fn(),
    hasEmailBeenVerifiedByOtp: vi.fn(),
  };

  const PasswordFactory = {
    generateHashPassword: vi.fn(),
    verify: vi.fn(),
  };

  const TokenFactory = {
    getRefreshToken: vi.fn(),
    hashRefreshToken: vi.fn(),
    getAccessToken: vi.fn(),
    verifyAccessToken: vi.fn(),
  };

  const OtpFactory = {
    generateOtp: vi.fn(),
    generateOtpHash: vi.fn(),
    verifyOtp: vi.fn(),
  };

  const decryptSignUpPayload = vi.fn();

  return {
    cookieStore,
    prisma,
    UserRepository,
    SessionRepository,
    OtpRepository,
    PasswordFactory,
    TokenFactory,
    OtpFactory,
    decryptSignUpPayload,
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock('@/services/auth/password-factory/password.factory', () => ({
  PasswordFactory: mocks.PasswordFactory,
}));

vi.mock('@/services/auth/token-factory/token.factory', () => ({
  TokenFactory: mocks.TokenFactory,
}));

vi.mock('@/services/auth/otp-factory/otp.factory', () => ({
  OtpFactory: mocks.OtpFactory,
}));

vi.mock('@/repositories/user.repo', () => ({
  UserRepository: mocks.UserRepository,
}));

vi.mock('@/repositories/session.repo', () => ({
  SessionRepository: mocks.SessionRepository,
}));

vi.mock('@/repositories/otp.repo', () => ({
  OtpRepository: mocks.OtpRepository,
}));

vi.mock('@/repositories', () => ({
  default: mocks.prisma,
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptSignUpPayload: mocks.decryptSignUpPayload,
}));

import AuthService from '@/services/auth/auth.service';
import { ServiceError } from '@/services/lib';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}));
    mocks.TokenFactory.getRefreshToken.mockReturnValue({ tokenValue: 'refresh-token' });
    mocks.TokenFactory.hashRefreshToken.mockResolvedValue('hashed-refresh');
    mocks.TokenFactory.getAccessToken.mockResolvedValue({ tokenValue: 'access-token' });
    mocks.OtpFactory.generateOtp.mockReturnValue('123456');
    mocks.OtpFactory.generateOtpHash.mockResolvedValue('otp-hash');
    mocks.PasswordFactory.generateHashPassword.mockResolvedValue('password-hash');
    mocks.cookieStore.get.mockReturnValue(undefined);
    mocks.decryptSignUpPayload.mockResolvedValue({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
  });

  it('rejects signup request when user already exists', async () => {
    mocks.UserRepository.checkUserExistsByEmail.mockResolvedValueOnce(true);

    await expect(
      AuthService.handleRequestSignUp({ email: 'user@example.com', password: 'Passw0rd!' })
    ).rejects.toMatchObject({ message: 'User with this email already exists', statusCode: 409 });
  });

  it('creates otp for signup request', async () => {
    mocks.UserRepository.checkUserExistsByEmail.mockResolvedValueOnce(false);
    mocks.OtpRepository.createEmailOtp.mockResolvedValueOnce({});

    await expect(
      AuthService.handleRequestSignUp({ email: 'user@example.com', password: 'Passw0rd!' })
    ).resolves.toEqual({ message: 'OTP sent to email', otp: '123456' });
    expect(mocks.OtpRepository.createEmailOtp).toHaveBeenCalled();
  });

  it('validates otp verification flow', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted' });
    mocks.OtpRepository.getLatestValidOtpByEmail.mockResolvedValueOnce({
      id: 'otp-1',
      otpHash: 'otp-hash',
    });
    mocks.OtpFactory.verifyOtp.mockResolvedValueOnce(true);

    await expect(AuthService.handleVerifyOtp({ otp: '123456' })).resolves.toBeUndefined();
    expect(mocks.OtpRepository.markOtpAsUsed).toHaveBeenCalledWith('otp-1');
  });

  it('throws when no valid otp is found', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted' });
    mocks.OtpRepository.getLatestValidOtpByEmail.mockResolvedValueOnce(null);

    await expect(AuthService.handleVerifyOtp({ otp: '123456' })).rejects.toMatchObject({
      message: 'No valid OTP found. Please request a new one',
      statusCode: 404,
    });
  });

  it('throws when otp does not match', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted' });
    mocks.OtpRepository.getLatestValidOtpByEmail.mockResolvedValueOnce({
      id: 'otp-1',
      otpHash: 'otp-hash',
    });
    mocks.OtpFactory.verifyOtp.mockResolvedValueOnce(false);

    await expect(AuthService.handleVerifyOtp({ otp: '654321' })).rejects.toMatchObject({
      message: 'Invalid OTP',
      statusCode: 400,
    });
  });

  it('completes signup after verification and clears userPayload cookie', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted' });
    mocks.OtpRepository.hasEmailBeenVerifiedByOtp.mockResolvedValueOnce(true);
    mocks.prisma.$transaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
      cb({})
    );
    mocks.UserRepository.createUser.mockResolvedValueOnce({ id: 'u1', email: 'user@example.com' });
    mocks.UserRepository.createUserProfile.mockResolvedValueOnce({});
    mocks.UserRepository.updateUserVerifiedStatus.mockResolvedValueOnce({});
    mocks.SessionRepository.createSession.mockResolvedValueOnce({});

    const result = await AuthService.handleCompleteSignUp({
      userAgent: 'ua',
      ipAddress: '1.1.1.1',
    });

    expect(result).toEqual({
      message: 'Account created successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(mocks.cookieStore.delete).toHaveBeenCalledWith('userPayload');
  });

  it('throws when signup completion attempted without otp verification', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted' });
    mocks.OtpRepository.hasEmailBeenVerifiedByOtp.mockResolvedValueOnce(false);

    await expect(
      AuthService.handleCompleteSignUp({ userAgent: 'ua', ipAddress: '1.1.1.1' })
    ).rejects.toMatchObject({
      message: 'Account not verified. Please complete OTP verification',
      statusCode: 403,
    });
  });

  it('signs in valid user', async () => {
    mocks.UserRepository.getUserByEmail.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@example.com',
      passwordHash: 'password-hash',
    });
    mocks.PasswordFactory.verify.mockResolvedValueOnce(true);
    mocks.SessionRepository.createSession.mockResolvedValueOnce({});

    const result = await AuthService.handleSignInUser({
      email: 'user@example.com',
      password: 'Passw0rd!',
      userAgent: 'ua',
      ipAddress: '1.1.1.1',
    });

    expect(result).toEqual({
      message: 'Signed in successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects sign in for unknown user', async () => {
    mocks.UserRepository.getUserByEmail.mockResolvedValueOnce(null);

    await expect(
      AuthService.handleSignInUser({
        email: 'user@example.com',
        password: 'Passw0rd!',
        userAgent: 'ua',
        ipAddress: '1.1.1.1',
      })
    ).rejects.toMatchObject({
      message: 'Invalid email or password',
      statusCode: 401,
    });
  });

  it('returns null from refresh when session is missing', async () => {
    mocks.SessionRepository.getSession.mockResolvedValueOnce(null);

    await expect(
      AuthService.handleRefresh({
        refreshTokenFromCookie: 'refresh-token',
        userAgent: 'ua',
        ipAddress: '1.1.1.1',
      })
    ).resolves.toBeNull();
  });

  it('refreshes tokens for a valid session', async () => {
    mocks.SessionRepository.getSession.mockResolvedValueOnce({
      id: 's1',
      userId: 'u1',
      revoked: false,
      expiresAt: new Date(Date.now() + 10_000),
    });
    mocks.UserRepository.getUserById.mockResolvedValueOnce({ id: 'u1', email: 'user@example.com' });
    mocks.SessionRepository.revokeSession.mockResolvedValueOnce({});
    mocks.SessionRepository.createSession.mockResolvedValueOnce({});

    const result = await AuthService.handleRefresh({
      refreshTokenFromCookie: 'refresh-token',
      userAgent: 'ua',
      ipAddress: '1.1.1.1',
    });

    expect(result).toEqual({
      message: 'Tokens refreshed successfully',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('returns current user session from access token', async () => {
    mocks.cookieStore.get.mockImplementation((key: string) =>
      key === 'accessToken' ? { value: 'access-token' } : undefined
    );
    mocks.TokenFactory.verifyAccessToken.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@example.com',
    });

    await expect(AuthService.getUserSession()).resolves.toEqual({
      id: 'u1',
      userEmail: 'user@example.com',
    });
  });

  it('throws when access token is missing', async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);

    await expect(AuthService.getUserSession()).rejects.toBeInstanceOf(ServiceError);
  });
});
