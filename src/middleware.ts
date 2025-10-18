import { NextRequest, NextResponse } from 'next/server';

import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setTokensAtTheTimeOfSignUp,
} from './helpers/cookies';
import { Token } from './services/auth/token-factory/token.class';
import { TokenFactory } from './services/auth/token-factory/token.factory';

export async function middleware(request: NextRequest) {
  try {
    const accessTokenRaw: Token | null = await getAccessToken();
    const refreshTokenRaw: Token | null = await getRefreshToken();

    // No tokens at all
    if (!accessTokenRaw && !refreshTokenRaw) {
      const response = redirectToSignIn(request);
      clearAuthCookies(response);

      return response;
    }

    // No access but refresh exists
    if (!accessTokenRaw && refreshTokenRaw) {
      return await tryRefreshToken(request, refreshTokenRaw.tokenValue);
    }

    // Access token present
    if (accessTokenRaw) {
      const decodedToken = await TokenFactory.verifyAccessToken(accessTokenRaw.tokenValue);

      if (decodedToken) {
        return NextResponse.next();
      }

      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }
  } catch {
    const returnResponse = redirectToSignIn(request);
    clearAuthCookies(returnResponse);
    return returnResponse;
  }
}

export const config = {
  matcher: ['/dashboard', '/inventory'],
};

function redirectToSignIn(request: NextRequest) {
  const callback = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
  const callBackUrl = new URL(`/auth/signIn?returnTo=${callback}`, request.nextUrl.origin);
  return NextResponse.redirect(callBackUrl);
}

export async function tryRefreshToken(request: NextRequest, refreshTokenValue: string) {
  try {
    const refreshApiUrl = new URL('/api/auth/refreshToken', request.nextUrl.origin).toString();
    const fetchResp = await fetch(refreshApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshTokenFromCookie: refreshTokenValue }),
    });

    if (!fetchResp.ok) {
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    const data = await fetchResp.json();
    const { accessToken, refreshToken } = data ?? {};

    if (!accessToken || !refreshToken) {
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    const response = NextResponse.next();
    setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
    return response;
  } catch {
    console.error(' Error during refresh:');

    const returnResponse = redirectToSignIn(request);
    clearAuthCookies(returnResponse);
    return returnResponse;
  }
}
