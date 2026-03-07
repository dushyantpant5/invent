// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

import { clearAuthCookies, setTokensAtTheTimeOfSignUp } from './lib/cookies';
import { TokenFactory } from './services/auth/token-factory/token.factory';

export async function middleware(request: NextRequest) {
  const accessTokenRaw = request.cookies.get('accessToken')?.value ?? null;
  const refreshTokenRaw = request.cookies.get('refreshToken')?.value ?? null;

  // No tokens at all
  if (!accessTokenRaw && !refreshTokenRaw) {
    console.log('-> No access & no refresh token present. Redirecting to sign-in.');
    const response = redirectToSignIn(request);
    clearAuthCookies(response);
    return response;
  }

  // No access but refresh exists
  if (!accessTokenRaw && refreshTokenRaw) {
    console.log('-> Access missing but refresh present. Entering refresh flow.');
    return await tryRefreshToken(request, refreshTokenRaw);
  }

  // Access token present
  if (accessTokenRaw) {
    console.log('-> Access token found. Verifying via TokenFactory.verifyAccessToken');
    try {
      const decodedToken = await TokenFactory.verifyAccessToken(accessTokenRaw);

      if (decodedToken) {
        console.log('-> Access token valid. Passing through (NextResponse.next()).');
        return NextResponse.next();
      }
      console.log('-> Access token invalid/expired. Clearing cookies and redirecting.');
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    } catch (verifyErr) {
      console.error('Exception in TokenFactory.verifyAccessToken:', verifyErr);
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }
  }
}

export const config = {
  matcher: ['/dashboard', '/inventory'],
};

function redirectToSignIn(request: NextRequest) {
  try {
    const callback = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    const callBackUrl = new URL(`/auth/signIn?returnTo=${callback}`, request.nextUrl.origin);
    console.log('redirectToSignIn ->', callBackUrl.toString());
    return NextResponse.redirect(callBackUrl);
  } catch (e) {
    console.error('redirectToSignIn error', e);
    return NextResponse.redirect('/auth/signIn');
  }
}

export async function tryRefreshToken(request: NextRequest, refreshTokenValue: string) {
  try {
    const envBase =
      typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
    const base = envBase?.replace(/\/$/, '') ?? request.nextUrl.origin;
    const refreshApiUrl = new URL('/api/auth/refreshToken', base).toString();

    const fetchResp = await fetch(refreshApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-deployment-host': request.nextUrl.host,
      },
      body: JSON.stringify({ refreshTokenFromCookie: refreshTokenValue }),
      cache: 'no-store',
    });

    let rawText = '<no-body>';
    try {
      rawText = await fetchResp.clone().text();
      console.log('refreshResp.rawText (first 2000 chars):', rawText.slice(0, 2000));
    } catch (e) {
      console.error('error reading fetchResp text clone:', e);
    }

    if (!fetchResp.ok) {
      console.warn(
        'Refresh endpoint returned non-ok. Clearing cookies and redirecting to sign-in.'
      );
      if (fetchResp.status === 404)
        console.warn('Refresh endpoint returned 404 - verify route exists.');
      if (fetchResp.status === 500)
        console.warn('Refresh endpoint returned 500 - check server logs for exceptions.');
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    // Try parse JSON
    let data = null;
    try {
      data = await fetchResp.json();
    } catch (e) {
      console.error('Failed to parse JSON from refresh response. rawText logged above.', e);
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    const { accessToken, refreshToken } = data ?? {};

    if (!accessToken || !refreshToken) {
      console.warn('Refresh response did not include tokens. Redirecting and clearing cookies.');
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    try {
      const verified = await TokenFactory.verifyAccessToken(accessToken);
      console.log('verifyAccessToken on returned token ->', !!verified);
    } catch (verifyErr) {
      console.error('verifyAccessToken failed for returned accessToken:', verifyErr);
    }

    const response = NextResponse.next();

    try {
      setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
      console.log(
        'setTokensAtTheTimeOfSignUp called successfully. Look for Set-Cookie headers in server response logs or browser devtools.'
      );
    } catch (setErr) {
      console.error('Error while setting tokens into response:', setErr);
      // still return redirect to sign-in as fallback
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    console.log('tryRefreshToken successful -> returning NextResponse.next()');

    return response;
  } catch (err) {
    console.error('Error during tryRefreshToken top-level catch:', err);
    const returnResponse = redirectToSignIn(request);
    clearAuthCookies(returnResponse);
    return returnResponse;
  }
}
