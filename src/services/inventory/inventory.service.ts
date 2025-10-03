import { randomBytes } from 'crypto';

import { ServiceError } from '../lib';
import AuthService from '../auth/auth.service';

import prisma from '@/repositories';
import { InventoryRepository } from '@/repositories/inventory.repo';
import { IInventoryResponseDTO } from '@/types/inventory/inventory.types';

export class InventoryService {
  static async createInventory(inventoryData: {
    inventoryName: string;
  }): Promise<IInventoryResponseDTO> {
    if (!inventoryData || !inventoryData.inventoryName) {
      throw new ServiceError('Invalid inventory data');
    }
    const userSession = await AuthService.getUserSession();
    const userId = userSession?.id;
    if (!userId) {
      throw new ServiceError('User session not found');
    }

    try {
      const createdInventoryId = await prisma.$transaction(async (tx) => {
        // Create inventory in the database
        const inventory = await InventoryRepository.createInventory({
          name: inventoryData.inventoryName,
          tx,
        });

        if (!inventory || !inventory.inventoryId) {
          throw new ServiceError('Failed to create inventory');
        }

        // Create inventory code database
        const inventoryCode = await this.genereateUniqueInventoryCode();

        await InventoryRepository.createInventoryCodeData({
          inventoryId: inventory.inventoryId,
          code: inventoryCode,
          tx,
        });

        // Create inventory role data
        await InventoryRepository.createInventoryRoleData({
          inventoryId: inventory.inventoryId,
          userId: userId,
          role: 'admin', // Default role for the creator of the inventory
          tx,
        });

        return inventory;
      });
      return {
        inventoryId: createdInventoryId.inventoryId,
        inventoryName: inventoryData.inventoryName,
      };
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw new ServiceError(`Unexpected: ${err ?? String(err)}`);
    }
  }
  public static async joinInventory(code: string): Promise<{ inventoryId: string; name: string }> {
    try {
      const validateInventory = await InventoryRepository.verifyInventory({
        code: code,
      });
      if (!validateInventory) {
        throw new ServiceError('Entered Inventory code is Incorrect');
      }
      const userData = await AuthService.getUserSession();

      if (!userData?.id) {
        throw new ServiceError('User session not found');
      }
      const createdInventory = await prisma.$transaction(async (tx) => {
        const inventoryData = await InventoryRepository.createInventoryRoleData({
          inventoryId: validateInventory.inventoryId,
          userId: userData?.id,
          role: 'staff',
          tx,
        });
        return inventoryData;
      });

      return {
        inventoryId: createdInventory.inventoryId,
        name: createdInventory.name,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('An unexpected error occurred while creating inventory');
    }
  }
  private static async genereateUniqueInventoryCode(): Promise<string> {
    let code = '';
    let exists = true;
    while (exists) {
      code = this.generateRandomInventoryCode(6);
      exists = await InventoryRepository.checkInventoryCodeExists(code);
    }
    return code;
  }
  private static generateRandomInventoryCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    return Array.from(bytes, (byte) => chars.charCodeAt(byte % chars.length))
      .map((code) => String.fromCharCode(code))
      .join('');
  }
}
