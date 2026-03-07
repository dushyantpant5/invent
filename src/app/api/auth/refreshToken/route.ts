import { NextRequest, NextResponse } from 'next/server';

import { refreshTokenSchema } from '@/validators';
import AuthService from '@/services/auth/auth.service';
import {
  withErrorHandling,
  extractRequestMeta,
  parseJsonBody,
  validationErrorResponse,
} from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request);
  const validation = refreshTokenSchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  const { userAgent, ipAddress } = extractRequestMeta(request);
  const { refreshTokenFromCookie } = validation.data;

  const result = await AuthService.handleRefresh({ refreshTokenFromCookie, userAgent, ipAddress });

  if (!result) {
    return NextResponse.json({ error: 'Session expired. Please sign in again' }, { status: 401 });
  }

  const { message, accessToken, refreshToken } = result;
  return NextResponse.json({ message, accessToken, refreshToken }, { status: 200 });
});
