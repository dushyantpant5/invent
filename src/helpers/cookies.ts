import { NextResponse } from 'next/server';

import { encryptSignupPayload } from './encryption';

import { AccessTokenCookieTIme, RefreshTokenCookieTime } from '@/constants/tokens.constant';

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
  setAccessToken(accessToken, response);
  setRefreshToken(refreshToken, response);
};

const setSignUpData = (
  signUpPayload: {
    email: string;
    password: string;
  },
  response: NextResponse
) => {
  const encrypted = encryptSignupPayload(signUpPayload);

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

export { setTokensAtTheTimeOfSignUp, setAccessToken, setSignUpData };
