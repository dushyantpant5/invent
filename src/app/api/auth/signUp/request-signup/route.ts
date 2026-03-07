import { NextRequest, NextResponse } from 'next/server';

import { signUpSchema } from '@/validators';
import AuthService from '@/services/auth/auth.service';
import { setSignUpData } from '@/lib/cookies';
import { withErrorHandling, parseJsonBody, validationErrorResponse } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request);
  const validation = signUpSchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  const { email, password } = validation.data;
  const { message, otp } = await AuthService.handleRequestSignUp({ email, password });

  const response = NextResponse.json({ message, otp }, { status: 201 });
  await setSignUpData({ email, password }, response);
  return response;
});
