export interface Inventory {
  inventoryId: string;
  inventoryName: string;
}

export interface InventoryState {
  currentInventory: Inventory | null;
  setInventory: (inventory: Inventory) => void;
  clearInventory: () => void;
}
