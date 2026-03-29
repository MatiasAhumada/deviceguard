import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const sendNotificationSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  message: z.string().min(1, "El mensaje es requerido"),
  type: z.nativeEnum(NotificationType).default(NotificationType.WARNING_1),
});

export type SendNotificationDto = z.infer<typeof sendNotificationSchema>;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.WARNING_1]: "Advertencia 1",
  [NotificationType.WARNING_2]: "Advertencia 2",
  [NotificationType.BLOCKED]: "Bloqueo",
};
