import clientAxios from '@/src/config/axios.config';
import { API_ENDPOINTS } from '@/src/constants/api.constant';
import { ProvisioningResponse } from '@/src/types/provisioning.types';

export const provisioningService = {
  verifyCode: async (code: string): Promise<ProvisioningResponse> => {
    const response = await clientAxios.post<ProvisioningResponse>(
      API_ENDPOINTS.DEVICES.PROVISION,
      { code }
    );
    return response.data;
  },
};
