import { NextResponse, NextRequest } from 'next/server';

import { getAccessToken, getRefreshToken, setAccessToken } from './helpers/cookies';
import AuthService from './services/auth/auth.service';
import { TokenFactory } from './services/auth/token-factory/token.factory';

interface IAccessTokenPayload {
  id: string;
  email: string;
}
export async function middleware(request: NextRequest) {
  console.log('Middleware triggered for protected route');

  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (!accessToken && !refreshToken) {
    const callBackURL = new URL('/auth/signIn', request.nextUrl.origin);
    return NextResponse.redirect(callBackURL);
  }

  if (!accessToken && refreshToken) {
    try {
      const hashedRefreshToken = await TokenFactory.getRefreshTokenHash(refreshToken.tokenValue);
      if (hashedRefreshToken) {
        console.log();
        const userId = await AuthService.getUserIdFromRefreshToken(hashedRefreshToken.tokenValue);
        if (userId) {
          const userMail = await AuthService.getEmailFromUserId(userId);
          if (userMail) {
            const payload: IAccessTokenPayload = {
              id: userId,
              email: userMail.email,
            };

            // generate token
            const accessToken = TokenFactory.getAccessToken(payload);
            if (accessToken) {
              const response = NextResponse.next();
              await setAccessToken(accessToken.tokenValue, response);
            } else {
              console.log('Failed to get Access Token');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during token refresh', error);
    }
  }
}

export const config = {
  matcher: ['/dashboard', '/inventory'],
};
