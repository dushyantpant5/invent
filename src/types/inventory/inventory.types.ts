import { Prisma, UserRole } from '@prisma/client';

export interface ICreateInventoryDatabaseRequestDTO {
  name: string;
  tx: Prisma.TransactionClient;
}

export type IInventoryDatabaseResponseDTO = {
  inventoryId: string;
} | null;

export interface IInventoryCodeDatabaseRequestDTO {
  inventoryId: string;
  code: string;
  tx: Prisma.TransactionClient;
}

export type IInventoryRoleDatabaseRequestDTO = {
  inventoryId: string;
  userId: string;
  role: UserRole;
  tx: Prisma.TransactionClient;
};
