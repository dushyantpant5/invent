import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: mocks.useMutation,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/uiRoutes/api/inventory/inventory.api', () => ({
  requestCreateInventory: vi.fn(),
  requestJoinInventory: vi.fn(),
}));

import { useCreateInventory, useJoinInventory } from '@/uiRoutes/api/inventory/inventory.queries';
import {
  requestCreateInventory,
  requestJoinInventory,
} from '@/uiRoutes/api/inventory/inventory.api';

describe('uiRoutes inventory queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockImplementation((config) => config);
  });

  it('builds create inventory mutation config', async () => {
    const config = useCreateInventory();

    await config.mutationFn('Main');
    expect(requestCreateInventory).toHaveBeenCalledWith('Main');

    config.onSuccess({ inventoryId: 'inv-1' });
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('builds join inventory mutation config', async () => {
    const config = useJoinInventory();

    await config.mutationFn('ABC123');
    expect(requestJoinInventory).toHaveBeenCalledWith('ABC123');

    config.onSuccess({ inventoryId: 'inv-1' });
    expect(mocks.push).toHaveBeenCalledWith('/dashboard');
  });
});
