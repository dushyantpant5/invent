import { createApiClient } from '@/lib/http/api-client';
import {
  TInventoryAxiosResponseDTO,
  IInventoryResponseDTO,
} from '@/types/inventory/inventory.types';

const inventoryClient = createApiClient('/inventory');

export const requestCreateInventory = async (name: string): Promise<IInventoryResponseDTO> => {
  const response = await inventoryClient.post<TInventoryAxiosResponseDTO>('/create-inventory', {
    name,
  });
  return response.data;
};

export const requestJoinInventory = async (code: string): Promise<IInventoryResponseDTO> => {
  const response = await inventoryClient.post<TInventoryAxiosResponseDTO>('/join-inventory', {
    code,
  });
  return response.data;
};
