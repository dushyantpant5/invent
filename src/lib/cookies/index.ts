import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { encryptInventoryData, encryptSignupPayload } from '@/lib/crypto/encryption';
import { AccessTokenCookieTIme, RefreshTokenCookieTime } from '@/constants/tokens.constant';
import { Token } from '@/services/auth/token-factory/token.class';

// --- Constants ---
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// --- Shared cookie base options ---
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/' as const,
    sameSite: 'lax' as const,
  };
}

// --- Setters ---

export const setAccessToken = (token: string, response: NextResponse): NextResponse => {
  response.cookies.set({
    name: ACCESS_TOKEN_KEY,
    value: token,
    maxAge: AccessTokenCookieTIme,
    ...baseCookieOptions(),
  });
  return response;
};

export const setRefreshToken = (token: string, response: NextResponse): NextResponse => {
  response.cookies.set({
    name: REFRESH_TOKEN_KEY,
    value: token,
    maxAge: RefreshTokenCookieTime,
    ...baseCookieOptions(),
  });
  return response;
};

export const setTokensAtTheTimeOfSignUp = (
  accessToken: string,
  refreshToken: string,
  response: NextResponse
): void => {
  clearAuthCookies(response);
  setAccessToken(accessToken, response);
  setRefreshToken(refreshToken, response);
};

export const setSignUpData = async (
  signUpPayload: { email: string; password: string },
  response: NextResponse
): Promise<NextResponse> => {
  const encrypted = await encryptSignupPayload(signUpPayload);
  response.cookies.set({
    name: 'userPayload',
    value: encrypted,
    maxAge: 3600,
    ...baseCookieOptions(),
  });
  return response;
};

export const setInventoryData = async (
  inventoryId: string,
  response: NextResponse
): Promise<NextResponse> => {
  const encryptedInventoryData = await encryptInventoryData(inventoryId);
  response.cookies.set({
    name: 'inventoryData',
    value: encryptedInventoryData,
    maxAge: 60 * 60 * 24 * 7,
    ...baseCookieOptions(),
  });
  return response;
};

// --- Getters ---

export const getAccessToken = async (): Promise<Token | null> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
  return value ? new Token(value) : null;
};

export const getRefreshToken = async (): Promise<Token | null> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
  return value ? new Token(value) : null;
};

// --- Clearers ---

export const clearAuthCookies = (response: NextResponse): void => {
  const expiredOptions = { ...baseCookieOptions(), maxAge: 0, expires: new Date(0), value: '' };
  response.cookies.set({ name: ACCESS_TOKEN_KEY, ...expiredOptions });
  response.cookies.set({ name: REFRESH_TOKEN_KEY, ...expiredOptions });
};
