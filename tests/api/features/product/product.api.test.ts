import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/lib/http/api-client', () => ({
  createCoreServiceClient: vi.fn(() => ({ get: mocks.get })),
}));

import { getAllProducts } from '@/features/product/product.api';

describe('features product api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all products from core service', async () => {
    mocks.get.mockResolvedValueOnce({ products: [{ id: 'p1' }] });

    const result = await getAllProducts();

    expect(mocks.get).toHaveBeenCalledWith('/');
    expect(result).toEqual({ products: [{ id: 'p1' }] });
  });
});
