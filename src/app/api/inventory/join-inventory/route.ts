import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { InventoryService } from '@/services/inventory/inventory.service';
import { setInventoryData } from '@/helpers/cookies';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const joinedInventory = await InventoryService.joinInventory({ code: code });
    if (!joinedInventory?.inventoryId) {
      return new Response(JSON.stringify({ error: 'Failed to Join Inventory' }), { status: 400 });
    }
    const cookieStore = await cookies();
    if (cookieStore.get('inventoryData')) {
      cookieStore.delete('inventoryData');
    }

    const response = NextResponse.json({ data: joinedInventory, status: 201 });

    await setInventoryData(joinedInventory.inventoryId, response);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
