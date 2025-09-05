import { createApiClient } from '@/uiRoutes/lib/createApiClient';
import {
  TInventoryAxiosResponseDTO,
  IInventoryResponseDTO,
} from '@/types/inventory/inventory.types';
const inventoryClient = createApiClient('/inventory');

export const requestCreateInventory = async (name: string): Promise<IInventoryResponseDTO> => {
  const data = { name };
  try {
    const response = await inventoryClient.post<TInventoryAxiosResponseDTO>(
      '/create-inventory',
      data
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
