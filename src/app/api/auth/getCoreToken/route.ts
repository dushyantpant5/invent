import { NextRequest, NextResponse } from 'next/server';

import AuthService from '@/services/auth/auth.service';
import { InventoryService } from '@/services/inventory/inventory.service';
import { TokenFactory } from '@/services/auth/token-factory/token.factory';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const userData = await AuthService.getUserSession();
  const inventoryData = await InventoryService.getInventorySession();
  const roleData = await InventoryService.getUserRoleForInventory({
    userId: userData.id,
    inventoryId: inventoryData.inventoryId,
  });

  const tokenPayload = {
    userId: userData.id,
    inventoryId: inventoryData.inventoryId,
    role: roleData.role,
  };

  const authJwt = await TokenFactory.getCoreToken(tokenPayload);

  return NextResponse.json({ data: { ...tokenPayload, authJwt } }, { status: 200 });
});
