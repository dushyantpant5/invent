'use client';

import { useMutation } from "@tanstack/react-query";

export const useCreateInventory = () => {
    return useMutation({
        mutationFn: async (name: string) => {
            const response = await fetch('/api/inventory/create-inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create inventory');
            }

            const data = await response.json();
            return data.inventoryId;
        }
}};
