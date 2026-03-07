import { NextRequest, NextResponse } from 'next/server';

import { otpVerificationSchema } from '@/validators';
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
  const validation = otpVerificationSchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  // handleVerifyOtp throws ServiceError on failure — no status check needed
  await AuthService.handleVerifyOtp({ otp: validation.data.otp });

  const { message, accessToken, refreshToken } = await AuthService.handleCompleteSignUp({
    userAgent,
    ipAddress,
  });

  const response = NextResponse.json({ message }, { status: 201 });
  setTokensAtTheTimeOfSignUp(accessToken, refreshToken, response);
  return response;
});
