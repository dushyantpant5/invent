import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
}));

vi.mock('@/features/product/product.api', () => ({
  getAllProducts: vi.fn(),
}));

import { useProducts } from '@/features/product/product.queries';
import { queryKeys } from '@/lib/query-keys';
import { getAllProducts } from '@/features/product/product.api';

describe('features product queries', () => {
  it('registers products query with expected options', () => {
    mocks.useQuery.mockReturnValueOnce({ data: [] });

    const result = useProducts();

    expect(mocks.useQuery).toHaveBeenCalledWith({
      queryKey: queryKeys.products.all(),
      queryFn: getAllProducts,
      throwOnError: false,
    });
    expect(result).toEqual({ data: [] });
  });
});
