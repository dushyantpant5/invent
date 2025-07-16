import { randomBytes } from 'crypto';

import { ServiceError } from '../lib';
import AuthService from '../auth/auth.service';

import prisma from '@/repositories';
import { InventoryRepository } from '@/repositories/inventory.repo';

export class InventoryService {
  static async createInventory(inventoryData: {
    inventoryName: string;
  }): Promise<{ inventoryId: string } | null> {
    if (!inventoryData || !inventoryData.inventoryName) {
      throw new ServiceError('Invalid inventory data');
    }
    try {
      const createdInventoryId = await prisma.$transaction(async (tx) => {
        // Create inventory in the database
        const inventoryId = await InventoryRepository.createInventory({
          name: inventoryData.inventoryName,
          tx,
        });

        if (!inventoryId) {
          throw new ServiceError('Failed to create inventory');
        }

        // Create inventory code database
        const inventoryCode = await this.genereateUniqueInventoryCode();
        await InventoryRepository.createInventoryCodeData({
          inventoryId: inventoryId.inventoryId,
          code: inventoryCode,
          tx,
        });

        // Create inventory role data
        const userData = await AuthService.getUserSession();
        if (!userData?.id) {
          throw new ServiceError('User session not found');
        }
        await InventoryRepository.createInventoryRoleData({
          inventoryId: inventoryId.inventoryId,
          userId: userData?.id,
          role: 'admin', // Default role for the creator of the inventory
          tx,
        });

        return inventoryId;
      });
      return createdInventoryId;
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
