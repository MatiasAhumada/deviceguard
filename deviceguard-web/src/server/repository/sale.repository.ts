import { prisma } from "@/lib/prisma";
import { ISale } from "@/types";

export class SaleRepository {
  async findByActivationCode(activationCode: string): Promise<ISale | null> {
    return prisma.sale.findUnique({
      where: { activationCode },
      include: {
        device: true,
        client: true,
      },
    });
  }

  async findByDeviceId(deviceId: string): Promise<ISale | null> {
    return prisma.sale.findUnique({
      where: { deviceId },
      include: {
        device: true,
        client: true,
      },
    });
  }
}
