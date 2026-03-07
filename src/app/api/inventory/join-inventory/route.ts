import { NextRequest, NextResponse } from 'next/server';

import { joinInventorySchema } from '@/validators';
import { InventoryService } from '@/services/inventory/inventory.service';
import { setInventoryData } from '@/lib/cookies';
import { withErrorHandling, parseJsonBody, validationErrorResponse } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request);
  const validation = joinInventorySchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  const inventory = await InventoryService.joinInventory({ code: validation.data.code });

  if (!inventory) {
    return NextResponse.json({ error: 'No inventory found with this code' }, { status: 404 });
  }

  const response = NextResponse.json({ data: inventory }, { status: 200 });
  await setInventoryData(inventory.inventoryId, response);
  return response;
});
