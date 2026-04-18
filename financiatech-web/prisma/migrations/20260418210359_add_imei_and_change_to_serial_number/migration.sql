/*
  Warnings:

  - You are about to drop the column `imei` on the `device_syncs` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `devices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `device_syncs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imei]` on the table `devices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serialNumber` to the `device_syncs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imei` to the `devices` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "device_syncs_imei_key";

-- DropIndex
DROP INDEX "devices_serialNumber_key";

-- AlterTable
ALTER TABLE "device_syncs" DROP COLUMN "imei",
ADD COLUMN     "serialNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "serialNumber",
ADD COLUMN     "imei" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "device_syncs_serialNumber_key" ON "device_syncs"("serialNumber");

-- CreateIndex
CREATE INDEX "idx_device_syncs_serial" ON "device_syncs"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "devices_imei_key" ON "devices"("imei");
