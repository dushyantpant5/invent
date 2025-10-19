// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

import { clearAuthCookies, setTokensAtTheTimeOfSignUp } from './helpers/cookies';
import { TokenFactory } from './services/auth/token-factory/token.factory';

/**
 * DEBUG VERSION - logs a lot. Remove once debugging is complete.
 */

/** Mask tokens for logs */
function mask(token?: string | null) {
  if (!token) return '<null>';
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

/** Small helper to safely stringify headers or other objects */
function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
}

export async function middleware(request: NextRequest) {
  // Top-level runtime/runtime-env checks
  try {
    console.log('---- MIDDLEWARE START ----');
    console.log('runtime checks:', {
      nextUrl_origin: request.nextUrl.origin,
      nextUrl_href: request.nextUrl.href,
      nextUrl_pathname: request.nextUrl.pathname,
      nextUrl_search: request.nextUrl.search,
      host: request.nextUrl.host,
      method: request.method,
    });

    // Log Vercel & relevant envs that commonly impact runtime behavior
    console.log('env checks:', {
      VERCEL: process.env.VERCEL ?? '<not-set>',
      VERCEL_URL: process.env.VERCEL_URL ?? '<not-set>',
      VERCEL_ENV: process.env.VERCEL_ENV ?? '<not-set>',
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '<not-set>',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? '<not-set>',
      NODE_ENV: process.env.NODE_ENV ?? '<not-set>',
    });

    // Log whether "process" and "globalThis" are present (Edge vs Node диагностик)
    console.log('globals:', {
      has_process: typeof process !== 'undefined',
      has_globalThis: typeof globalThis !== 'undefined',
      typeof_globalThis_crypto: typeof (globalThis as any)?.crypto,
    });

    // Log incoming request headers (may be large) — careful, will log auth headers
    try {
      const headersObj: Record<string, string> = {};
      for (const [k, v] of request.headers) {
        headersObj[k] = v;
      }
      console.log('request.headers:', safeStringify(headersObj));
    } catch (e) {
      console.error('error reading request.headers', e);
    }

    // Log cookie keys visible to middleware
    try {
      const cookieKeys = request.cookies.getAll().map((c) => c.name);
      console.log('request.cookies.keys:', cookieKeys);
    } catch (e) {
      console.error('error reading cookies.keys', e);
    }

    const accessTokenRaw = request.cookies.get('accessToken')?.value ?? null;
    const refreshTokenRaw = request.cookies.get('refreshToken')?.value ?? null;

    console.log('tokens (masked):', {
      access: mask(accessTokenRaw),
      refresh: mask(refreshTokenRaw),
    });

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
        console.log(
          'TokenFactory.verifyAccessToken returned:',
          !!decodedToken,
          decodedToken ?? '<no-decoded>'
        );
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
        // If verification throws, assume invalid token and redirect
        const returnResponse = redirectToSignIn(request);
        clearAuthCookies(returnResponse);
        return returnResponse;
      }
    }
  } catch (topErr) {
    console.error('Unhandled exception in middleware top-level try:', topErr);
    const returnResponse = redirectToSignIn(request);
    clearAuthCookies(returnResponse);
    return returnResponse;
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
    // fallback redirect
    return NextResponse.redirect('/auth/signIn');
  }
}

export async function tryRefreshToken(request: NextRequest, refreshTokenValue: string) {
  console.log('---- tryRefreshToken START ----');
  console.log('masked refresh token:', mask(refreshTokenValue));

  try {
    // Determine base URL: favor explicit env var (if set in Vercel), else use request origin
    const envBase =
      typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
    const base = envBase?.replace(/\/$/, '') ?? request.nextUrl.origin;
    const refreshApiUrl = new URL('/api/auth/refreshToken', base).toString();

    console.log('refreshApiUrl used:', refreshApiUrl);
    console.log('envBase:', envBase ?? '<not-set>');
    console.log('request.nextUrl.origin:', request.nextUrl.origin);

    // Add a distinctive header to correlate API logs
    const debugHeaderValue = `middleware-refresh-${Date.now()}`;

    const start = Date.now();
    const fetchResp = await fetch(refreshApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-from-middleware': debugHeaderValue,
        // echo the deployment host info to the server
        'x-deployment-host': request.nextUrl.host,
      },
      body: JSON.stringify({ refreshTokenFromCookie: refreshTokenValue }),
      cache: 'no-store',
    });
    const durationMs = Date.now() - start;
    console.log('fetch result:', { status: fetchResp.status, ok: fetchResp.ok, durationMs });

    // Attempt to log raw response text (trimmed)
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
      // Optionally, log more diagnosis: common HTTP statuses
      if (fetchResp.status === 404)
        console.warn('Refresh endpoint returned 404 - verify route exists.');
      if (fetchResp.status === 500)
        console.warn('Refresh endpoint returned 500 - check server logs for exceptions.');
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    // Try parse JSON
    let data: any = null;
    try {
      data = await fetchResp.json();
      console.log('refreshResp.json:', safeStringify(data));
    } catch (e) {
      console.error('Failed to parse JSON from refresh response. rawText logged above.', e);
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    const { accessToken, refreshToken } = data ?? {};
    console.log('tokens returned from refresh (masked):', {
      access: mask(accessToken),
      refresh: mask(refreshToken),
    });

    if (!accessToken || !refreshToken) {
      console.warn('Refresh response did not include tokens. Redirecting and clearing cookies.');
      const returnResponse = redirectToSignIn(request);
      clearAuthCookies(returnResponse);
      return returnResponse;
    }

    // Optional: verify returned access token (log any failure)
    try {
      const verified = await TokenFactory.verifyAccessToken(accessToken);
      console.log('verifyAccessToken on returned token ->', !!verified);
    } catch (verifyErr) {
      console.error('verifyAccessToken failed for returned accessToken:', verifyErr);
      // continue — we still set cookies, but this log will help detect incompatibilities
    }

    const response = NextResponse.next();

    // Log what setTokensAtTheTimeOfSignUp sets (if possible)
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
    // Also add a debug header so you can inspect response headers from middleware (for debugging only)
    response.headers.set('x-middleware-debug', debugHeaderValue);

    return response;
  } catch (err) {
    console.error('Error during tryRefreshToken top-level catch:', err);
    const returnResponse = redirectToSignIn(request);
    clearAuthCookies(returnResponse);
    return returnResponse;
  }
}
