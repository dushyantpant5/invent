import { createCoreServiceClient } from '../../lib/createApiClient';

import { CProductModel } from '@/types/product/product.class';

const productClient = createCoreServiceClient('/product');

export const getAllProducts = async (): Promise<CProductModel> => {
  const response = await productClient.get<CProductModel>('/');
  return response;
};
