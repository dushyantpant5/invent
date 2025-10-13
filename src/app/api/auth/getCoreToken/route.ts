import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

import AuthService from '@/services/auth/auth.service';
import { InventoryService } from '@/services/inventory/inventory.service';

export async function GET() {
  try {
    const userData = await AuthService.getUserSession();
    if (!userData) throw Error('No User Data found');

    const inventoryData = await InventoryService.getInventorySession();
    if (!inventoryData) throw Error('No Inventory Data found');

    const roleData = await InventoryService.getUserRoleForInventory({
      userId: userData.id,
      inventoryId: inventoryData.inventoryId,
    });
    if (!roleData) throw Error('No Role for this User found');

    const secretKey: string | undefined = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }
    const tokenPayload = {
      userId: userData.id,
      inventoryId: inventoryData.inventoryId,
      role: roleData.role,
    };

    const tokenJwt = jwt.sign(tokenPayload, secretKey);

    const responsePayload = {
      userId: userData.id,
      inventoryId: inventoryData.inventoryId,
      role: roleData.role,
      authJwt: process.env.NODE_ENV === 'development' ? tokenJwt : '',
    };

    const response: NextResponse = NextResponse.json({ data: responsePayload, status: 201 });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    const statusCode = error instanceof Error ? 400 : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
