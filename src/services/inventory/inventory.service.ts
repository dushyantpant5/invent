import { cookies } from 'next/headers';

import { ServiceError } from '../lib';
import AuthService from '../auth/auth.service';

import prisma from '@/repositories';
import { InventoryRepository } from '@/repositories/inventory.repo';
import { IInventoryResponseDTO } from '@/types/inventory/inventory.types';
import { DatabaseError } from '@/repositories/lib';
import { decryptInventoryData } from '@/lib/crypto/encryption';

export class InventoryService {
  public static async createInventory(data: { name: string }): Promise<IInventoryResponseDTO> {
    const userData = await AuthService.getUserSession();

    const existing = await InventoryRepository.checkUserInventoryExists({
      userId: userData.id,
      name: data.name,
    });

    if (existing) {
      return { inventoryId: existing.inventoryId, inventoryName: existing.inventoryName };
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const newInventory = await InventoryRepository.createInventory({ name: data.name, tx });

        if (!newInventory?.inventoryId) {
          throw new ServiceError('Failed to create inventory', 500);
        }

        const code = await this.generateUniqueInventoryCode();

        await InventoryRepository.createInventoryCodeData({
          inventoryId: newInventory.inventoryId,
          code,
          tx,
        });

        await InventoryRepository.createInventoryRoleData({
          inventoryId: newInventory.inventoryId,
          userId: userData.id,
          role: 'admin',
          tx,
        });

        return { inventoryId: newInventory.inventoryId };
      });

      return { inventoryId: created.inventoryId, inventoryName: data.name };
    } catch (error) {
      if (error instanceof ServiceError || error instanceof DatabaseError) throw error;
      throw new ServiceError('Failed to create inventory. Please try again', 500);
    }
  }

  public static async joinInventory(data: { code: string }): Promise<IInventoryResponseDTO> {
    const validatedInventory = await InventoryRepository.verifyAndGetInventory({ code: data.code });

    if (!validatedInventory) {
      return null;
    }

    const userData = await AuthService.getUserSession();

    const existingRole = await InventoryRepository.checkUserRoleInInventory({
      inventoryId: validatedInventory.inventoryId,
      userId: userData.id,
    });

    if (existingRole) {
      return { inventoryId: existingRole.inventoryId, inventoryName: existingRole.inventoryName };
    }

    try {
      const inventoryData = await prisma.$transaction(async (tx) =>
        InventoryRepository.createInventoryRoleData({
          inventoryId: validatedInventory.inventoryId,
          userId: userData.id,
          role: 'staff',
          tx,
        })
      );

      return { inventoryId: inventoryData.inventoryId, inventoryName: inventoryData.name };
    } catch (error) {
      if (error instanceof ServiceError || error instanceof DatabaseError) throw error;
      throw new ServiceError('Failed to join inventory. Please try again', 500);
    }
  }

  public static async getInventorySession(): Promise<{ inventoryId: string }> {
    const cookieStore = await cookies();
    const encryptedData = cookieStore.get('inventoryData')?.value;
    if (!encryptedData) {
      throw new ServiceError('No inventory selected. Please select an inventory', 404);
    }

    const inventoryId = await decryptInventoryData(encryptedData);
    if (!inventoryId) {
      throw new ServiceError('Invalid inventory session data', 400);
    }

    return { inventoryId };
  }

  public static async getUserRoleForInventory(data: {
    userId: string;
    inventoryId: string;
  }): Promise<{ role: string }> {
    const userRole = await InventoryRepository.checkUserRoleInInventory({
      inventoryId: data.inventoryId,
      userId: data.userId,
    });

    if (!userRole) {
      throw new ServiceError('User does not have access to this inventory', 403);
    }

    return { role: userRole.role };
  }

  private static async generateUniqueInventoryCode(): Promise<string> {
    let code = '';
    let exists = true;
    while (exists) {
      code = this.generateRandomInventoryCode(6);
      exists = await InventoryRepository.checkInventoryCodeExists(code);
    }
    return code;
  }

  private static generateRandomInventoryCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomValues, (b) => chars[b % chars.length]).join('');
  }
}
