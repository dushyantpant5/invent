import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = join(process.cwd(), 'openapi', 'openapi.json');

  let spec: unknown;
  try {
    spec = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return NextResponse.json(
      { error: 'OpenAPI spec not found. Run `npm run generate:openapi` first.' },
      { status: 404 }
    );
  }

  return NextResponse.json(spec);
});
