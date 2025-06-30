import { NextResponse } from 'next/server';

import { signUpSchema } from '@/zod-validator';
import AuthService from '@/services/auth/auth.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signUpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const { message } = await AuthService.handleSignUpUser({
      email,
      password,
    });

    const response = NextResponse.json({ message }, { status: 201 });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
