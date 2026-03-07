import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  joinInventory: vi.fn(),
  setInventoryData: vi.fn(),
}));

vi.mock('@/services/inventory/inventory.service', () => ({
  InventoryService: {
    joinInventory: mocks.joinInventory,
  },
}));

vi.mock('@/lib/cookies', () => ({
  setInventoryData: mocks.setInventoryData,
}));

import { POST } from '@/app/api/inventory/join-inventory/route';

describe('POST /api/inventory/join-inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setInventoryData.mockResolvedValue(undefined);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new Request('http://localhost/api/inventory/join-inventory', {
      method: 'POST',
      body: JSON.stringify({ code: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns 404 when no inventory exists for code', async () => {
    mocks.joinInventory.mockResolvedValueOnce(null);
    const request = new Request('http://localhost/api/inventory/join-inventory', {
      method: 'POST',
      body: JSON.stringify({ code: 'BAD123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(404);
  });

  it('returns 200 and stores inventory cookie', async () => {
    mocks.joinInventory.mockResolvedValueOnce({ inventoryId: 'inv-1', inventoryName: 'Main' });
    const request = new Request('http://localhost/api/inventory/join-inventory', {
      method: 'POST',
      body: JSON.stringify({ code: 'ABC123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { inventoryId: 'inv-1', inventoryName: 'Main' } });
    expect(mocks.setInventoryData).toHaveBeenCalledWith('inv-1', expect.any(Response));
  });
});
