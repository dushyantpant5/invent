import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useNavigatingMutation: vi.fn(),
}));

vi.mock('@/lib/hooks/use-navigating-mutation', () => ({
  useNavigatingMutation: mocks.useNavigatingMutation,
}));

vi.mock('@/features/inventory/inventory.api', () => ({
  requestCreateInventory: vi.fn(),
  requestJoinInventory: vi.fn(),
}));

import { useCreateInventory, useJoinInventory } from '@/features/inventory/inventory.queries';
import { requestCreateInventory, requestJoinInventory } from '@/features/inventory/inventory.api';

describe('features inventory queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useNavigatingMutation.mockReturnValue({ mutate: vi.fn() });
  });

  it('configures create inventory mutation', async () => {
    useCreateInventory();

    const config = mocks.useNavigatingMutation.mock.calls[0][0];
    expect(config.redirectTo).toBe('/dashboard');
    await config.mutationFn('Main');
    expect(requestCreateInventory).toHaveBeenCalledWith('Main');
  });

  it('configures join inventory mutation', async () => {
    useJoinInventory();

    const config = mocks.useNavigatingMutation.mock.calls[0][0];
    expect(config.redirectTo).toBe('/dashboard');
    expect(config.successMessage).toBe('You have successfully joined the inventory');
    await config.mutationFn('ABC123');
    expect(requestJoinInventory).toHaveBeenCalledWith('ABC123');
  });
});
