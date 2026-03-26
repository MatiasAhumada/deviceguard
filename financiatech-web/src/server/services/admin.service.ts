import { AuthRepository } from "../repository/auth.repository";
import { AdminRepository } from "../repository/admin.repository";
import { bcryptUtils } from "@/utils/bcrypt.util";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { AUTH_MESSAGES } from "@/constants/auth.constant";
import { prisma } from "@/lib/prisma";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export class AdminService {
  private authRepository: AuthRepository;
  private adminRepository: AdminRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.adminRepository = new AdminRepository();
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    superAdminId: string;
  }) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
      });
    }

    const hashedPassword = await bcryptUtils.hash(data.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });

      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          superAdminId: data.superAdminId,
        },
      });

      return tx.admin.findUnique({
        where: { id: admin.id },
        include: {
          user: true,
          superAdmin: true,
        },
      });
    });
  }

  async findBySuperAdminId(superAdminId: string, search?: string) {
    return this.adminRepository.findBySuperAdminId(superAdminId, search);
  }

  async findById(id: string) {
    const admin = await this.adminRepository.findById(id);

    if (!admin) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Admin no encontrado",
      });
    }

    return admin;
  }

  async getStats(superAdminId: string) {
    return this.adminRepository.getStatsBySuperAdminId(superAdminId);
  }
}

export const adminService = new AdminService();
