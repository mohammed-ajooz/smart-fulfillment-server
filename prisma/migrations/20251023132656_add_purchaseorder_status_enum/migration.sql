/*
  Warnings:

  - The `status` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING_VENDOR_CONFIRM', 'CONFIRMED_BY_VENDOR', 'READY_FOR_PICKUP', 'IN_TRANSIT_TO_WAREHOUSE', 'RECEIVED_AT_WAREHOUSE', 'STORED_IN_BIN', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING_VENDOR_CONFIRM';
