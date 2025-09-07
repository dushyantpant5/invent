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
  // static async joinInventory(data:IInventoryRoleDatabaseRequestDTOWithoutTx): Promise<void> {
  //   try{
  //    const {inventoryId, userId, role} = data;
  //    if(!inventoryId || !userId || !role) {
  //       throw new DatabaseError('Invalid inventory ID, user ID or role');
  //    }
  //   }

  // }
  static async createInventoryRoleData(
    data: IInventoryRoleDatabaseRequestDTO
  ): Promise<{ inventoryId: string; name: string }> {
    try {
      const { inventoryId, userId, role, tx } = data;
      if (!inventoryId || !userId || !role) {
        throw new DatabaseError('Invalid inventory ID, user ID or role');
      }
      //Check if the user exists
      const userExists = await tx.users.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        throw new DatabaseError('User does not exist');
      }
      // Check is the data exists for user_inventory_roles table for this user
      const userRoleExists = await tx.user_inventory_roles.findFirst({
        where: {
          inventory_id: inventoryId,
          user_id: userId,
        },
      });

      if (userRoleExists) {
        throw new DatabaseError('User already has a role in this inventory');
      }
      console.log('inventoryId', inventoryId);
      const invertoryData = await prisma.inventories.findUnique({
        where: { id: inventoryId },
      });
      console.log('inventoryData', invertoryData, inventoryId, userId, role);
      console.log('userid', userId);
      if (!invertoryData) {
        throw new DatabaseError('Inventory not found');
      }
      console.log('tell');
      await tx.user_inventory_roles.create({
        data: {
          inventory_id: invertoryData.id,
          user_id: userId,
          role,
        },
      });
      console.log('else');
      return {
        inventoryId: invertoryData?.id,
        name: invertoryData?.name,
      };
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
