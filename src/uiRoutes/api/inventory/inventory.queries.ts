'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { requestCreateInventory } from './inventory.api';

export const useCreateInventory = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: async (name: string) => requestCreateInventory(name),
    onSuccess: (data) => {
      console.log(data);
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      console.error('Create Inventory Failed', error.message);
    },
  });
};
