import { CProductModel, IProductModel } from '../../../types/product';
import { createApiClient } from '../../lib/createApiClient';

const productClient = createApiClient('/product');

export const getAllProducts = async (): Promise<CProductModel> => {
  const response = await productClient.get<CProductModel>('/');
  return response;
};

export const getProductById = async (id: string): Promise<CProductModel> => {
  console.log('Fetching product with ID:', id);
  const data = await productClient.get<IProductModel>(`/${id}`);
  const productClass = new CProductModel(
    data.id,
    data.name,
    data.price,
    data.description,
    data.inStock
  );
  return productClass;
};
