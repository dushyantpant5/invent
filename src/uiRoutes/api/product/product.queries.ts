import { useQuery } from '@tanstack/react-query';

import { getAllProducts } from './product.api';

export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: getAllProducts });
