import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AdminRepository {
  async findById(id: string) {
    return prisma.admin.findUnique({
      where: { id },
      include: {
        user: true,
        superAdmin: true,
      },
    });
  }

  async findBySuperAdminId(superAdminId: string, search?: string) {
    return prisma.admin.findMany({
      where: {
        superAdminId,
        deletedAt: null,
        ...(search && {
          user: {
            OR: [
              {
                name: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
              {
                email: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
            ],
          },
        }),
      },
      include: {
        user: true,
        devices: {
          where: { deletedAt: null },
        },
        clients: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });
  }

  async findByUserId(userId: string) {
    return prisma.admin.findUnique({
      where: { userId },
      include: {
        user: true,
        superAdmin: true,
      },
    });
  }

  async getStatsBySuperAdminId(superAdminId: string) {
    const [adminsCount, devicesCount, clientsCount] = await Promise.all([
      prisma.admin.count({ where: { superAdminId, deletedAt: null } }),
      prisma.device.count({
        where: {
          admin: { superAdminId, deletedAt: null },
          deletedAt: null,
        },
      }),
      prisma.client.count({
        where: {
          admin: { superAdminId, deletedAt: null },
          deletedAt: null,
        },
      }),
    ]);

    return {
      admins: adminsCount,
      devices: devicesCount,
      clients: clientsCount,
    };
  }
}
