import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { signUpSchema } from '@/zod-validator';
import AuthService from '@/services/auth/auth.service';
import { setSignUpData } from '@/helpers/cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Raw request body:', body);
    const validation = signUpSchema.safeParse(body);

    if (!validation.success) {
      console.error('Signup Validation Error:', validation.error.format());

      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const { message, otp } = await AuthService.handleRequestSignUp({
      email,
      password,
    });

    const cookieStore = await cookies();

    if (cookieStore.get('userPayload')) {
      cookieStore.delete('userPayload');
    }

    const response = NextResponse.json({ message, otp }, { status: 201 });

    setSignUpData({ email, password }, response);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    console.error('Signup Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
