import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserSession: vi.fn(),
  getInventorySession: vi.fn(),
  getUserRoleForInventory: vi.fn(),
  getCoreToken: vi.fn(),
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: {
    getUserSession: mocks.getUserSession,
  },
}));

vi.mock('@/services/inventory/inventory.service', () => ({
  InventoryService: {
    getInventorySession: mocks.getInventorySession,
    getUserRoleForInventory: mocks.getUserRoleForInventory,
  },
}));

vi.mock('@/services/auth/token-factory/token.factory', () => ({
  TokenFactory: {
    getCoreToken: mocks.getCoreToken,
  },
}));

import { GET } from '@/app/api/auth/getCoreToken/route';

describe('GET /api/auth/getCoreToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns core token payload', async () => {
    mocks.getUserSession.mockResolvedValueOnce({ id: 'u1', userEmail: 'user@example.com' });
    mocks.getInventorySession.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    mocks.getUserRoleForInventory.mockResolvedValueOnce({ role: 'admin' });
    mocks.getCoreToken.mockResolvedValueOnce('core-jwt');

    const request = new Request('http://localhost/api/auth/getCoreToken', { method: 'GET' });
    const response = await GET(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        userId: 'u1',
        inventoryId: 'inv-1',
        role: 'admin',
        authJwt: 'core-jwt',
      },
    });
    expect(mocks.getCoreToken).toHaveBeenCalledWith({
      userId: 'u1',
      inventoryId: 'inv-1',
      role: 'admin',
    });
  });
});
