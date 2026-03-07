import { useQuery } from '@tanstack/react-query';

import { getAllProducts } from './product.api';

import { queryKeys } from '@/lib/query-keys';

export const useProducts = () =>
  useQuery({
    queryKey: queryKeys.products.all(),
    queryFn: getAllProducts,
    throwOnError: false,
  });
