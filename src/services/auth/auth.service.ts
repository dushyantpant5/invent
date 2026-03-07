import { cookies } from 'next/headers';

import { ServiceError } from '../lib';
import { PasswordFactory } from './password-factory/password.factory';
import { TokenFactory } from './token-factory/token.factory';
import { OtpFactory } from './otp-factory/otp.factory';

import { UserRepository } from '@/repositories/user.repo';
import { SessionRepository } from '@/repositories/session.repo';
import { OtpRepository } from '@/repositories/otp.repo';
import prisma from '@/repositories';
import { AccessToken, RefreshTokenExpiresAt } from '@/constants/tokens.constant';
import { OtpExpiresAt } from '@/constants/otp.constant';
import { decryptSignUpPayload } from '@/lib/crypto/encryption';
import type {
  ISignUpUserDTO,
  ISignInUserDTO,
  ISignInUserResponseDTO,
  IOtpVerificationDTO,
  ICompleteSignUpDTO,
  IRefreshTokenRequestDTO,
  IRefreshTokenResponseDTO,
} from '@/types/auth/auth';

export default class AuthService {
  static async handleRequestSignUp(
    signUpData: ISignUpUserDTO
  ): Promise<{ message: string; otp: string }> {
    const userExists = await UserRepository.checkUserExistsByEmail(signUpData.email);
    if (userExists) {
      throw new ServiceError('User with this email already exists', 409);
    }

    const otp = OtpFactory.generateOtp();
    const otpHash = await OtpFactory.generateOtpHash(otp);

    try {
      await OtpRepository.createEmailOtp({
        otpHash,
        email: signUpData.email,
        expiresAt: new Date(Date.now() + OtpExpiresAt),
      });
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new ServiceError('Failed to send OTP. Please try again', 500);
    }

    return {
      message: 'OTP sent to email',
      otp, // dev only — remove in production
    };
  }

  static async handleVerifyOtp(otpVerificationData: IOtpVerificationDTO): Promise<void> {
    const userSignUpData = await this.getUserSignUpDataFromCookies();
    const latestValidOtp = await OtpRepository.getLatestValidOtpByEmail(userSignUpData.email);

    if (!latestValidOtp) {
      throw new ServiceError('No valid OTP found. Please request a new one', 404);
    }

    const isOtpValid = await OtpFactory.verifyOtp(otpVerificationData.otp, latestValidOtp.otpHash);
    if (!isOtpValid) {
      throw new ServiceError('Invalid OTP', 400);
    }

    await OtpRepository.markOtpAsUsed(latestValidOtp.id);
  }

  static async handleCompleteSignUp(
    routeData: ICompleteSignUpDTO
  ): Promise<ISignInUserResponseDTO> {
    const userSignUpData = await this.getUserSignUpDataFromCookies();

    const isUserVerified = await OtpRepository.hasEmailBeenVerifiedByOtp(userSignUpData.email);
    if (!isUserVerified) {
      throw new ServiceError('Account not verified. Please complete OTP verification', 403);
    }

    const hashedPassword = await PasswordFactory.generateHashPassword(userSignUpData.password);
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = await TokenFactory.hashRefreshToken(refreshToken.tokenValue);
    const refreshTokenExpiresAt = new Date(Date.now() + RefreshTokenExpiresAt);
    let accessToken: string;

    try {
      await prisma.$transaction(async (tx) => {
        const newUser = await UserRepository.createUser(
          { email: userSignUpData.email, passwordHash: hashedPassword },
          tx
        );
        await UserRepository.createUserProfile(newUser.id, tx);
        await UserRepository.updateUserVerifiedStatus(userSignUpData.email, tx);
        await SessionRepository.createSession({
          userId: newUser.id,
          refreshTokenHash,
          userAgent: routeData.userAgent,
          ipAddress: routeData.ipAddress,
          expiresAt: refreshTokenExpiresAt,
          tx,
        });
        const accessTokenObj = await TokenFactory.getAccessToken({
          id: newUser.id,
          email: newUser.email,
        });
        accessToken = accessTokenObj.tokenValue;
      });
    } catch {
      throw new ServiceError('Registration failed. Please try again', 500);
    }

    const cookieStore = await cookies();
    cookieStore.delete('userPayload');

    return {
      message: 'Account created successfully',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
    };
  }

