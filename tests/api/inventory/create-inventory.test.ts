import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createInventory: vi.fn(),
  setInventoryData: vi.fn(),
}));

vi.mock('@/services/inventory/inventory.service', () => ({
  InventoryService: {
    createInventory: mocks.createInventory,
  },
}));

vi.mock('@/lib/cookies', () => ({
  setInventoryData: mocks.setInventoryData,
}));

import { POST } from '@/app/api/inventory/create-inventory/route';

describe('POST /api/inventory/create-inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setInventoryData.mockResolvedValue(undefined);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/inventory/create-inventory', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 500 when service does not return inventory id', async () => {
    mocks.createInventory.mockResolvedValueOnce(null);
    const request = new Request('http://localhost/api/inventory/create-inventory', {
      method: 'POST',
      body: JSON.stringify({ name: 'Main' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(500);
  });

  it('returns 201 and stores inventory cookie', async () => {
    mocks.createInventory.mockResolvedValueOnce({ inventoryId: 'inv-1', inventoryName: 'Main' });
    const request = new Request('http://localhost/api/inventory/create-inventory', {
      method: 'POST',
      body: JSON.stringify({ name: 'Main' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ data: { inventoryId: 'inv-1', inventoryName: 'Main' } });
    expect(mocks.setInventoryData).toHaveBeenCalledWith('inv-1', expect.any(Response));
  });
});
