import { randomBytes } from 'crypto';

import { ServiceError } from '../lib';
import AuthService from '../auth/auth.service';

import prisma from '@/repositories';
import { InventoryRepository } from '@/repositories/inventory.repo';
import { IInventoryResponseDTO } from '@/types/inventory/inventory.types';
import { DatabaseError } from '@/repositories/lib';

export class InventoryService {
  public static async createInventory(data: { name: string }): Promise<IInventoryResponseDTO> {
    if (!data || data.name.length === 0) return null;

    try {
      // Inventory-User Data
      const userData = await AuthService.getUserSession();
      if (!userData?.id) {
        throw new ServiceError('User session not found');
      }

      const userInventoryExists = await InventoryRepository.checkUserInventoryExists({
        userId: userData.id,
        name: data.name,
      });

      if (userInventoryExists) {
        return {
          inventoryId: userInventoryExists.inventoryId,
          inventoryName: userInventoryExists.inventoryName,
        };
      }

      const createdInventory = await prisma.$transaction(async (tx) => {
        try {
          const newInventory = await InventoryRepository.createInventory({ name: data.name, tx });

          if (!newInventory || !newInventory.inventoryId) {
            throw new ServiceError('Failed to create new inventory');
          }

          const codeForNewInventory = await this.genereateUniqueInventoryCode();

          await InventoryRepository.createInventoryCodeData({
            inventoryId: newInventory.inventoryId,
            code: codeForNewInventory,
            tx,
          });

          await InventoryRepository.createInventoryRoleData({
            inventoryId: newInventory.inventoryId,
            userId: userData.id,
            role: 'admin',
            tx,
          });

          return {
            inventoryId: newInventory.inventoryId,
          };
        } catch (error) {
          console.error('Error details:', error);
          throw error; // rethrow so Prisma rolls back
        }
      });
      return {
        inventoryName: data.name,
        inventoryId: createdInventory.inventoryId,
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new ServiceError('An unexpected error occurred while creating inventory');
    }
  }
  public static async joinInventory(data: { code: string }): Promise<IInventoryResponseDTO> {
    const { code } = data;
    try {
      const validatedInventory = await InventoryRepository.verifyAndGetInventory({ code: code });
      if (!validatedInventory) {
        throw new ServiceError('Entered code is incorrect');
      }
      const userData = await AuthService.getUserSession();

      if (!userData?.id) {
        throw new ServiceError('User session not found');
      }

      const userRoleExists = await InventoryRepository.checkUserRoleInInventory({
        inventoryId: validatedInventory.inventoryId,
        userId: userData.id,
      });

      if (userRoleExists) {
        return {
          inventoryId: userRoleExists.inventoryId,
          inventoryName: userRoleExists.inventoryName,
        };
      }

      const createdInventory = await prisma.$transaction(async (tx) => {
        const inventoryData = await InventoryRepository.createInventoryRoleData({
          inventoryId: validatedInventory.inventoryId,
          userId: userData?.id,
          role: 'staff',
          tx,
        });
        return inventoryData;
      });

      return {
        inventoryId: createdInventory.inventoryId,
        inventoryName: createdInventory.name,
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
