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
  static async verifyAndGetInventory(data: InventoryCode): Promise<IInventoryDatabaseResponseDTO> {
    try {
      const { code } = data;
      if (!code) {
        throw new DatabaseError('Invalid code');
      }
      const inventoryExists = await prisma.inventory_codes.findUnique({
        where: { code: code },
      });
      if (!inventoryExists) {
        throw new DatabaseError('Wrong Inventory Code');
      }
      return { inventoryId: inventoryExists.inventoryId };
    } catch {
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
    try {
      const { inventoryId, userId, role, tx } = data;

      if (!inventoryId || !userId || !role) {
        throw new DatabaseError('Invalid inventory ID, user ID or role');
      }

      const userExists = await tx.users.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new DatabaseError('User does not exist');
      }

      const userRoleExists = await tx.user_inventory_roles.findFirst({
        where: {
          inventory_id: inventoryId,
          user_id: userId,
        },
      });

      if (userRoleExists) {
        throw new DatabaseError('User already has a role in this inventory');
      }

      const inventoryData = await tx.inventories.findUnique({
        where: { id: inventoryId },
      });

      if (!inventoryData) {
        throw new DatabaseError('Inventory not found');
      }

      await tx.user_inventory_roles.create({
        data: {
          inventory_id: inventoryData.id,
          user_id: userId,
          role,
        },
      });

      return {
        inventoryId: inventoryData.id,
        name: inventoryData.name,
      };
    } catch (error) {
      console.error('[createInventoryRoleData] Error:', error);
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
