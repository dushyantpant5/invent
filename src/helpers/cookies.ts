import { NextResponse } from 'next/server';

const setAccessToken = async (token: string, response: NextResponse) => {
  response.cookies.set({
    name: 'accessToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 30, //30 min
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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

export { setTokensAtTheTimeOfSignUp, setAccessToken };
