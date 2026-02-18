-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WARNING_1', 'WARNING_2', 'BLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeviceStatus" ADD VALUE 'SOLD_PENDING';
ALTER TYPE "DeviceStatus" ADD VALUE 'SOLD_SYNCED';

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "installments" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "activationCode" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_syncs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPing" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_deviceId_key" ON "sales"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_activationCode_key" ON "sales"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "device_syncs_deviceId_key" ON "device_syncs"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "device_syncs_imei_key" ON "device_syncs"("imei");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_syncs" ADD CONSTRAINT "device_syncs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
