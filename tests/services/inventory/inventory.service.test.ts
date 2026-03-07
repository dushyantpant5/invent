import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn(),
  };

  const prisma = {
    $transaction: vi.fn(),
  };

  const InventoryRepository = {
    checkUserInventoryExists: vi.fn(),
    createInventory: vi.fn(),
    createInventoryCodeData: vi.fn(),
    createInventoryRoleData: vi.fn(),
    checkInventoryCodeExists: vi.fn(),
    verifyAndGetInventory: vi.fn(),
    checkUserRoleInInventory: vi.fn(),
  };

  const AuthService = {
    getUserSession: vi.fn(),
  };

  const decryptInventoryData = vi.fn();

  return { cookieStore, prisma, InventoryRepository, AuthService, decryptInventoryData };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock('@/repositories', () => ({
  default: mocks.prisma,
}));

vi.mock('@/repositories/inventory.repo', () => ({
  InventoryRepository: mocks.InventoryRepository,
}));

vi.mock('@/services/auth/auth.service', () => ({
  default: mocks.AuthService,
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptInventoryData: mocks.decryptInventoryData,
}));

import { ServiceError } from '@/services/lib';
import { InventoryService } from '@/services/inventory/inventory.service';

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.AuthService.getUserSession.mockResolvedValue({ id: 'u1' });
    mocks.prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}));
    mocks.InventoryRepository.checkInventoryCodeExists.mockResolvedValue(false);
  });

  it('returns existing inventory if user already has one with same name', async () => {
    mocks.InventoryRepository.checkUserInventoryExists.mockResolvedValueOnce({
      inventoryId: 'inv-1',
      inventoryName: 'Main',
    });

    const result = await InventoryService.createInventory({ name: 'Main' });

    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
    expect(mocks.InventoryRepository.createInventory).not.toHaveBeenCalled();
  });

  it('creates new inventory with code and role', async () => {
    mocks.InventoryRepository.checkUserInventoryExists.mockResolvedValueOnce(null);
    mocks.InventoryRepository.createInventory.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    mocks.InventoryRepository.createInventoryCodeData.mockResolvedValueOnce(undefined);
    mocks.InventoryRepository.createInventoryRoleData.mockResolvedValueOnce({
      inventoryId: 'inv-1',
      name: 'Main',
    });
    mocks.InventoryRepository.checkInventoryCodeExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await InventoryService.createInventory({ name: 'Main' });

    expect(mocks.InventoryRepository.checkInventoryCodeExists).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('maps unknown create errors to ServiceError', async () => {
    mocks.InventoryRepository.checkUserInventoryExists.mockResolvedValueOnce(null);
    mocks.prisma.$transaction.mockRejectedValueOnce(new Error('boom'));

    await expect(InventoryService.createInventory({ name: 'Main' })).rejects.toMatchObject({
      message: 'Failed to create inventory. Please try again',
      statusCode: 500,
    });
  });

  it('returns null when join code is invalid', async () => {
    mocks.InventoryRepository.verifyAndGetInventory.mockResolvedValueOnce(null);
    await expect(InventoryService.joinInventory({ code: 'BAD123' })).resolves.toBeNull();
  });

  it('returns existing inventory role on join when already in inventory', async () => {
    mocks.InventoryRepository.verifyAndGetInventory.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    mocks.InventoryRepository.checkUserRoleInInventory.mockResolvedValueOnce({
      inventoryId: 'inv-1',
      inventoryName: 'Main',
      role: 'admin',
      userId: 'u1',
    });

    const result = await InventoryService.joinInventory({ code: 'ABC123' });

    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('adds staff role when joining first time', async () => {
    mocks.InventoryRepository.verifyAndGetInventory.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    mocks.InventoryRepository.checkUserRoleInInventory.mockResolvedValueOnce(null);
    mocks.prisma.$transaction.mockResolvedValueOnce({ inventoryId: 'inv-1', name: 'Main' });

    const result = await InventoryService.joinInventory({ code: 'ABC123' });

    expect(result).toEqual({ inventoryId: 'inv-1', inventoryName: 'Main' });
  });

  it('maps unknown join errors to ServiceError', async () => {
    mocks.InventoryRepository.verifyAndGetInventory.mockResolvedValueOnce({ inventoryId: 'inv-1' });
    mocks.InventoryRepository.checkUserRoleInInventory.mockResolvedValueOnce(null);
    mocks.prisma.$transaction.mockRejectedValueOnce(new Error('boom'));

    await expect(InventoryService.joinInventory({ code: 'ABC123' })).rejects.toMatchObject({
      message: 'Failed to join inventory. Please try again',
      statusCode: 500,
    });
  });

  it('returns inventory session from cookie', async () => {
    mocks.cookieStore.get.mockImplementation((key: string) =>
      key === 'inventoryData' ? { value: 'encrypted-data' } : undefined
    );
    mocks.decryptInventoryData.mockResolvedValueOnce('inv-1');

    await expect(InventoryService.getInventorySession()).resolves.toEqual({ inventoryId: 'inv-1' });
  });

  it('throws when inventory cookie is missing', async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);
    await expect(InventoryService.getInventorySession()).rejects.toBeInstanceOf(ServiceError);
  });

  it('throws when decrypted inventory id is invalid', async () => {
    mocks.cookieStore.get.mockReturnValue({ value: 'encrypted-data' });
    mocks.decryptInventoryData.mockResolvedValueOnce('');
    await expect(InventoryService.getInventorySession()).rejects.toMatchObject({
      message: 'Invalid inventory session data',
      statusCode: 400,
    });
  });

  it('returns user role for inventory', async () => {
    mocks.InventoryRepository.checkUserRoleInInventory.mockResolvedValueOnce({
      userId: 'u1',
      inventoryId: 'inv-1',
      role: 'admin',
      inventoryName: 'Main',
    });

    await expect(
      InventoryService.getUserRoleForInventory({ userId: 'u1', inventoryId: 'inv-1' })
    ).resolves.toEqual({ role: 'admin' });
  });

  it('throws when user has no role in inventory', async () => {
    mocks.InventoryRepository.checkUserRoleInInventory.mockResolvedValueOnce(null);

    await expect(
      InventoryService.getUserRoleForInventory({ userId: 'u1', inventoryId: 'inv-1' })
    ).rejects.toMatchObject({
      message: 'User does not have access to this inventory',
      statusCode: 403,
    });
  });
});
