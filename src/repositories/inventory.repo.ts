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
    const { inventoryId, code, tx } = data;
    try {
      await tx.inventory_codes.create({
        data: { inventoryId, code },
      });
    } catch {
      throw new DatabaseError('Failed to create inventory code');
    }
  }

  static async verifyAndGetInventory(
    data: InventoryCode
  ): Promise<IInventoryDatabaseResponseDTO | null> {
    try {
      const inventoryCode = await prisma.inventory_codes.findUnique({
        where: { code: data.code },
      });
      if (!inventoryCode) return null;
      return { inventoryId: inventoryCode.inventoryId };
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
      throw new DatabaseError('Failed to check user role in inventory');
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
      throw new DatabaseError('Failed to check user inventory');
    }
  }

  static async createInventoryRoleData(
    data: IInventoryRoleDatabaseRequestDTO
  ): Promise<{ inventoryId: string; name: string }> {
    const { inventoryId, userId, role, tx } = data;
    try {
      await tx.user_inventory_roles.create({
        data: {
          inventory_id: inventoryId,
          user_id: userId,
          role,
        },
      });

      const inventoryData = await tx.inventories.findUniqueOrThrow({
        where: { id: inventoryId },
        select: { id: true, name: true },
      });

      return { inventoryId: inventoryData.id, name: inventoryData.name };
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
