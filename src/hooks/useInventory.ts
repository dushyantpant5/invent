'use client';
import { useInventoryStore } from '@/store/context/inventory';

export const useInventory = () => {
  const currentInventory = useInventoryStore((state) => state.currentInventory);

  const setInventory = useInventoryStore((state) => state.setInventory);

  const clearInventory = useInventoryStore((state) => state.clearInventory);

  return {
    currentInventory,
    setInventory,
    clearInventory,
  };
};
