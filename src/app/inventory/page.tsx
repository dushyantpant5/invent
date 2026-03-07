'use client';
import JoinOrCreateInventory from '@/components/inventory/CreateOrJoinInventory';
import { useCreateInventory, useJoinInventory } from '@/features/inventory/inventory.queries';

export default function InventoryPage() {
  const { mutate: createInventory } = useCreateInventory();
  const { mutate: joinInventory } = useJoinInventory();
  return <JoinOrCreateInventory createInventory={createInventory} joinInventory={joinInventory} />;
}
