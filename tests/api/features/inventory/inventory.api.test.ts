import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/lib/http/api-client', () => ({
  createApiClient: vi.fn(() => ({ post: mocks.post })),
}));

import { requestCreateInventory, requestJoinInventory } from '@/features/inventory/inventory.api';

describe('features inventory api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed create inventory data', async () => {
    mocks.post.mockResolvedValueOnce({
      data: { inventoryId: 'inv-1', inventoryName: 'Main' },
    });

    const result = await requestCreateInventory('Main');

    expect(mocks.post).toHaveBeenCalledWith('/create-inventory', { name: 'Main' });
    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('returns parsed join inventory data', async () => {
    mocks.post.mockResolvedValueOnce({
      data: { inventoryId: 'inv-2', inventoryName: 'Shared' },
    });

    const result = await requestJoinInventory('ABCD12');

    expect(mocks.post).toHaveBeenCalledWith('/join-inventory', { code: 'ABCD12' });
    expect(result).toEqual({ inventoryId: 'inv-2', inventoryName: 'Shared' });
  });
});
