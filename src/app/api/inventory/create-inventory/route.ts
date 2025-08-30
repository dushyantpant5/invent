import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { InventoryService } from '@/services/inventory/inventory.service';
import { setInventoryData } from '@/helpers/cookies';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const inventoryId = await InventoryService.createInventory({
      inventoryName: name,
    });

    if (!inventoryId) {
      return new Response(JSON.stringify({ error: 'Failed to create inventory' }), { status: 500 });
    }

    // Set inventory data in cookies
    const cookieStore = await cookies();
    // Delete any existing inventoryData cookie
    if (cookieStore.get('inventoryData')) {
      cookieStore.delete('inventoryData');
    }

    const response = NextResponse.json({ inventoryId }, { status: 201 });

    setInventoryData(inventoryId.inventoryId, response);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
