import { NextResponse } from 'next/server';

import AuthService from '@/services/auth/auth.service';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let body = rawBody ? JSON.parse(rawBody) : {};
    const { refreshTokenFromCookie } = body;

    const { 'user-agent': userAgent = 'unknown', 'x-forwarded-for': forwarded } =
      Object.fromEntries(request.headers);
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';

    const serviceData = await AuthService.handleRefresh({
      userAgent,
      ipAddress,
      refreshTokenFromCookie,
    });

    if (!serviceData) {
      return NextResponse.json({ error: 'Failed to refresh' }, { status: 400 });
    }

    const { message, accessToken, refreshToken } = serviceData;

    const response = NextResponse.json({ message, accessToken, refreshToken }, { status: 201 });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
