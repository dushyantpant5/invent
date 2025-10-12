import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

import { ServiceError } from '../lib';
import AuthService from '../auth/auth.service';

import prisma from '@/repositories';
import { InventoryRepository } from '@/repositories/inventory.repo';
import { IInventoryResponseDTO } from '@/types/inventory/inventory.types';
import { DatabaseError } from '@/repositories/lib';
import { decryptInventoryData } from '@/helpers/encryption';

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
      const validatedInventory = await InventoryRepository.verifyAndGetInventory({ code });

      if (!validatedInventory) {
        console.error('[joinInventory] Invalid code provided:', { code });
        return null;
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
        console.log('[joinInventory] User already has a role. Returning existing inventory info.');
        return {
          inventoryId: userRoleExists.inventoryId,
          inventoryName: userRoleExists.inventoryName,
        };
      }

      const createdInventory = await prisma.$transaction(async (tx) => {
        const inventoryData = await InventoryRepository.createInventoryRoleData({
          inventoryId: validatedInventory.inventoryId,
          userId: userData.id,
          role: 'staff',
          tx,
        });
        return inventoryData;
      });

      const result = {
        inventoryId: createdInventory.inventoryId,
        inventoryName: createdInventory.name,
      };

      return result;
    } catch (error) {
      console.error('[joinInventory] ERROR - full details', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'No stack',
      });

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError('An unexpected error occurred while creating inventory');
    }
  }

  public static async getInventorySession(): Promise<{ inventoryId: string }> {
    const cookieStore = await cookies();
    const encryptedCookieData = cookieStore.get('inventoryData')?.value;
    if (!encryptedCookieData) {
      throw new ServiceError('No inventory data found in cookies');
    }
    const inventoryData = await decryptInventoryData(encryptedCookieData);
    if (!inventoryData) {
      throw new ServiceError('Invalid inventory data');
    }
    return {
      inventoryId: inventoryData,
    };
  }

  public static async getUserRoleForInventory(data: {
    userId: string;
    inventoryId: string;
  }): Promise<{ role: string }> {
    const userRoleExists = await InventoryRepository.checkUserRoleInInventory({
      inventoryId: data.inventoryId,
      userId: data.userId,
    });
    if (!userRoleExists) throw new ServiceError('User Role for this inventory does not exist');
    return {
      role: userRoleExists.role,
    };
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
