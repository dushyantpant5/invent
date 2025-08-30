'use client';
import JoinOrCreateInventory from '@/components/inventory/CreateOrJoinInventory';
import { useCreateInventory } from '@/uiRoutes/api/inventory/inventory.queries';

export default function InventoryPage() {
  const { mutate: createInventory } = useCreateInventory();
  return <JoinOrCreateInventory createInventory={createInventory} />;
}
