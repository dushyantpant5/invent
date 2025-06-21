import { NextResponse } from 'next/server';

import { signInSchema } from '@/zod-validator';
import AuthService from '@/services/auth/auth.service';
import { setTokensAtTheTimeOfSignUp } from '@/helpers/cookies';

export async function POST(request: Request) {
  try {
    const { 'user-agent': userAgent = 'unknown', 'x-forwarded-for': forwarded } =
      Object.fromEntries(request.headers);
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';

    const body = await request.json();
    const validation = signInSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const { message, accessToken, refreshToken } = await AuthService.handleSignInUser({
      email,
      password,
      userAgent,
      ipAddress,
    });

    const response = NextResponse.json({ message }, { status: 201 });
    setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
