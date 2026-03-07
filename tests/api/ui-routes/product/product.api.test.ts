import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/uiRoutes/lib/createApiClient', () => ({
  createCoreServiceClient: vi.fn(() => ({ get: mocks.get })),
}));

import { getAllProducts } from '@/uiRoutes/api/product/product.api';

describe('uiRoutes product api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests all products using core service client', async () => {
    mocks.get.mockResolvedValueOnce({ products: [{ id: 'p-1' }] });

    const result = await getAllProducts();

    expect(mocks.get).toHaveBeenCalledWith('/');
    expect(result).toEqual({ products: [{ id: 'p-1' }] });
  });
});
