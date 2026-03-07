import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
}));

vi.mock('@/uiRoutes/api/product/product.api', () => ({
  getAllProducts: vi.fn(),
}));

import { useProducts } from '@/uiRoutes/api/product/product.queries';
import { getAllProducts } from '@/uiRoutes/api/product/product.api';

describe('uiRoutes product queries', () => {
  it('configures product query', () => {
    mocks.useQuery.mockReturnValueOnce({ data: [] });

    const result = useProducts();

    expect(mocks.useQuery).toHaveBeenCalledWith({
      queryKey: ['products'],
      queryFn: getAllProducts,
    });
    expect(result).toEqual({ data: [] });
  });
});
