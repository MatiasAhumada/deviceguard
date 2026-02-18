import { DeviceSyncRepository } from "../repository/deviceSync.repository";
import { SaleRepository } from "../repository/sale.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { IDeviceSync } from "@/types";
import httpStatus from "http-status";
import { DeviceStatus } from "@prisma/client";

export class DeviceActivationService {
  private deviceSyncRepository: DeviceSyncRepository;
  private saleRepository: SaleRepository;

  constructor() {
    this.deviceSyncRepository = new DeviceSyncRepository();
    this.saleRepository = new SaleRepository();
  }

  async activate(
    activationCode: string,
    imei: string
  ): Promise<{
    success: boolean;
    device: IDeviceSync["device"];
    sync: IDeviceSync;
  }> {
    const sale = await this.saleRepository.findByActivationCode(activationCode);

    if (!sale) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Código de activación inválido",
      });
    }

    if (sale.device.status === DeviceStatus.SOLD_SYNCED) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "El dispositivo ya está activado",
      });
    }

    const existingSync = await this.deviceSyncRepository.findByImei(imei);

    if (existingSync) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "Este IMEI ya está registrado",
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: sale.deviceId },
        data: { status: DeviceStatus.SOLD_SYNCED },
      });

      const sync = await tx.deviceSync.create({
        data: {
          deviceId: sale.deviceId,
          imei,
        },
        include: {
          device: true,
        },
      });

      return {
        success: true,
        device: sale.device,
        sync,
      };
    });
  }

  async checkStatus(imei: string) {
    const sync = await this.deviceSyncRepository.findByImei(imei);

    if (!sync) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    await this.deviceSyncRepository.updateLastPing(sync.deviceId);

    return {
      blocked: sync.device.status === DeviceStatus.BLOCKED,
      status: sync.device.status,
      message:
        sync.device.status === DeviceStatus.BLOCKED
          ? "Dispositivo bloqueado por mora en pagos"
          : "Dispositivo activo",
    };
  }
}

export const deviceActivationService = new DeviceActivationService();
