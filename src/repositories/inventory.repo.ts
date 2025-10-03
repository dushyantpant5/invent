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
  static async verifyInventory(data: InventoryCode): Promise<IInventoryDatabaseResponseDTO> {
    try {
      const { code } = data;
      if (!code) {
        throw new DatabaseError('Invalid inventory ID or code');
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

  static async createInventoryRoleData(
    data: IInventoryRoleDatabaseRequestDTO
  ): Promise<{ inventoryId: string; name: string }> {
    const { inventoryId, userId, role, tx } = data;

    // Validate input early
    if (!tx) {
      throw new DatabaseError('Transaction (tx) is required');
    }
    if (!inventoryId || !userId || !role) {
      throw new DatabaseError('Invalid inventory ID, user ID or role');
    }

    try {
      const inventoryData = await tx.inventories.findUnique({
        where: { id: inventoryId },
        select: { id: true, name: true },
      });

      if (!inventoryData) {
        throw new DatabaseError(`Inventory not found (id=${inventoryId})`);
      }

      const userExists = await tx.users.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!userExists) {
        throw new DatabaseError(`User not found (id=${userId})`);
      }
      const userRoleExists = await tx.user_inventory_roles.findFirst({
        where: {
          inventory_id: inventoryId,
          user_id: userId,
        },
        select: { id: true },
      });
      if (userRoleExists) {
        throw new DatabaseError(`User ${userId} already has a role in inventory ${inventoryId}`);
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
    } catch (err) {
      if (err instanceof DatabaseError) {
        throw err;
      }
      throw new DatabaseError(`Failed to create inventory role: ${err ?? String(err)}`);
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
