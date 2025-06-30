import { ServiceError } from '../lib';
import { PasswordFactory } from './password-factory/password.factory';
import { TokenFactory } from './token-factory/token.factory';

import { UserRepository } from '@/repositories/user.repo';
import { SessionRepository } from '@/repositories/session.repo';
import prisma from '@/repositories';
import { RefreshTokenExpiresAt } from '@/constants/tokens.constant';

interface ISignUpUserDTO {
  email: string;
  password: string;
}

export interface ISignUpUserResponse {
  message: string;
}

interface ISignInUserDTO {
  email: string;
  password: string;
  userAgent: string;
  ipAddress: string;
}

export interface ISignInUserResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

interface otpData {
  email: string;
  otpHash: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

interface ISignUpUserWithOtp {
  email: string;
  idd: string;
  userAgent: string;
  ipAddress: string;
}

export interface ISignUpUserWithOtpResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
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

  static async handleSignInUser(signInData: ISignInUserDTO): Promise<ISignInUserResponse> {
    let accessToken: string;
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = TokenFactory.getRefreshTokenHash(refreshToken);
    const refreshTokenExpiresAt: Date = new Date(Date.now() + RefreshTokenExpiresAt);
    try {
      const userWithEmail = await UserRepository.getUserByEmail(signInData.email);
      if (userWithEmail) {
        const hashedPassword = userWithEmail.passwordHash;
        const actualPassword = signInData.password;
        const checkPassword = await PasswordFactory.verify(actualPassword, hashedPassword);
        if (!checkPassword) {
          throw new ServiceError('Please check your Credentials!');
        }

        await SessionRepository.createSession(
          userWithEmail.id,
          refreshTokenHash.tokenValue,
          signInData.userAgent,
          signInData.ipAddress,
          refreshTokenExpiresAt
        );
        accessToken = TokenFactory.getAccessToken({
          id: userWithEmail.id,
          email: signInData.email,
        }).tokenValue;
      }
    } catch {
      throw new ServiceError('Unable to login due to wrong credentials');
    }

    return {
      message: 'User Login Successfully',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
    };
  }

  static async handleOtpinSignUp(otpTableData: otpData) {
    let otpData;
    try {
      otpData = await UserRepository.createEmailOtp({
        otpHash: otpTableData.otpHash,
        email: otpTableData.email,
        expiresAt: otpTableData.expiresAt,
        createdAt: otpTableData.createdAt,
        used: otpTableData.used,
      });
    } catch {
      throw new Error('Otp udation failed in Db');
    }
    return {
      data: otpData,
      message: 'OTP successfully filled',
    };
  }

  static async getOtpDuringSignUp(id: string) {
    let otp;
    try {
      otp = await UserRepository.getOtpByEmail(id);
    } catch {
      throw new Error('Failed to fetch otp from db layer');
    }
    return {
      message: 'OTP fetched successfully',
      data: otp,
    };
  }

  static async updateUserAfterOtpVerification(
    signInData: ISignUpUserWithOtp
  ): Promise<ISignUpUserWithOtpResponse> {
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = TokenFactory.getRefreshTokenHash(refreshToken);
    const refreshTokenExpiresAt: Date = new Date(Date.now() + RefreshTokenExpiresAt);
    let accessToken: string;
    try {
      await prisma.$transaction(async (tx) => {
        const updateUserVerfiedStatus = await UserRepository.updateUserVerifiedStatus(
          signInData.email,
          tx
        );

        await UserRepository.updateEmailOtpsStatus(signInData.idd, tx);

        await SessionRepository.createSession(
          updateUserVerfiedStatus.id,
          refreshTokenHash.tokenValue,
          signInData.userAgent,
          signInData.ipAddress,
          refreshTokenExpiresAt,
          tx
        );
        accessToken = TokenFactory.getAccessToken({
          id: updateUserVerfiedStatus.id,
          email: updateUserVerfiedStatus.email,
        }).tokenValue;
      });
    } catch {
      throw new Error('Unable to verified user with otp');
    }
    return {
      message: 'Status Updated Successfully',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
    };
  }
}
