import { Prisma, UserRole } from '@prisma/client';

import { INextResponse } from '..';

export interface ICreateInventoryDatabaseRequestDTO {
  name: string;
  tx: Prisma.TransactionClient;
}

export type TInventoryAxiosResponseDTO = INextResponse<{
  inventoryId: string;
  inventoryName: string;
}>;

export type IInventoryResponseDTO = {
  inventoryId: string;
  inventoryName: string;
} | null;

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
