import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Auth flow DTOs
// ---------------------------------------------------------------------------

export interface ISignUpDto {
  email: string;
  password: string;
}

export interface ISignUpUserDTO {
  email: string;
  password: string;
}

export interface ISignInUserDTO {
  email: string;
  password: string;
  userAgent: string;
  ipAddress: string;
}

export interface ISignInUserResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface IOtpVerificationDTO {
  otp: string;
}

export interface ICompleteSignUpDTO {
  userAgent: string;
  ipAddress: string;
}

export interface IRefreshTokenRequestDTO {
  refreshTokenFromCookie: string;
  userAgent: string;
  ipAddress: string;
}

export interface IRefreshTokenResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Session DTOs
// ---------------------------------------------------------------------------

export interface ICreateSessionDTO {
  userId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  tx?: Prisma.TransactionClient;
}
