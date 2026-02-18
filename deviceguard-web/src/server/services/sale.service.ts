import { SaleRepository } from "../repository/sale.repository";
import { DevicesRepository } from "../repository/devices.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { ISale } from "@/types";
import httpStatus from "http-status";
import { DeviceStatus } from "@prisma/client";

function generateActivationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class SaleService {
  private saleRepository: SaleRepository;
  private devicesRepository: DevicesRepository;

  constructor() {
    this.saleRepository = new SaleRepository();
    this.devicesRepository = new DevicesRepository();
  }

  async create(data: {
    deviceId: string;
    clientId: string;
    totalAmount: number;
    installments: number;
    firstWarningDay: number;
    secondWarningDay: number;
    blockDay: number;
  }): Promise<ISale> {
    const device = await this.devicesRepository.findById(data.deviceId);

    if (!device) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    if (device.clientId) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "El dispositivo ya está vendido",
      });
    }

    const monthlyAmount = data.totalAmount / data.installments;
    const activationCode = generateActivationCode();

    return prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: data.deviceId },
        data: {
          clientId: data.clientId,
          status: DeviceStatus.SOLD_PENDING,
        },
      });

      const sale = await tx.sale.create({
        data: {
          deviceId: data.deviceId,
          clientId: data.clientId,
          totalAmount: data.totalAmount,
          installments: data.installments,
          monthlyAmount,
          activationCode,
        },
        include: {
          device: true,
          client: true,
        },
      });

      await tx.paymentPlan.create({
        data: {
          deviceId: data.deviceId,
          totalAmount: data.totalAmount,
          installments: data.installments,
          monthlyAmount,
          startDate: new Date(),
          endDate: new Date(
            Date.now() + data.installments * 30 * 24 * 60 * 60 * 1000
          ),
        },
      });

      const installmentsData = Array.from(
        { length: data.installments },
        (_, i) => ({
          deviceId: data.deviceId,
          number: i + 1,
          amount: monthlyAmount,
          dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        })
      );

      await tx.installment.createMany({
        data: installmentsData,
      });

      await tx.blockRule.create({
        data: {
          deviceId: data.deviceId,
          firstWarningDay: data.firstWarningDay,
          secondWarningDay: data.secondWarningDay,
          blockDay: data.blockDay,
        },
      });

      return sale;
    });
  }

  async findByActivationCode(activationCode: string): Promise<ISale | null> {
    return this.saleRepository.findByActivationCode(activationCode);
  }
}

export const saleService = new SaleService();
