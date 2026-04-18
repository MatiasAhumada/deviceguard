import { prisma } from "@/lib/prisma";
import { IDeviceSync, DeviceStatusCheckResult } from "@/types";
import { DeviceStatus } from "@prisma/client";

interface DeviceSyncWithDetails {
  deviceId: string;
  device: {
    status: DeviceStatus;
    name: string;
    admin: {
      user: {
        name: string;
      };
    };
  };
}

interface DeviceSyncStatusRaw {
  deviceId: string;
  status: DeviceStatus;
  deviceName: string;
  adminName: string;
}

export class DeviceSyncRepository {
  async create(deviceId: string, serialNumber: string): Promise<IDeviceSync> {
    return prisma.deviceSync.create({
      data: {
        deviceId,
        serialNumber,
      },
      include: {
        device: true,
      },
    });
  }

  async findBySerialNumber(serialNumber: string): Promise<IDeviceSync | null> {
    return prisma.deviceSync.findUnique({
      where: { serialNumber },
      include: {
        device: true,
      },
    });
  }

  async findByDeviceId(deviceId: string): Promise<IDeviceSync | null> {
    return prisma.deviceSync.findUnique({
      where: { deviceId },
      include: {
        device: true,
      },
    });
  }

  async updateLastPing(deviceId: string) {
    return prisma.deviceSync.update({
      where: { deviceId },
      data: { lastPing: new Date() },
    });
  }

  async findDeviceStatusBySerialNumber(
    serialNumber: string
  ): Promise<DeviceSyncStatusRaw | null> {
    const result = (await prisma.deviceSync.findUnique({
      where: { serialNumber },
      select: {
        deviceId: true,
        device: {
          select: {
            status: true,
            name: true,
            admin: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as DeviceSyncWithDetails | null;

    if (!result) {
      return null;
    }

    return {
      deviceId: result.deviceId,
      status: result.device.status,
      deviceName: result.device.name,
      adminName: result.device.admin.user.name,
    };
  }
}
