import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/uiRoutes/lib/createApiClient', () => ({
  createApiClient: vi.fn(() => ({ post: mocks.post })),
}));

vi.mock('@/services/toast/toast.service', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

import {
  requestCreateInventory,
  requestJoinInventory,
} from '@/uiRoutes/api/inventory/inventory.api';

describe('uiRoutes inventory api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates inventory and returns data payload', async () => {
    mocks.post.mockResolvedValueOnce({
      data: { inventoryId: 'inv-1', inventoryName: 'Main' },
    });

    const result = await requestCreateInventory('Main');

    expect(mocks.post).toHaveBeenCalledWith('/create-inventory', { name: 'Main' });
    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('joins inventory and shows success toast', async () => {
    mocks.post.mockResolvedValueOnce({
      data: { inventoryId: 'inv-1', inventoryName: 'Main' },
    });

    const result = await requestJoinInventory('ABC123');

    expect(mocks.post).toHaveBeenCalledWith('/join-inventory', { code: 'ABC123' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('You have Succesfully Joined Inventory');
    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('shows error toast when joining inventory fails', async () => {
    mocks.post.mockRejectedValueOnce(new Error('bad code'));

    await expect(requestJoinInventory('BAD123')).rejects.toThrow('bad code');
    expect(mocks.toastError).toHaveBeenCalledWith('Entered Inventory Code is Wrong');
  });
});
