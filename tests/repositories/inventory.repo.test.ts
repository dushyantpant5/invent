import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const prisma = {
    inventory_codes: {
      findUnique: vi.fn(),
    },
    user_inventory_roles: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  return { prisma };
});

vi.mock('@/repositories', () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

import { DatabaseError } from '@/repositories/lib';
import { InventoryRepository } from '@/repositories/inventory.repo';

describe('InventoryRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates inventory and inventory code using transaction client', async () => {
    const tx = {
      inventories: {
        create: vi.fn().mockResolvedValue({ id: 'inv-1' }),
      },
      inventory_codes: {
        create: vi.fn().mockResolvedValue({}),
      },
      user_inventory_roles: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    await expect(
      InventoryRepository.createInventory({ name: 'Main', tx: tx as never })
    ).resolves.toEqual({ inventoryId: 'inv-1' });

    await expect(
      InventoryRepository.createInventoryCodeData({
        inventoryId: 'inv-1',
        code: 'ABC123',
        tx: tx as never,
      })
    ).resolves.toBeUndefined();
  });

  it('verifies inventory by code', async () => {
    mocks.prisma.inventory_codes.findUnique.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    await expect(InventoryRepository.verifyAndGetInventory({ code: 'ABC123' })).resolves.toEqual({
      inventoryId: 'inv-1',
    });

    mocks.prisma.inventory_codes.findUnique.mockResolvedValueOnce(null);
    await expect(InventoryRepository.verifyAndGetInventory({ code: 'ABC123' })).resolves.toBeNull();
  });

  it('checks role and inventory existence for user', async () => {
    mocks.prisma.user_inventory_roles.findUnique.mockResolvedValueOnce({
      user_id: 'u1',
      inventory_id: 'inv-1',
      role: 'admin',
      inventories: { name: 'Main' },
    });
    await expect(
      InventoryRepository.checkUserRoleInInventory({ userId: 'u1', inventoryId: 'inv-1' })
    ).resolves.toEqual({
      userId: 'u1',
      inventoryId: 'inv-1',
      role: 'admin',
      inventoryName: 'Main',
    });

    mocks.prisma.user_inventory_roles.findFirst.mockResolvedValueOnce({
      user_id: 'u1',
      inventory_id: 'inv-2',
      role: 'staff',
      inventories: { name: 'Shared' },
    });
    await expect(
      InventoryRepository.checkUserInventoryExists({ userId: 'u1', name: 'Shared' })
    ).resolves.toEqual({
      userId: 'u1',
      inventoryId: 'inv-2',
      role: 'staff',
      inventoryName: 'Shared',
    });
  });

  it('creates inventory role data and returns inventory info', async () => {
    const tx = {
      user_inventory_roles: {
        create: vi.fn().mockResolvedValue({}),
      },
      inventories: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'inv-1', name: 'Main' }),
      },
    };

    await expect(
      InventoryRepository.createInventoryRoleData({
        inventoryId: 'inv-1',
        userId: 'u1',
        role: 'admin',
        tx: tx as never,
      })
    ).resolves.toEqual({ inventoryId: 'inv-1', name: 'Main' });
  });

  it('checks whether a code already exists', async () => {
    mocks.prisma.inventory_codes.findUnique.mockResolvedValueOnce({ code: 'ABC123' });
    await expect(InventoryRepository.checkInventoryCodeExists('ABC123')).resolves.toBe(true);

    mocks.prisma.inventory_codes.findUnique.mockResolvedValueOnce(null);
    await expect(InventoryRepository.checkInventoryCodeExists('ABC123')).resolves.toBe(false);
  });

  it('maps db errors to DatabaseError', async () => {
    mocks.prisma.inventory_codes.findUnique.mockRejectedValueOnce(new Error('db failed'));
    await expect(
      InventoryRepository.verifyAndGetInventory({ code: 'ABC123' })
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
