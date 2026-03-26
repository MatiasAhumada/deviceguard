import clientAxios from "@/utils/clientAxios.util";
import { CreateFinancingPlanDto } from "@/schemas/financingPlan.schema";
import { API_ROUTES } from "@/constants/routes";

export const financingPlanService = {
  async create(dto: CreateFinancingPlanDto) {
    const { data } = await clientAxios.post(API_ROUTES.FINANCING_PLANS, dto);
    return data;
  },

  async update(id: string, dto: CreateFinancingPlanDto) {
    const { data } = await clientAxios.put(
      `${API_ROUTES.FINANCING_PLANS}/${id}`,
      dto
    );
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(
      `${API_ROUTES.FINANCING_PLANS}/${id}`
    );
    return data;
  },

  async getAll() {
    const { data } = await clientAxios.get(API_ROUTES.FINANCING_PLANS);
    return data;
  },
};
