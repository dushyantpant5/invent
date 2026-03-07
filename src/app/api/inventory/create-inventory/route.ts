import { NextRequest, NextResponse } from 'next/server';

import { createInventorySchema } from '@/validators';
import { InventoryService } from '@/services/inventory/inventory.service';
import { setInventoryData } from '@/lib/cookies';
import { withErrorHandling, parseJsonBody, validationErrorResponse } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request);
  const validation = createInventorySchema.safeParse(body);

  if (!validation.success) return validationErrorResponse(validation.error);

  const inventory = await InventoryService.createInventory({ name: validation.data.name });

  if (!inventory?.inventoryId) {
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }

  const response = NextResponse.json({ data: inventory }, { status: 201 });
  await setInventoryData(inventory.inventoryId, response);
  return response;
});
