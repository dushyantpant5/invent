import { createCoreServiceClient } from '@/lib/http/api-client';
import { CProductModel } from '@/types/product/product.class';

const productClient = createCoreServiceClient('/product');

export const getAllProducts = async (): Promise<CProductModel> => {
  return productClient.get<CProductModel>('/');
};
