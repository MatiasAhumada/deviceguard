import clientAxios from "@/utils/clientAxios.util";
import { CreateAdminDto } from "@/schemas/admin.schema";
import { API_ROUTES } from "@/constants/routes";

export const adminService = {
  async create(dto: CreateAdminDto) {
    const { data } = await clientAxios.post(API_ROUTES.ADMINS, dto);
    return data;
  },

  async getAll(search?: string) {
    const params = search ? { search } : {};
    const { data } = await clientAxios.get(API_ROUTES.ADMINS, { params });
    return data;
  },

  async getStats() {
    const { data } = await clientAxios.get(API_ROUTES.ADMINS_STATS);
    return data;
  },
};
