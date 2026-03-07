'use client';

import { requestCreateInventory, requestJoinInventory } from './inventory.api';

import { useNavigatingMutation } from '@/lib/hooks/use-navigating-mutation';

export const useCreateInventory = () =>
  useNavigatingMutation({
    mutationFn: (name: string) => requestCreateInventory(name),
    redirectTo: '/dashboard',
    errorMessage: 'Failed to create inventory. Please try again',
  });

export const useJoinInventory = () =>
  useNavigatingMutation({
    mutationFn: (code: string) => requestJoinInventory(code),
    redirectTo: '/dashboard',
    successMessage: 'You have successfully joined the inventory',
    errorMessage: 'Invalid inventory code. Please try again',
  });
