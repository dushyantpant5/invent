'use client';

import { requestCreateInventory, requestJoinInventory } from './inventory.api';

import { useNavigatingMutation } from '@/lib/hooks/use-navigating-mutation';
import { useInventory } from '@/hooks/useInventory';
export const useCreateInventory = () =>
  useNavigatingMutation({
    mutationFn: (name: string) => requestCreateInventory(name),
    redirectTo: '/dashboard',
    errorMessage: 'Failed to create inventory. Please try again',
  });

export const useJoinInventory = () => {
  const { setInventory } = useInventory();
  return useNavigatingMutation({
    mutationFn: (code: string) => requestJoinInventory(code),
    onSuccess(data) {
      console.log('dataa', data);
      if (data !== null) {
        setInventory(data);
      }
    },
    redirectTo: '/dashboard',
    successMessage: 'You have successfully joined the inventory',
    errorMessage: 'Invalid inventory code. Please try again',
  });
};
