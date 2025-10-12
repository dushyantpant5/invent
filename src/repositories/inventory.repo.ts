import { DatabaseError } from './lib';
import {
  ICreateInventoryDatabaseRequestDTO,
  IInventoryCodeDatabaseRequestDTO,
  IInventoryDatabaseResponseDTO,
  IInventoryRoleDatabaseRequestDTO,
  InventoryCode,
} from '../types/inventory/inventory.types';
import prisma from '.';

export class InventoryRepository {
  static async createInventory(
    inventoryData: ICreateInventoryDatabaseRequestDTO
  ): Promise<IInventoryDatabaseResponseDTO> {
    const { name, tx } = inventoryData;
    try {
      const inventory = await tx.inventories.create({
        data: { name },
      });

      return { inventoryId: inventory.id };
    } catch {
      throw new DatabaseError('Failed to create inventory');
    }
  }
  static async createInventoryCodeData(data: IInventoryCodeDatabaseRequestDTO): Promise<void> {
    try {
      const { inventoryId, code, tx } = data;
      if (!inventoryId || !code) {
        throw new DatabaseError('Invalid inventory ID or code');
      }
      // Check if the inventory data exists for inventory_code table
      const inventoryExists = await tx.inventory_codes.findUnique({
        where: { id: inventoryId },
      });

      if (inventoryExists) {
        throw new DatabaseError('Inventory code already exists');
      }

      await tx.inventory_codes.create({
        data: {
          inventoryId,
          code,
        },
      });
    } catch {
      throw new DatabaseError('Failed to create inventory code');
    }
  }
  static async verifyAndGetInventory(
    data: InventoryCode
  ): Promise<IInventoryDatabaseResponseDTO | null> {
    const { code } = data;

    if (!code?.trim()) {
      throw new DatabaseError('Invalid code');
    }

    try {
      const inventoryExists = await prisma.inventory_codes.findUnique({
        where: { code },
      });

      if (!inventoryExists) {
        return null;
      }
      return { inventoryId: inventoryExists.inventoryId };
    } catch (error) {
      console.error('[verifyAndGetInventory] Error verifying inventory:', {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });
      throw new DatabaseError('Failed to verify inventory');
    }
  }

  static async checkUserRoleInInventory(data: {
    inventoryId: string;
    userId: string;
  }): Promise<{ userId: string; inventoryId: string; role: string; inventoryName: string } | null> {
    try {
      const userRoleObject = await prisma.user_inventory_roles.findUnique({
        where: {
          user_id_inventory_id: {
            user_id: data.userId,
            inventory_id: data.inventoryId,
          },
        },
        include: {
          inventories: true,
        },
      });
      if (!userRoleObject) return null;
      return {
        userId: userRoleObject.user_id,
        inventoryId: userRoleObject.inventory_id,
        role: userRoleObject.role,
        inventoryName: userRoleObject.inventories.name,
      };
    } catch {
      throw new DatabaseError('Failed to check role');
    }
  }

  static async checkUserInventoryExists(data: {
    userId: string;
    name: string;
  }): Promise<{ userId: string; inventoryId: string; role: string; inventoryName: string } | null> {
    try {
      const userInventoryObject = await prisma.user_inventory_roles.findFirst({
        where: {
          user_id: data.userId,
          inventories: {
            name: data.name,
          },
        },
        include: {
          inventories: true,
        },
      });
      if (!userInventoryObject) return null;
      return {
        userId: userInventoryObject.user_id,
        inventoryId: userInventoryObject.inventory_id,
        role: userInventoryObject.role,
        inventoryName: userInventoryObject.inventories.name,
      };
    } catch {
      throw new DatabaseError('Failed to check role');
    }
  }

  static async createInventoryRoleData(
    data: IInventoryRoleDatabaseRequestDTO
  ): Promise<{ inventoryId: string; name: string }> {
    const { inventoryId, userId, role, tx } = data;
    try {
      if (!inventoryId || !userId || !role) {
        console.error('[createInventoryRoleData] Validation failed', {
          inventoryId,
          userId,
          role,
        });
        throw new DatabaseError('Invalid inventory ID, user ID or role');
      }

      if (!tx) {
        console.error('[createInventoryRoleData] No tx/client provided');
        throw new DatabaseError('Database transaction/client (tx) is required');
      }

      const userExists = await tx.users.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        console.error('[createInventoryRoleData] User not found', { userId });
        throw new DatabaseError('User does not exist');
      }

      const userRoleExists = await tx.user_inventory_roles.findFirst({
        where: {
          inventory_id: inventoryId,
          user_id: userId,
        },
      });

      if (userRoleExists) {
        console.error('[createInventoryRoleData] User already has role', {
          inventoryId,
          userId,
          existingRole: userRoleExists.role,
        });
        throw new DatabaseError('User already has a role in this inventory');
      }

      const inventoryData = await tx.inventories.findUnique({
        where: { id: inventoryId },
        select: { id: true, name: true },
      });

      if (!inventoryData) {
        console.error('[createInventoryRoleData] Inventory not found', { inventoryId });
        throw new DatabaseError('Inventory not found');
      }

      try {
        await tx.user_inventory_roles.create({
          data: {
            inventory_id: inventoryData.id,
            user_id: userId,
            role,
          },
        });
      } catch (dbCreateErr) {
        throw dbCreateErr;
      }

      const result = { inventoryId: inventoryData.id, name: inventoryData.name ?? '' };
      return result;
    } catch {
      throw new DatabaseError('Failed to create inventory role');
    }
  }

  static async checkInventoryCodeExists(code: string): Promise<boolean> {
    try {
      const inventoryCode = await prisma.inventory_codes.findUnique({ where: { code } });
      return !!inventoryCode;
    } catch {
      throw new DatabaseError('Failed to check inventory code existence');
    }
  }
}
