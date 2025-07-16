/*
  Warnings:

  - The values [super_admin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'staff');
ALTER TABLE "user_inventory_roles" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user_inventory_roles" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "user_inventory_roles" ALTER COLUMN "role" SET DEFAULT 'admin';
COMMIT;

-- CreateTable
CREATE TABLE "inventory_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventoryId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_codes_code_key" ON "inventory_codes"("code");

-- CreateIndex
CREATE INDEX "inventory_codes_inventoryId_idx" ON "inventory_codes"("inventoryId");

-- AddForeignKey
ALTER TABLE "inventory_codes" ADD CONSTRAINT "inventory_codes_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
