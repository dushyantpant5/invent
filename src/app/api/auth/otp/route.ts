import { NextResponse } from 'next/server';

import AuthService from '@/services/auth/auth.service';
import { setTokensAtTheTimeOfSignUp } from '@/helpers/cookies';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { otpHash, email, expiresAt, createdAt, used } = body;

    const { message, data } = await AuthService.handleOtpinSignUp({
      otpHash,
      email,
      expiresAt,
      createdAt,
      used,
    });
    const response = NextResponse.json({ message, data }, { status: 201 });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { message, data } = await AuthService.getOtpDuringSignUp(id!);

    const response = NextResponse.json({ message, data }, { status: 201 });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function PATCH(request: Request) {
  try {
    const { 'user-agent': userAgent = 'unknown', 'x-forwarded-for': forwarded } =
      Object.fromEntries(request.headers);
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';

    const body = await request.json();
    const { email, idd } = body;

    const { message, accessToken, refreshToken } = await AuthService.updateUserAfterOtpVerification(
      {
        email,
        idd,
        userAgent,
        ipAddress,
      }
    );
    const response = NextResponse.json({ message }, { status: 201 });
    setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
