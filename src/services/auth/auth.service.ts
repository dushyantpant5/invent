import { cookies } from 'next/headers';

import { ServiceError } from '../lib';
import { PasswordFactory } from './password-factory/password.factory';
import { TokenFactory } from './token-factory/token.factory';
import { OtpFactory } from './otp-factory/otp.factory';

import { UserRepository } from '@/repositories/user.repo';
import { SessionRepository } from '@/repositories/session.repo';
import prisma from '@/repositories';
import { AccessToken, RefreshTokenExpiresAt } from '@/constants/tokens.constant';
import { OtpRepository } from '@/repositories/otp.repo';
import { OtpExpiresAt } from '@/constants/otp.constant';
import { decryptSignUpPayload } from '@/helpers/encryption';

interface ISignUpUserDTO {
  email: string;
  password: string;
}

interface ISignUpUserResponse {
  message: string;
}

interface ISignInUserDTO {
  email: string;
  password: string;
  userAgent: string;
  ipAddress: string;
}

interface ISignInUserResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

interface IOtpVerificationDTO {
  otp: string;
}

interface ICompleteSignUpRouteDTO {
  userAgent: string;
  ipAddress: string;
}

export default class AuthService {
  static async handleSignUpUser(signUpData: ISignUpUserDTO): Promise<ISignUpUserResponse> {
    const userWithEmail = await UserRepository.checkUserExistsByEmail(signUpData.email);
    if (userWithEmail === true) {
      throw new ServiceError('User with this email already exists');
    }

    const hashedPassword = await PasswordFactory.generateHashPassword(signUpData.password);

    try {
      await prisma.$transaction(async (tx) => {
        const newUser = await UserRepository.createUser(
          {
            email: signUpData.email,
            passwordHash: hashedPassword,
          },
          tx
        );

        await UserRepository.createUserProfile(newUser.id, tx);
      });
    } catch {
      throw new ServiceError('User registration failed');
    }

    return {
      message: 'User successfully registered',
    };
  }

  static async handleRequestSignUp(signUpData: ISignUpUserDTO) {
    // Check if user already exists
    const userWithEmail = await UserRepository.checkUserExistsByEmail(signUpData.email);
    if (userWithEmail === true) {
      throw new ServiceError('User with this email already exists');
    }
    // Generate OTP
    const otp = OtpFactory.generateOtp();
    const otpHash = OtpFactory.generateOtpHash(otp);

    // This will be used later in production to send OTP to user's email
    // Send OTP to user's email
    // await EmailService.sendOtpEmail({
    //   toEmail: signUpData.email,
    //   otp,
    // });

    // Insert OTP into the database
    try {
      await OtpRepository.createEmailOtp({
        otpHash,
        email: signUpData.email,
        expiresAt: new Date(Date.now() + OtpExpiresAt),
      });
    } catch (error) {
      console.error('Error creating OTP:', error);
      throw new ServiceError('Failed to create OTP for user');
    }

    // We are returning the OTP in the response for testing purposes will be removed later
    return {
      message: 'OTP successfully created and sent to email',
      status: 200,
      otp: otp, // This should be removed in production
    };
  }

  static async handleVerifyOtp(otpVerificationData: IOtpVerificationDTO) {
    const userSignUpData = await this.getUserSignUpDataFromCookies();
    const latestValidOtp = await OtpRepository.getLatestValidOtpByEmail(userSignUpData.email);
    if (!latestValidOtp) {
      throw new ServiceError('No valid OTP found for this email');
    }
    const isOtpValid = OtpFactory.verifyOtp(otpVerificationData.otp, latestValidOtp.otpHash);
    if (!isOtpValid) {
      console.error('Invalid OTP provided:', otpVerificationData.otp);
      throw new ServiceError('Invalid OTP');
    }
    // Mark the OTP as used
    await OtpRepository.markOtpAsUsed(latestValidOtp.id);
    return {
      message: 'OTP successfully verified',
      status: 200,
    };
  }

  static async handleCompleteSignUp(routeData: ICompleteSignUpRouteDTO) {
    const userSignUpData = await this.getUserSignUpDataFromCookies();
    const hashedPassword = await PasswordFactory.generateHashPassword(userSignUpData.password);
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = TokenFactory.getRefreshTokenHash(refreshToken);
    const refreshTokenExpiresAt: Date = new Date(Date.now() + RefreshTokenExpiresAt);
    let accessToken: string;

    const isUserVerified = await UserRepository.getUserVerifiedStatus(userSignUpData.email);
    if (!isUserVerified) {
      throw new ServiceError('User is not verified');
    }

    try {
      await prisma.$transaction(async (tx) => {
        const newUser = await UserRepository.createUser(
          {
            email: userSignUpData.email,
            passwordHash: hashedPassword,
          },
          tx
        );

        await UserRepository.createUserProfile(newUser.id, tx);
        await UserRepository.updateUserVerifiedStatus(userSignUpData.email, tx);
        await SessionRepository.createSession(
          newUser.id,
          refreshTokenHash.tokenValue,
          routeData.userAgent,
          routeData.ipAddress,
          refreshTokenExpiresAt,
          tx
        );

        accessToken = TokenFactory.getAccessToken({
          id: newUser.id,
          email: newUser.email,
        }).tokenValue;
      });
    } catch {
      throw new ServiceError('User registration failed');
    }

    // Clear the cookies after successful registration
    const cookieStore = await cookies();
    cookieStore.delete('userPayload');

    return {
      message: 'User successfully registered',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
    };
  }

  static async handleSignInUser(signInData: ISignInUserDTO): Promise<ISignInUserResponse> {
    let accessToken: string;

    const userWithEmail = await UserRepository.getUserByEmail(signInData.email);
    if (!userWithEmail) {
      throw new ServiceError('Please check your Credentials!');
    }

    const hashedPassword = userWithEmail.passwordHash;
    const actualPassword = signInData.password;
    const checkPassword = await PasswordFactory.verify(actualPassword, hashedPassword);
    if (!checkPassword) {
      throw new ServiceError('Please check your Credentials!');
    }
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = TokenFactory.getRefreshTokenHash(refreshToken);
    const refreshTokenExpiresAt: Date = new Date(Date.now() + RefreshTokenExpiresAt);

    try {
      await SessionRepository.createSession(
        userWithEmail.id,
        refreshTokenHash.tokenValue,
        signInData.userAgent,
        signInData.ipAddress,
        refreshTokenExpiresAt
      );
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new ServiceError('Unable to login due to server error');
    }

    accessToken = TokenFactory.getAccessToken({
      id: userWithEmail.id,
      email: signInData.email,
    }).tokenValue;

    return {
      message: 'User Login Successfully',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
    };
  }

  static async getUserSession(): Promise<{ id: string; userEmail: string }> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AccessToken)?.value;
    if (!accessToken) {
      throw new ServiceError('No access token found in cookies');
    }
    const userPayload = TokenFactory.verifyAccessToken(accessToken);
    if (!userPayload) {
      throw new ServiceError('Invalid access token');
    }
    return {
      id: userPayload.id,
      userEmail: userPayload.email,
    };
  }

  /**Private Functions
   * These functions are not exported and are used internally within the AuthService class.
   */

  private static async getUserSignUpDataFromCookies() {
    const cookieStore = await cookies();
    const encryptedPayload = cookieStore.get('userPayload')?.value;
    if (!encryptedPayload) {
      throw new ServiceError('No user data found in cookies');
    }

    const { email, password } = decryptSignUpPayload(encryptedPayload);
    if (!email || !password) {
      throw new ServiceError('Invalid user data in cookies');
    }
    return { email, password };
  }
}
