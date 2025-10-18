import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { encryptInventoryData, encryptSignupPayload } from './encryption';

import { AccessTokenCookieTIme, RefreshTokenCookieTime } from '@/constants/tokens.constant';
import { Token } from '@/services/auth/token-factory/token.class';

const accessToken: string = 'accessToken';
const refreshToken: string = 'refreshToken';

const setAccessToken = async (token: string, response: NextResponse) => {
  response.cookies.set({
    name: 'accessToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AccessTokenCookieTIme, // 30 minutes
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return response;
};

const setRefreshToken = (token: string, response: NextResponse) => {
  response.cookies.set({
    name: 'refreshToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: RefreshTokenCookieTime, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return response;
};

const setTokensAtTheTimeOfSignUp = (
  accessToken: string,
  refreshToken: string,
  response: NextResponse
) => {
  clearAuthCookies(response);
  setAccessToken(accessToken, response);
  setRefreshToken(refreshToken, response);
};

const setSignUpData = async (
  signUpPayload: {
    email: string;
    password: string;
  },
  response: NextResponse
) => {
  const encrypted = await encryptSignupPayload(signUpPayload);

  response.cookies.set({
    name: 'userPayload',
    value: encrypted,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600, // 1 hour
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return response;
};

const setInventoryData = async (inventoryId: string, response: NextResponse) => {
  const encryptedInventoryData = await encryptInventoryData(inventoryId);

  response.cookies.set({
    name: 'inventoryData',
    value: encryptedInventoryData,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return response;
};

const getAccessToken = async (): Promise<Token | null> => {
  const cookieStore = await cookies();
  const accessTokenValue = cookieStore.get(accessToken);
  if (accessTokenValue) {
    return new Token(accessTokenValue.value);
  }
  return null;
};

const getRefreshToken = async (): Promise<Token | null> => {
  const cookieStore = await cookies();
  const refreshTokenValue = cookieStore.get(refreshToken);
  if (!refreshTokenValue?.value) {
    return null;
  }
  return new Token(refreshTokenValue.value);
};

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set({
    name: accessToken,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  response.cookies.set({
    name: refreshToken,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};

export {
  setTokensAtTheTimeOfSignUp,
  setAccessToken,
  setSignUpData,
  setInventoryData,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
};
