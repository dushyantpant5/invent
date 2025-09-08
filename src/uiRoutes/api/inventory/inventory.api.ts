import { createApiClient } from '@/uiRoutes/lib/createApiClient';
import {
  TInventoryAxiosResponseDTO,
  IInventoryResponseDTO,
} from '@/types/inventory/inventory.types';
import ToastService from '@/services/toast/toast.service';
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

export const requestJoinInventory = async (code: string): Promise<IInventoryResponseDTO> => {
  const data = { code };
  try {
    const response = await inventoryClient.post<TInventoryAxiosResponseDTO>(
      '/join-inventory',
      data
    );
    ToastService.success('You have Succesfully Joined Inventory');
    return response.data;
  } catch (error) {
    ToastService.error('Entered Inventory Code is Wrong');
    console.error(error);
    throw error;
  }
};
