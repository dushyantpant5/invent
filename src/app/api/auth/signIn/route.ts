import { NextRequest, NextResponse } from 'next/server';

import { signInSchema } from '@/validators';
import AuthService from '@/services/auth/auth.service';
import { setTokensAtTheTimeOfSignUp } from '@/lib/cookies';
import {
  withErrorHandling,
  extractRequestMeta,
  parseJsonBody,
  validationErrorResponse,
} from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { userAgent, ipAddress } = extractRequestMeta(request);
  const body = await parseJsonBody(request);
  const validation = signInSchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  const { email, password } = validation.data;
  const { message, accessToken, refreshToken } = await AuthService.handleSignInUser({
    email,
    password,
    userAgent,
    ipAddress,
  });

  const response = NextResponse.json({ message }, { status: 200 });
  setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
  return response;
});
