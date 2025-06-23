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
  userAgent: string;
  ipAddress: string;
}

export interface ISignUpUserResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
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

export default class AuthService {
  static async handleSignUpUser(signUpData: ISignUpUserDTO): Promise<ISignUpUserResponse> {
    const userWithEmail = await UserRepository.checkUserExistsByEmail(signUpData.email);
    if (userWithEmail === true) {
      throw new ServiceError('User with this email already exists');
    }

    const hashedPassword = await PasswordFactory.generateHashPassword(signUpData.password);
    const refreshToken = TokenFactory.getRefreshToken();
    const refreshTokenHash = TokenFactory.getRefreshTokenHash(refreshToken);
    const refreshTokenExpiresAt: Date = new Date(Date.now() + RefreshTokenExpiresAt);

    let accessToken: string;

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

        await SessionRepository.createSession(
          newUser.id,
          refreshTokenHash.tokenValue,
          signUpData.userAgent,
          signUpData.ipAddress,
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

    return {
      message: 'User successfully registered',
      accessToken: accessToken!,
      refreshToken: refreshToken.tokenValue,
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
}
