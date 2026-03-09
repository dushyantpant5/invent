import { create } from 'zustand';

import { InventoryState } from './inventtory.types';

export const useInventoryStore = create<InventoryState>((set) => ({
  currentInventory: null,
  setInventory: (inventory) =>
    set({
      currentInventory: inventory,
    }),

  clearInventory: () =>
    set({
      currentInventory: null,
    }),
}));
