import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";
import { SendNotificationDto } from "@/schemas/notification.schema";

export const notificationService = {
  async send(deviceId: string, dto: SendNotificationDto) {
    const { data } = await clientAxios.post(
      `${API_ROUTES.DEVICES}/${deviceId}/notifications`,
      dto
    );
    return data;
  },
};