  static async handleSignInUser(signInData: ISignInUserDTO): Promise<ISignInUserResponseDTO> {
    const user = await UserRepository.getUserByEmail(signInData.email);
    if (!user) {
      throw new ServiceError('Invalid email or password', 401);
    }

    const passwordMatch = await PasswordFactory.verify(signInData.password, user.passwordHash);
    if (!passwordMatch) {
      throw new ServiceError('Invalid email or password', 401);
    }

    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = await TokenFactory.hashRefreshToken(refreshToken.tokenValue);
    const refreshTokenExpiresAt = new Date(Date.now() + RefreshTokenExpiresAt);

    try {
      await SessionRepository.createSession({
        userId: user.id,
        refreshTokenHash,
        userAgent: signInData.userAgent,
        ipAddress: signInData.ipAddress,
        expiresAt: refreshTokenExpiresAt,
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new ServiceError('Sign in failed. Please try again', 500);
    }

    const accessTokenObj = await TokenFactory.getAccessToken({ id: user.id, email: user.email });

    return {
      message: 'Signed in successfully',
      accessToken: accessTokenObj.tokenValue,
      refreshToken: refreshToken.tokenValue,
    };
  }

  static async handleRefresh(
    data: IRefreshTokenRequestDTO
  ): Promise<IRefreshTokenResponseDTO | null> {
    const refreshTokenHash = await TokenFactory.hashRefreshToken(data.refreshTokenFromCookie);
    const session = await SessionRepository.getSession(refreshTokenHash);

    if (!session || session.revoked || session.expiresAt < new Date()) {
      return null;
    }

    const user = await UserRepository.getUserById(session.userId);
    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    const newRefreshToken = TokenFactory.getRefreshToken();
    const newRefreshTokenHash = await TokenFactory.hashRefreshToken(newRefreshToken.tokenValue);
    const newRefreshTokenExpiresAt = new Date(Date.now() + RefreshTokenExpiresAt);
    let accessToken: string | undefined;

    try {
      await prisma.$transaction(async (tx) => {
        await SessionRepository.revokeSession(session.id, tx);
        await SessionRepository.createSession({
          userId: session.userId,
          refreshTokenHash: newRefreshTokenHash,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          expiresAt: newRefreshTokenExpiresAt,
          tx,
        });
        const accessTokenObj = await TokenFactory.getAccessToken({
          id: session.userId,
          email: user.email,
        });
        accessToken = accessTokenObj.tokenValue;
      });
    } catch {
      throw new ServiceError('Token refresh failed. Please sign in again', 500);
    }

    return {
      message: 'Tokens refreshed successfully',
      accessToken: accessToken!,
      refreshToken: newRefreshToken.tokenValue,
    };
  }

  static async getUserSession(): Promise<{ id: string; userEmail: string }> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AccessToken)?.value;
    if (!accessToken) {
      throw new ServiceError('Authentication required', 401);
    }

    const userPayload = await TokenFactory.verifyAccessToken(accessToken);
    if (!userPayload) {
      throw new ServiceError('Invalid or expired session. Please sign in again', 401);
    }

    return { id: userPayload.id, userEmail: userPayload.email };
  }

  private static async getUserSignUpDataFromCookies(): Promise<{
    email: string;
    password: string;
  }> {
    const cookieStore = await cookies();
    const encryptedPayload = cookieStore.get('userPayload')?.value;
    if (!encryptedPayload) {
      throw new ServiceError('Sign-up session expired. Please start again', 400);
    }

    const { email, password } = await decryptSignUpPayload(encryptedPayload);
    if (!email || !password) {
      throw new ServiceError('Invalid sign-up session data', 400);
    }

    return { email, password };
  }
}
