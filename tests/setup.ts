import { vi } from 'vitest';

vi.mock('@/hooks/useInventory', () => ({
  useInventory: vi.fn(() => ({
    currentInventory: null,
    setInventory: vi.fn(),
    clearInventory: vi.fn(),
  })),
}));
